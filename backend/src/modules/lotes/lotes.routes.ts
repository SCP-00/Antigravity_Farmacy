import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { responder, parsePaginacion } from '../../utils/respuesta.utils'
import { autenticar, autorizar, validarCuerpo } from '../../middlewares/index'
import { crearLoteSchema } from '../../schemas/inventario.schema'
import { InventarioService } from '../../services/inventario.service'

export const lotesRouter: Router = Router()

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

      // Usar servicio para recalcular el costo promedio del producto
      await InventarioService.actualizarCostoPromedio(req.body.productoId, Number(req.body.precioCompra))

      return responder.creado(res, lote)
    } catch (err) { return responder.serverError(res, err) }
  }
)
