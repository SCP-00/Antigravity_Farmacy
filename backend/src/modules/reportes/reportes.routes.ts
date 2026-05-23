import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { responder } from '../../utils/respuesta.utils'
import { autenticar, autorizar } from '../../middlewares/index'

export const reportesRouter: Router = Router()

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