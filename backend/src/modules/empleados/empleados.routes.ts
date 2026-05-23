import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../../config/database'
import { responder, parsePaginacion } from '../../utils/respuesta.utils'
import { autenticar, autorizar } from '../../middlewares/index'

export const empleadosRouter: Router = Router()

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