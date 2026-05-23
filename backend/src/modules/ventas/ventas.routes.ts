import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { responder, parsePaginacion } from '../../utils/respuesta.utils'
import { autenticar, autorizar, validarCuerpo } from '../../middlewares/index'
import { registrarVentaSchema } from '../../schemas/ventas.schema'
import { InventarioService } from '../../services/inventario.service'

export const ventasRouter: Router = Router()

// ── GET /dashboard ────────────────────────────────────────
ventasRouter.get('/dashboard',
  autenticar, autorizar('ADMINISTRADOR', 'FARMACEUTA'),
  async (_req: Request, res: Response) => {
    try {
      const hoy = new Date(); hoy.setHours(0,0,0,0)
      const fin = new Date(); fin.setHours(23,59,59,999)
      const en30 = new Date(); en30.setDate(en30.getDate() + 30)

      const [ventas, stockCritico, porVencer] = await Promise.all([
        prisma.venta.aggregate({
          where:  { creadoEn: { gte: hoy, lte: fin }, estado: 'PAGADO' },
          _sum:   { total: true },
          _count: { id: true },
        }),
        prisma.producto.count({
          where: {
            activo: true,
            lotes: { none: { cantidadActual: { gt: 0 }, fechaVencimiento: { gt: new Date() } } },
          },
        }),
        prisma.lote.count({
          where: {
            cantidadActual:   { gt: 0 },
            fechaVencimiento: { gte: new Date(), lte: en30 },
          },
        }),
      ])

      return responder.ok(res, {
        total_dia:    Number(ventas._sum.total ?? 0),
        transacciones:ventas._count.id,
        stock_critico:stockCritico,
        por_vencer:   porVencer,
      })
    } catch (err) { return responder.serverError(res, err) }
  }
)

// ── GET / ─────────────────────────────────────────────────
ventasRouter.get('/', autenticar, autorizar('ADMINISTRADOR', 'FARMACEUTA'),
  async (req: Request, res: Response) => {
    const { pagina, limite, skip } = parsePaginacion(req.query as any)
    const { desde, hasta, estado } = req.query as any
    const esAdmin = req.empleado!.rol === 'ADMINISTRADOR'

    const where: any = {}
    if (!esAdmin) where.empleadoId = req.empleado!.id
    if (desde) where.creadoEn = { ...where.creadoEn, gte: new Date(desde) }
    if (hasta) where.creadoEn = { ...where.creadoEn, lte: new Date(hasta) }
    if (estado) where.estado = estado

    try {
      const [total, ventas] = await Promise.all([
        prisma.venta.count({ where }),
        prisma.venta.findMany({
          where, skip, take: limite,
          orderBy: { creadoEn: 'desc' },
          include: {
            empleado: { select: { nombre: true, apellido: true } },
            cliente:  { select: { nombre: true, apellido: true } },
            caja: { include: { sucursal: { select: { nombre: true } } } },
            _count:   { select: { detalles: true } },
          },
        }),
      ])

      return responder.lista(res,
        ventas.map((v: any) => ({
          ...v,
          cajero: v.empleado ? `${v.empleado.nombre} ${v.empleado.apellido}` : 'Sistema',
          cliente:v.cliente  ? `${v.cliente.nombre} ${v.cliente.apellido}`   : null,
          sucursal: v.caja?.sucursal?.nombre,
          items: v._count.detalles,
          empleado: undefined, _count: undefined,
        })),
        { pagina, limite, total, totalPaginas: Math.ceil(total / limite) }
      )
    } catch (err) { return responder.serverError(res, err) }
  }
)

// ── POST / — Registrar venta (transacción atómica) ────────
ventasRouter.post('/', autenticar, autorizar('ADMINISTRADOR', 'FARMACEUTA'),
  validarCuerpo(registrarVentaSchema), async (req: Request, res: Response) => {
    const { sucursalId, cajaId, clienteId, metodoPago, items, descuento } = req.body

    try {
      const client = await prisma.$transaction(async (tx: any) => {
        let subtotal = 0
        const detalles: any[] = []

        for (const item of items) {
          // Uso del nuevo servicio FEFO
          const lotesUsados = await InventarioService.descontarStockFEFO(tx, item.productoId, sucursalId, item.cantidad)

          let descuentoRestante = item.descuento || 0

          for (const lu of lotesUsados) {
            const valorBruto = item.precioUnitario * lu.cantidad
            const descuentoAplicar = Math.min(valorBruto, descuentoRestante)
            const valorNeto = valorBruto - descuentoAplicar

            subtotal += valorNeto
            descuentoRestante -= descuentoAplicar

            detalles.push({
              productoId:    item.productoId,
              loteId:        lu.loteId,
              cantidad:      lu.cantidad,
              precioUnitario:item.precioUnitario,
              descuento:     descuentoAplicar,
              subtotal:      valorNeto,
            })
          }
        }

        const total = subtotal - (descuento ?? 0)

        const venta = await tx.venta.create({
          data: {
            sucursalId, cajaId: cajaId ?? null,
            empleadoId: req.empleado!.id,
            clienteId:  clienteId ?? null,
            metodoPago, subtotal, descuento: descuento ?? 0,
            iva: 0, total, estado: 'PAGADO',
            detalles: { createMany: { data: detalles } },
          },
          include: { detalles: true },
        })

        // Sumar puntos de fidelidad
        if (clienteId) {
          const puntos = Math.floor(total / 1000)
          if (puntos > 0) {
            const expira = new Date()
            expira.setFullYear(expira.getFullYear() + 1)
            await tx.cliente.update({
              where: { id: clienteId },
              data: {
                puntosAcumulados: { increment: puntos },
                puntosExpiranEn: expira,
              },
            })
          }
        }

        return venta
      })

      return responder.creado(res, {
        ventaId: client.id,
        ventaNum: client.numero,
        total: client.total,
      }, 'Venta registrada exitosamente')
    } catch (err: any) {
      return responder.error(res, err.message || 'Error procesando la venta', 400)
    }
  }
)

// ── POST /:id/devolucion ──────────────────────────────────
ventasRouter.post('/:id/devolucion', autenticar, autorizar('ADMINISTRADOR', 'FARMACEUTA'),
  async (req: Request, res: Response) => {
    const { motivo, reintegraStock = true } = req.body
    const ventaId = req.params.id

    try {
      const venta = await prisma.venta.findUnique({
        where: { id: ventaId },
        include: { detalles: true, devolucion: true },
      })

      if (!venta)              return responder.noEncontrado(res, 'Venta')
      if (venta.devolucion)    return responder.error(res, 'Esta venta ya tiene una devolución')
      if (venta.estado !== 'PAGADO') return responder.error(res, 'Solo se pueden devolver ventas pagadas')

      const diasDesdeVenta = Math.floor(
        (Date.now() - venta.creadoEn.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diasDesdeVenta > 15) {
        return responder.error(res, 'Han pasado más de 15 días desde la compra')
      }

      await prisma.$transaction(async (tx: any) => {
        await tx.venta.update({ where: { id: ventaId }, data: { estado: 'DEVUELTO' } })
        await tx.devolucion.create({
          data: { ventaId, motivo, totalDevuelto: venta.total, reintegraStock },
        })

        if (reintegraStock) {
          for (const d of venta.detalles) {
            if (d.loteId) {
              await tx.lote.update({
                where: { id: d.loteId },
                data:  { cantidadActual: { increment: d.cantidad } },
              })
            }
          }
        }
      })

      return responder.ok(res, null, 'Devolución procesada exitosamente')
    } catch (err) { return responder.serverError(res, err) }
  }
)
