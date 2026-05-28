import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { responder, parsePaginacion } from '../../utils/respuesta.utils'
import { autenticar, autorizar, limitarCreacion } from '../../middlewares/index'

export const comprasRouter: Router = Router()

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

comprasRouter.post('/', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'), limitarCreacion,
  async (req: Request, res: Response) => {
    const { proveedorId, detalles, notas: notes, fechaEntregaEst } = req.body
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
          subtotal, iva: 0, total: subtotal, notes,
          fechaEntregaEst: fechaEntregaEst ? new Date(fechaEntregaEst) : null,
          detalles: { createMany: { data: items } },
        },
        include: { detalles: true },
      })
      return responder.creado(res, orden)
    } catch (err) { return responder.serverError(res, err) }
  }
)

comprasRouter.get('/:id', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  async (req: Request, res: Response) => {
    try {
      const orden = await prisma.ordenCompra.findUnique({
        where: { id: req.params.id },
        include: {
          proveedor: { select: { nombre: true, nit: true } },
          empleado:  { select: { nombre: true, apellido: true } },
          detalles: {
            include: { producto: { select: { nombre: true, presentacion: true } } },
          },
        },
      })
      if (!orden) return responder.noEncontrado(res, 'Orden de compra')
      return responder.ok(res, orden)
    } catch (err) { return responder.serverError(res, err) }
  }
)

comprasRouter.post('/:id/recibir', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'), limitarCreacion,
  async (req: Request, res: Response) => {
    try {
      const orden = await prisma.ordenCompra.findUnique({
        where: { id: req.params.id }, include: { detalles: true },
      })
      if (!orden)                      return responder.noEncontrado(res, 'Orden')
      if (orden.estado === 'RECIBIDA') return responder.error(res, 'Esta orden ya fue recibida')

      const { sucursalId, lotes: lotesRecibidos } = req.body

      await prisma.$transaction(async (tx: any) => {
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