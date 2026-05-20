// ══════════════════════════════════════════════════════════
//  MÓDULO LOTES
// ══════════════════════════════════════════════════════════
import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/database'
import { responder, parsePaginacion } from '../../utils/respuesta.utils'
import { autenticar, autorizar, validarCuerpo } from '../../middlewares/index'

export const lotesRouter = Router()

const crearLoteSchema = z.object({
  codigoLote:       z.string().min(3),
  productoId:       z.string().uuid(),
  sucursalId:       z.number().int().positive(),
  proveedorId:      z.string().uuid().optional(),
  ordenCompraId:    z.string().uuid().optional(),
  fechaFabricacion: z.string().optional(),
  fechaVencimiento: z.string().min(1, 'Fecha de vencimiento requerida'),
  cantidadInicial:  z.number().int().positive(),
  precioCompra:     z.number().positive(),
})

lotesRouter.get('/', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  async (req: Request, res: Response) => {
    const { skip, limite, pagina } = parsePaginacion(req.query as any)
    const { sucursalId, productoId, proximosVencer } = req.query as any

    const where: any = {}
    if (sucursalId)  where.sucursalId  = parseInt(sucursalId)
    if (productoId)  where.productoId  = productoId
    if (proximosVencer === 'true') {
      const en30 = new Date(); en30.setDate(en30.getDate() + 30)
      where.fechaVencimiento = { gte: new Date(), lte: en30 }
      where.cantidadActual   = { gt: 0 }
    }

    try {
      const [total, lotes] = await Promise.all([
        prisma.lote.count({ where }),
        prisma.lote.findMany({
          where, skip, take: limite,
          orderBy: { fechaVencimiento: 'asc' },
          include: {
            producto:  { select: { nombre: true, concentracion: true } },
            sucursal:  { select: { nombre: true } },
            proveedor: { select: { nombre: true } },
          },
        }),
      ])

      return responder.lista(res, lotes,
        { pagina, limite, total, totalPaginas: Math.ceil(total / limite) }
      )
    } catch (err) { return responder.serverError(res, err) }
  }
)

lotesRouter.post('/', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  validarCuerpo(crearLoteSchema), async (req: Request, res: Response) => {
    try {
      const lote = await prisma.lote.create({
        data: {
          ...req.body,
          cantidadActual: req.body.cantidadInicial,
          fechaVencimiento: new Date(req.body.fechaVencimiento),
          fechaFabricacion: req.body.fechaFabricacion
            ? new Date(req.body.fechaFabricacion) : null,
        },
      })

      // Actualizar costo promedio ponderado del producto
      const lotes = await prisma.lote.findMany({
        where: { productoId: req.body.productoId, cantidadActual: { gt: 0 } },
        select: { cantidadActual: true, precioCompra: true },
      })
      const totalCantidad = lotes.reduce((s, l) => s + l.cantidadActual, 0)
      const totalCosto    = lotes.reduce((s, l) => s + l.cantidadActual * Number(l.precioCompra), 0)
      const promedio      = totalCantidad > 0 ? totalCosto / totalCantidad : Number(req.body.precioCompra)

      await prisma.producto.update({
        where: { id: req.body.productoId },
        data:  { precioPromedio: promedio },
      })

      return responder.creado(res, lote)
    } catch (err) { return responder.serverError(res, err) }
  }
)

// ══════════════════════════════════════════════════════════
//  MÓDULO INVENTARIO — Ajustes manuales y movimientos
// ══════════════════════════════════════════════════════════
export const inventarioRouter = Router()

const ajusteSchema = z.object({
  loteId:      z.string().uuid(),
  tipo:        z.enum(['AJUSTE_POSITIVO','AJUSTE_NEGATIVO']),
  cantidad:    z.number().int().positive(),
  motivo:      z.enum(['PERDIDA','DANO','VENCIMIENTO','ERROR_DIGITACION','INVENTARIO_FISICO','OTRO']),
  descripcion: z.string().optional(),
})

