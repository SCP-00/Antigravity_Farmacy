import { Router, Request, Response } from 'express'
import { ajusteInventarioSchema } from '../../schemas/inventario.schema'
import { prisma } from '../../config/database'
import { responder, parsePaginacion } from '../../utils/respuesta.utils'
import { autenticar, autorizar, validarCuerpo } from '../../middlewares/index'
import { eventBus, Eventos } from '../../services/eventbus.service'

export const inventarioRouter: Router = Router()



inventarioRouter.post('/ajuste', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  validarCuerpo(ajusteInventarioSchema), async (req: Request, res: Response) => {
    const { loteId, tipo, cantidad, motivo, descripcion } = req.body

    try {
      const lote = await prisma.lote.findUnique({ where: { id: loteId } })
      if (!lote) return responder.noEncontrado(res, 'Lote')

      const nuevaCantidad = tipo === 'AJUSTE_POSITIVO'
        ? lote.cantidadActual + cantidad
        : lote.cantidadActual - cantidad

      if (nuevaCantidad < 0) {
        return responder.error(res, 'La cantidad resultante no puede ser negativa')
      }

      await prisma.$transaction([
        prisma.lote.update({ where: { id: loteId }, data: { cantidadActual: nuevaCantidad } }),
        prisma.movimientoInventario.create({
          data: { loteId, tipo, cantidad, motivo, descripcion, empleadoId: req.empleado!.id },
        }),
      ])

      // Emitir evento de ajuste de stock
      eventBus.emit(Eventos.STOCK_AJUSTADO, {
        loteId,
        tipo,
        cantidad,
        nuevaCantidad,
        empleadoId: req.empleado!.id,
        motivo: motivo ?? 'Sin motivo',
      })

      // Si el nuevo stock es crítico, emitir alerta
      if (tipo === 'AJUSTE_NEGATIVO' && nuevaCantidad <= 10) {
        const producto = await prisma.lote.findUnique({
          where: { id: loteId },
          select: {
            producto: { select: { nombre: true, stockMinimo: true } },
          },
        }).catch(() => null)

        if (producto?.producto) {
          eventBus.emit(Eventos.STOCK_CRITICO, {
            loteId,
            productoNombre: producto.producto.nombre,
            stockActual: nuevaCantidad,
            stockMinimo: producto.producto.stockMinimo,
          })
        }
      }

      return responder.ok(res, { nuevaCantidad }, 'Ajuste registrado')
    } catch (err) { return responder.serverError(res, err) }
  }
)

inventarioRouter.get('/movimientos', autenticar, async (req: Request, res: Response) => {
  const { skip, limite, pagina } = parsePaginacion(req.query as any)
  try {
    const [total, movs] = await Promise.all([
      prisma.movimientoInventario.count(),
      prisma.movimientoInventario.findMany({
        skip, take: limite, orderBy: { creadoEn: 'desc' },
        include: {
          lote:     { include: { producto: { select: { nombre: true } } } },
          empleado: { select: { nombre: true } },
        },
      }),
    ])
    return responder.lista(res, movs,
      { pagina, limite, total, totalPaginas: Math.ceil(total / limite) }
    )
  } catch (err) { return responder.serverError(res, err) }
})

inventarioRouter.get('/alertas', autenticar, async (req: Request, res: Response) => {
  try {
    const { leidas } = req.query as any
    const where: any = leidas === 'true' ? {} : { leida: false }
    
    const alertas = await prisma.alertaInventario.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      take: 100,
      include: { lote: { include: { producto: { select: { nombre: true, id: true } } } } },
    })
    return responder.ok(res, alertas)
  } catch (err) { return responder.serverError(res, err) }
})

// PATCH /alertas/:id/leer — Marcar alerta como leída
inventarioRouter.patch('/alertas/:id/leer', autenticar, async (req: Request, res: Response) => {
  try {
    const alerta = await prisma.alertaInventario.update({
      where: { id: req.params.id },
      data: { leida: true },
    })
    return responder.ok(res, alerta, 'Alerta marcada como leída')
  } catch (err) { return responder.serverError(res, err) }
})