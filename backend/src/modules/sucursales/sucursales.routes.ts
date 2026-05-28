import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { responder } from '../../utils/respuesta.utils'
import { autenticar, autorizar, validarCuerpo, limitarCreacion } from '../../middlewares/index'
import { crearSucursalSchema, actualizarSucursalSchema } from '../../schemas/inventario.schema'

export const sucursalesRouter: Router = Router()

sucursalesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const sedes = await prisma.sucursal.findMany({
      where: { activa: true }, orderBy: { nombre: 'asc' },
    })
    return responder.ok(res, sedes)
  } catch (err) { return responder.serverError(res, err) }
})

sucursalesRouter.post('/', autenticar, autorizar('ADMINISTRADOR'), limitarCreacion,
  validarCuerpo(crearSucursalSchema), async (req: Request, res: Response) => {
    try {
      const sede = await prisma.sucursal.create({ data: req.body })
      return responder.creado(res, sede)
    } catch (err) { return responder.serverError(res, err) }
  }
)

sucursalesRouter.patch('/:id', autenticar, autorizar('ADMINISTRADOR'), limitarCreacion,
  validarCuerpo(actualizarSucursalSchema), async (req: Request, res: Response) => {
    try {
      const sede = await prisma.sucursal.update({
        where: { id: parseInt(req.params.id) }, data: req.body,
      })
      return responder.ok(res, sede)
    } catch (err) { return responder.serverError(res, err) }
  }
)