inventarioRouter.post('/ajuste', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  validarCuerpo(ajusteSchema), async (req: Request, res: Response) => {
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
    // Por defecto mostrar NO leídas; si leidas=true mostrar todas
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

// ══════════════════════════════════════════════════════════
//  MÓDULO PROVEEDORES
// ══════════════════════════════════════════════════════════
export const proveedoresRouter = Router()

proveedoresRouter.get('/', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  async (req: Request, res: Response) => {
    const { skip, limite, pagina } = parsePaginacion(req.query as any)
    const { q } = req.query as any
    const where = q
      ? { OR: [{ nombre: { contains: q, mode: 'insensitive' as any } }, { nit: { contains: q } }] }
      : {}
    try {
      const [total, proveedores] = await Promise.all([
        prisma.proveedor.count({ where }),
        prisma.proveedor.findMany({
          where, skip, take: limite, orderBy: { nombre: 'asc' },
          include: { _count: { select: { ordenesCompra: true, lotes: true } } },
        }),
      ])
      return responder.lista(res, proveedores,
        { pagina, limite, total, totalPaginas: Math.ceil(total / limite) }
      )
    } catch (err) { return responder.serverError(res, err) }
  }
)

proveedoresRouter.post('/', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  async (req: Request, res: Response) => {
    try {
      const prov = await prisma.proveedor.create({ data: req.body })
      return responder.creado(res, prov)
    } catch (err: any) {
      if (err.code === 'P2002') return responder.error(res, 'NIT ya registrado', 409)
      return responder.serverError(res, err)
    }
  }
)

proveedoresRouter.patch('/:id', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  async (req: Request, res: Response) => {
    try {
      const p = await prisma.proveedor.update({ where: { id: req.params.id }, data: req.body })
      return responder.ok(res, p)
    } catch (err) { return responder.serverError(res, err) }
  }
)

// ══════════════════════════════════════════════════════════
//  MÓDULO COMPRAS — Órdenes de compra
// ══════════════════════════════════════════════════════════
export const comprasRouter = Router()

comprasRouter.get('/', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  async (req: Request, res: Response) => {
    const { skip, limite, pagina } = parsePaginacion(req.query as any)
    const { estado } = req.query as any
    const where = estado ? { estado } : {}
    try {
      const [total, ordenes] = await Promise.all([
        prisma.ordenCompra.count({ where }),
        prisma.ordenCompra.findMany({
          where, skip, take: limite, orderBy: { creadoEn: 'desc' },
          include: {
            proveedor: { select: { nombre: true } },
            empleado:  { select: { nombre: true } },
            _count:    { select: { detalles: true } },
          },
        }),
      ])
      return responder.lista(res, ordenes,
        { pagina, limite, total, totalPaginas: Math.ceil(total / limite) }
      )
    } catch (err) { return responder.serverError(res, err) }
  }
)

comprasRouter.post('/', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  async (req: Request, res: Response) => {
    const { proveedorId, detalles, notas, fechaEntregaEst } = req.body
    try {
      let subtotal = 0
      const items = detalles.map((d: any) => {
        const sub = d.cantidadPedida * d.precioUnitario
        subtotal += sub
        return { ...d, subtotal: sub }
      })

      const orden = await prisma.ordenCompra.create({
        data: {
          proveedorId, empleadoId: req.empleado!.id,
          subtotal, iva: 0, total: subtotal, notas,
          fechaEntregaEst: fechaEntregaEst ? new Date(fechaEntregaEst) : null,
          detalles: { createMany: { data: items } },
        },
        include: { detalles: true },
      })
      return responder.creado(res, orden)
    } catch (err) { return responder.serverError(res, err) }
  }
)

// R_RF3.2: No editable si está RECIBIDA
comprasRouter.post('/:id/recibir', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  async (req: Request, res: Response) => {
    try {
      const orden = await prisma.ordenCompra.findUnique({
        where: { id: req.params.id }, include: { detalles: true },
      })
      if (!orden)                      return responder.noEncontrado(res, 'Orden')
      if (orden.estado === 'RECIBIDA') return responder.error(res, 'Esta orden ya fue recibida')

      const { sucursalId, lotes: lotesRecibidos } = req.body

      await prisma.$transaction(async (tx) => {
        for (const lr of lotesRecibidos) {
          await tx.lote.create({
            data: {
              codigoLote:       lr.codigoLote,
              productoId:       lr.productoId,
              sucursalId,
              proveedorId:      orden.proveedorId,
              ordenCompraId:    orden.id,
              fechaVencimiento: new Date(lr.fechaVencimiento),
              cantidadInicial:  lr.cantidad,
              cantidadActual:   lr.cantidad,
              precioCompra:     lr.precioCompra,
            },
          })
        }
        await tx.ordenCompra.update({
          where: { id: orden.id },
          data:  { estado: 'RECIBIDA', recibidaEn: new Date() },
        })
      })

      return responder.ok(res, null, 'Mercancía recibida y lotes creados')
    } catch (err) { return responder.serverError(res, err) }
  }
)

// ══════════════════════════════════════════════════════════
//  MÓDULO CLIENTES — Panel admin
// ══════════════════════════════════════════════════════════
export const clientesAdminRouter = Router()

clientesAdminRouter.get('/', autenticar, autorizar('ADMINISTRADOR','FARMACEUTA'),
  async (req: Request, res: Response) => {
    const { skip, limite, pagina } = parsePaginacion(req.query as any)
    const { q } = req.query as any
    const where = q
      ? { OR: [
          { nombre:    { contains: q, mode: 'insensitive' as any } },
          { email:     { contains: q, mode: 'insensitive' as any } },
          { documento: { contains: q } },
        ]} : {}
    try {
      const [total, clientes] = await Promise.all([
        prisma.cliente.count({ where }),
        prisma.cliente.findMany({
          where, skip, take: limite, orderBy: { creadoEn: 'desc' },
          select: {
            id: true, nombre: true, apellido: true, email: true,
            telefono: true, puntosAcumulados: true, creadoEn: true,
            _count: { select: { ventas: true } },
          },
        }),
      ])
      return responder.lista(res, clientes,
        { pagina, limite, total, totalPaginas: Math.ceil(total / limite) }
      )
    } catch (err) { return responder.serverError(res, err) }
  }
)

clientesAdminRouter.get('/:id', autenticar, autorizar('ADMINISTRADOR','FARMACEUTA'),
  async (req: Request, res: Response) => {
    try {
      const c = await prisma.cliente.findUnique({
        where: { id: req.params.id },
        include: {
          ventas: { take: 10, orderBy: { creadoEn: 'desc' },
            select: { numero: true, total: true, creadoEn: true, estado: true } },
        },
      })
      if (!c) return responder.noEncontrado(res, 'Cliente')
      return responder.ok(res, c)
    } catch (err) { return responder.serverError(res, err) }
  }
)

// ══════════════════════════════════════════════════════════
//  MÓDULO EMPLEADOS
// ══════════════════════════════════════════════════════════
import bcrypt from 'bcryptjs'
export const empleadosRouter = Router()

empleadosRouter.get('/', autenticar, autorizar('ADMINISTRADOR'),
  async (req: Request, res: Response) => {
    const { skip, limite, pagina } = parsePaginacion(req.query as any)
    try {
      const [total, empleados] = await Promise.all([
        prisma.empleado.count(),
        prisma.empleado.findMany({
          skip, take: limite, orderBy: { nombre: 'asc' },
          select: {
            id: true, nombre: true, apellido: true, email: true,
            rol: true, activo: true, ultimoAcceso: true,
            sucursal: { select: { nombre: true } },
          },
        }),
      ])
      return responder.lista(res, empleados,
        { pagina, limite, total, totalPaginas: Math.ceil(total / limite) }
      )
    } catch (err) { return responder.serverError(res, err) }
  }
)

empleadosRouter.post('/', autenticar, autorizar('ADMINISTRADOR'),
  async (req: Request, res: Response) => {
    const { nombre, apellido, email, password, rol, sucursalId } = req.body
    try {
      const hash = await bcrypt.hash(password, 12)
      const emp = await prisma.empleado.create({
        data: { nombre, apellido, email, password: hash, rol, sucursalId },
        select: { id: true, nombre: true, email: true, rol: true },
      })
      return responder.creado(res, emp)
    } catch (err: any) {
      if (err.code === 'P2002') return responder.error(res, 'Email ya registrado', 409)
      return responder.serverError(res, err)
    }
  }
)

empleadosRouter.patch('/:id', autenticar, autorizar('ADMINISTRADOR'),
  async (req: Request, res: Response) => {
    const { password, ...rest } = req.body
    // R_RF1.1: No se puede modificar el rol ADMINISTRADOR base
    try {
      const data: any = { ...rest }
      if (password) data.password = await bcrypt.hash(password, 12)
      const emp = await prisma.empleado.update({
        where: { id: req.params.id }, data,
        select: { id: true, nombre: true, email: true, rol: true, activo: true },
      })
      return responder.ok(res, emp)
    } catch (err) { return responder.serverError(res, err) }
  }
)

empleadosRouter.patch('/:id/estado', autenticar, autorizar('ADMINISTRADOR'),
  async (req: Request, res: Response) => {
    const { activo } = req.body
    try {
      await prisma.empleado.update({
        where: { id: req.params.id }, data: { activo },
      })
      return responder.ok(res, null, activo ? 'Empleado activado' : 'Empleado desactivado')
    } catch (err) { return responder.serverError(res, err) }
  }
)

// ══════════════════════════════════════════════════════════
//  MÓDULO SUCURSALES
// ══════════════════════════════════════════════════════════
export const sucursalesRouter = Router()

sucursalesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const sedes = await prisma.sucursal.findMany({
      where: { activa: true }, orderBy: { nombre: 'asc' },
    })
    return responder.ok(res, sedes)
  } catch (err) { return responder.serverError(res, err) }
})

