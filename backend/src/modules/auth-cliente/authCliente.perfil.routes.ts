import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { autenticarCliente } from '../../middlewares/index'
import { responder } from '../../utils/respuesta.utils'

export const authClientePerfilRouter = Router()

// GET /me - perfil del cliente autenticado
authClientePerfilRouter.get('/me', autenticarCliente, async (req: Request, res: Response) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.cliente!.id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        ciudad: true,
        puntosAcumulados: true,
        puntosExpiranEn: true,
        creadoEn: true,
      },
    })

    if (!cliente) return responder.noEncontrado(res, 'Cliente')
    return responder.ok(res, cliente)
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// PATCH /me - actualizar perfil del cliente autenticado
authClientePerfilRouter.patch('/me', autenticarCliente, async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, telefono, ciudad } = req.body
    const actualizado = await prisma.cliente.update({
      where: { id: req.cliente!.id },
      data: { nombre, apellido, telefono, ciudad },
      select: { id: true, nombre: true, apellido: true, email: true, telefono: true, ciudad: true },
    })

    return responder.ok(res, actualizado, 'Perfil actualizado')
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// GET /favoritos - favoritos del cliente autenticado
authClientePerfilRouter.get('/favoritos', autenticarCliente, async (req: Request, res: Response) => {
  try {
    const favoritos = await prisma.favorito.findMany({
      where: { clienteId: req.cliente!.id },
      orderBy: { creadoEn: 'desc' },
      select: {
        id: true,
        productoId: true,
        creadoEn: true,
        producto: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            imagenUrl: true,
            precioVenta: true,
          },
        },
      },
    })

    return responder.ok(res, favoritos)
  } catch (err) {
    return responder.serverError(res, err)
  }
})
