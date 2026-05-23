import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { responder, parsePaginacion } from '../../utils/respuesta.utils'
import { autenticar, autorizar } from '../../middlewares/index'

export const clientesAdminRouter: Router = Router()

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