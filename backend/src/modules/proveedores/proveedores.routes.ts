import { Router, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'
import { responder, parsePaginacion } from '../../utils/respuesta.utils'
import { autenticar, autorizar } from '../../middlewares/index'

export const proveedoresRouter: Router = Router()

// ── Insensitive mode helper ───────────────────────────────
const iLike = (value: string) => ({
  contains: value,
  mode: Prisma.QueryMode.insensitive,
})

proveedoresRouter.get('/', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  async (req: Request, res: Response) => {
    const { skip, limite, pagina } = parsePaginacion(req.query as any)
    const { q } = req.query as any
    const where = q
      ? { OR: [{ nombre: iLike(q) }, { nit: { contains: q } }] }
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

proveedoresRouter.get('/:id', autenticar, autorizar('ADMINISTRADOR','AUXILIAR'),
  async (req: Request, res: Response) => {
    try {
      const p = await prisma.proveedor.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { ordenesCompra: true, lotes: true } } },
      })
      if (!p) return responder.noEncontrado(res, 'Proveedor')
      return responder.ok(res, p)
    } catch (err) { return responder.serverError(res, err) }
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