sucursalesRouter.post('/', autenticar, autorizar('ADMINISTRADOR'),
  async (req: Request, res: Response) => {
    try {
      const sede = await prisma.sucursal.create({ data: req.body })
      return responder.creado(res, sede)
    } catch (err) { return responder.serverError(res, err) }
  }
)

sucursalesRouter.patch('/:id', autenticar, autorizar('ADMINISTRADOR'),
  async (req: Request, res: Response) => {
    try {
      const sede = await prisma.sucursal.update({
        where: { id: parseInt(req.params.id) }, data: req.body,
      })
      return responder.ok(res, sede)
    } catch (err) { return responder.serverError(res, err) }
  }
)

// ══════════════════════════════════════════════════════════
//  MÓDULO REPORTES
// ══════════════════════════════════════════════════════════
export const reportesRouter = Router()

reportesRouter.get('/ventas', autenticar, autorizar('ADMINISTRADOR'),
  async (req: Request, res: Response) => {
    const { desde, hasta, sucursalId } = req.query as any
    try {
      const where: any = {}
      if (desde) where.creadoEn = { gte: new Date(desde) }
      if (hasta) where.creadoEn = { ...where.creadoEn, lte: new Date(hasta) }
      if (sucursalId) where.sucursalId = parseInt(sucursalId)

      const [totales, porDia, porMetodo] = await Promise.all([
        prisma.venta.aggregate({
          where: { ...where, estado: 'PAGADO' },
          _sum:   { total: true, descuento: true },
          _count: { id: true },
          _avg:   { total: true },
        }),
        prisma.venta.groupBy({
          by: ['creadoEn'],
          where: { ...where, estado: 'PAGADO' },
          _sum:   { total: true },
          _count: { id: true },
        }),
        prisma.venta.groupBy({
          by: ['metodoPago'],
          where: { ...where, estado: 'PAGADO' },
          _sum:   { total: true },
          _count: { id: true },
        }),
      ])

      return responder.ok(res, { totales, porDia, porMetodo })
    } catch (err) { return responder.serverError(res, err) }
  }
)

reportesRouter.get('/inventario', autenticar, autorizar('ADMINISTRADOR'),
  async (_req: Request, res: Response) => {
    try {
      const en30 = new Date(); en30.setDate(en30.getDate() + 30)
      const [stockTotal, stockCritico, porVencer, agotados] = await Promise.all([
        prisma.lote.aggregate({
          where: { cantidadActual: { gt: 0 } },
          _sum: { cantidadActual: true },
        }),
        prisma.producto.count({
          where: {
            activo: true,
            lotes: { some: { cantidadActual: { lte: 10 } } },
          },
        }),
        prisma.lote.findMany({
          where: { cantidadActual: { gt: 0 }, fechaVencimiento: { gte: new Date(), lte: en30 } },
          include: { producto: { select: { nombre: true } } },
          orderBy: { fechaVencimiento: 'asc' },
        }),
        prisma.producto.count({
          where: { activo: true, lotes: { none: { cantidadActual: { gt: 0 } } } },
        }),
      ])

      return responder.ok(res, {
        stockTotal: stockTotal._sum.cantidadActual,
        stockCritico, agotados, porVencer,
      })
    } catch (err) { return responder.serverError(res, err) }
  }
)