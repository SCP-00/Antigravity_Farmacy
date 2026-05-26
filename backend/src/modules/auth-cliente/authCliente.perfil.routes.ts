import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { autenticarCliente } from '../../middlewares/index'
import { responder } from '../../utils/respuesta.utils'

export const authClientePerfilRouter: Router = Router()

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

// ── GET /salud — Obtener perfil de salud del cliente ─────
authClientePerfilRouter.get('/salud', autenticarCliente, async (req: Request, res: Response) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.cliente!.id },
      select: { alergenos: true, condiciones: true },
    })
    if (!cliente) return responder.noEncontrado(res, 'Cliente')
    return responder.ok(res, {
      alergenos: cliente.alergenos ? cliente.alergenos.split(',').map(a => a.trim()).filter(Boolean) : [],
      condiciones: cliente.condiciones ? cliente.condiciones.split(',').map(c => c.trim()).filter(Boolean) : [],
    })
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// ── PATCH /salud — Actualizar perfil de salud ────────────
authClientePerfilRouter.patch('/salud', autenticarCliente, async (req: Request, res: Response) => {
  try {
    const { alergenos, condiciones } = req.body

    const data: any = {}
    if (alergenos !== undefined) {
      const lista = Array.isArray(alergenos) ? alergenos : []
      data.alergenos = lista.map((a: string) => a.trim()).filter(Boolean).join(', ')
    }
    if (condiciones !== undefined) {
      const lista = Array.isArray(condiciones) ? condiciones : []
      data.condiciones = lista.map((c: string) => c.trim()).filter(Boolean).join(', ')
    }

    const actualizado = await prisma.cliente.update({
      where: { id: req.cliente!.id },
      data,
      select: { id: true, alergenos: true, condiciones: true },
    })

    return responder.ok(res, {
      alergenos: actualizado.alergenos ? actualizado.alergenos.split(',').map(a => a.trim()).filter(Boolean) : [],
      condiciones: actualizado.condiciones ? actualizado.condiciones.split(',').map(c => c.trim()).filter(Boolean) : [],
    }, 'Perfil de salud actualizado')
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
