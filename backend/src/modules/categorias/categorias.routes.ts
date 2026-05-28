// ══════════════════════════════════════════════════════════
//  MÓDULO CATEGORÍAS
//  GET /api/v1/categorias
//  POST/PATCH/DELETE — solo ADMINISTRADOR
// ══════════════════════════════════════════════════════════
import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/database'
import { cache } from '../../config/redis'
import { responder } from '../../utils/respuesta.utils'
import { autenticar, autorizar, validarCuerpo, limitarCreacion } from '../../middlewares/index'

export const categoriasRouter: Router = Router()

const crearSchema = z.object({
  nombre:      z.string().min(2),
  slug:        z.string().min(2).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  descripcion: z.string().optional(),
  icono:       z.string().optional(),
  orden:       z.number().int().default(0),
})

// GET / — público
categoriasRouter.get('/', async (_req: Request, res: Response) => {
  const cached = await cache.get('categorias:all')
  if (cached) return responder.ok(res, cached)

  try {
    const cats = await prisma.categoria.findMany({
      where:   { activa: true },
      orderBy: { orden: 'asc' },
      include: { _count: { select: { productos: { where: { activo: true } } } } },
    })
    await cache.set('categorias:all', cats, 3600)
    return responder.ok(res, cats)
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// POST /
categoriasRouter.post('/', autenticar, autorizar('ADMINISTRADOR'), limitarCreacion,
  validarCuerpo(crearSchema), async (req: Request, res: Response) => {
    try {
      const cat = await prisma.categoria.create({ data: req.body })
      await cache.del('categorias:all')
      return responder.creado(res, cat)
    } catch (err: any) {
      if (err.code === 'P2002') return responder.error(res, 'Categoría ya existe', 409)
      return responder.serverError(res, err)
    }
  }
)

// PATCH /:id
categoriasRouter.patch('/:id', autenticar, autorizar('ADMINISTRADOR'), limitarCreacion,
  async (req: Request, res: Response) => {
    try {
      const cat = await prisma.categoria.update({
        where: { id: parseInt(req.params.id) },
        data:  req.body,
      })
      await cache.del('categorias:all')
      return responder.ok(res, cat)
    } catch (err) { return responder.serverError(res, err) }
  }
)