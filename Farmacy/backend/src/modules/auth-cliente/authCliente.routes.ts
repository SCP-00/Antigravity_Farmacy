// ══════════════════════════════════════════════════════════
//  MÓDULO AUTH CLIENTE — Tienda web
//  POST /api/v1/clientes/auth/registro
//  POST /api/v1/clientes/auth/login
//  GET  /api/v1/clientes/auth/google
//  GET  /api/v1/clientes/auth/google/callback
//  GET  /api/v1/clientes/auth/facebook
//  GET  /api/v1/clientes/auth/facebook/callback
//  POST /api/v1/clientes/auth/verificar-email
//  POST /api/v1/clientes/auth/recuperar-password
//  POST /api/v1/clientes/auth/reset-password
//  GET  /api/v1/clientes/auth/me
// ══════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express'
import passport from 'passport'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../../config/database'
import { jwtCliente, jwtTemp } from '../../utils/jwt.utils'
import { responder } from '../../utils/respuesta.utils'
import { autenticarCliente, validarCuerpo, limitarLogin } from '../../middlewares/index'
import { sendEmail, emailTemplates } from '../../config/mailer'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'

// ── Schemas ───────────────────────────────────────────────
const registroSchema = z.object({
  nombre:   z.string().min(2, 'Nombre muy corto'),
  apellido: z.string().min(2, 'Apellido muy corto'),
  email:    z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[!@#$%^&*]/, 'Debe contener al menos un carácter especial'),
  autorizacionDatos: z.boolean().refine(v => v === true, {
    message: 'Debes aceptar el tratamiento de datos personales (Ley 1581)',
  }),
})

const loginSchema = z.object({
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
})

// ── Router ────────────────────────────────────────────────
export const authClienteRouter = Router()

// ── POST /registro ────────────────────────────────────────
authClienteRouter.post(
  '/registro',
  validarCuerpo(registroSchema),
  async (req: Request, res: Response) => {
    const { nombre, apellido, email, password, autorizacionDatos } = req.body

    try {
      const existe = await prisma.cliente.findUnique({ where: { email } })
      if (existe) return responder.error(res, 'Ya existe una cuenta con ese email', 409)

      const hash  = await bcrypt.hash(password, 12)
      const token = crypto.randomBytes(32).toString('hex')

      const cliente = await prisma.cliente.create({
        data: {
          nombre, apellido, email,
          password: hash,
          autorizacionDatos,
          tokenVerificacion: token,
        },
        select: { id: true, nombre: true, email: true },
      })

      // Enviar email de verificación
      const url = `${env.FRONTEND_URL}/verificar/${token}`
      sendEmail({
        to: email,
        subject: 'Verifica tu cuenta en Farmacy',
        html: emailTemplates.verificarEmail(nombre, url),
      })

      logger.info(`[AuthCliente] Nuevo registro: ${email}`)
      return responder.creado(res, cliente, 'Cuenta creada. Revisa tu correo para verificarla.')

    } catch (err) {
      return responder.serverError(res, err)
    }
  }
)

// ── POST /login ───────────────────────────────────────────
authClienteRouter.post(
  '/login',
  limitarLogin,
  validarCuerpo(loginSchema),
  async (req: Request, res: Response) => {
    const { email, password } = req.body

    try {
      const cliente = await prisma.cliente.findUnique({ where: { email } })
      if (!cliente || !cliente.activo || !cliente.password) {
        return responder.noAutorizado(res, 'Credenciales inválidas')
      }

      if (!cliente.emailVerificado) {
        return responder.error(res, 'Debes verificar tu email primero', 403)
      }

      const ok = await bcrypt.compare(password, cliente.password)
      if (!ok) return responder.noAutorizado(res, 'Credenciales inválidas')

      const token = jwtCliente.firmar({
        id:     cliente.id,
        nombre: `${cliente.nombre} ${cliente.apellido}`,
        email:  cliente.email,
        tipo:   'cliente',
      })

      return responder.ok(res, {
        token,
        cliente: {
          id:      cliente.id,
          nombre:  cliente.nombre,
          apellido: cliente.apellido,
          email:   cliente.email,
          puntos:  cliente.puntosAcumulados,
        },
      }, 'Login exitoso')

    } catch (err) {
      return responder.serverError(res, err)
    }
  }
)

// ── GET /google ───────────────────────────────────────────
authClienteRouter.get('/google',
  passport.authenticate('google', { scope: ['email', 'profile'], session: false })
)

authClienteRouter.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=google` }),
  (req: Request, res: Response) => {
    const cliente = req.user as any
    const token = jwtCliente.firmar({
      id: cliente.id, nombre: cliente.nombre, email: cliente.email, tipo: 'cliente',
    })
    // Redirige al frontend con el token en la URL
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`)
  }
)

// ── GET /facebook ─────────────────────────────────────────
authClienteRouter.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'], session: false })
)

authClienteRouter.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=facebook` }),
  (req: Request, res: Response) => {
    const cliente = req.user as any
    const token = jwtCliente.firmar({
      id: cliente.id, nombre: cliente.nombre, email: cliente.email, tipo: 'cliente',
    })
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`)
  }
)

// ── POST /verificar-email ─────────────────────────────────
authClienteRouter.post('/verificar-email', async (req: Request, res: Response) => {
  const { token } = req.body
  if (!token) return responder.error(res, 'Token requerido')

  try {
    const cliente = await prisma.cliente.findFirst({
      where: { tokenVerificacion: token },
    })
    if (!cliente) return responder.error(res, 'Token inválido o expirado', 400)

    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { emailVerificado: true, tokenVerificacion: null },
    })
    return responder.ok(res, null, 'Email verificado exitosamente')
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// ── POST /recuperar-password ──────────────────────────────
authClienteRouter.post('/recuperar-password', async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email) return responder.error(res, 'Email requerido')

  try {
    const cliente = await prisma.cliente.findUnique({ where: { email } })
    // Siempre responde igual para no revelar si el email existe
    if (!cliente) return responder.ok(res, null, 'Si el email existe, recibirás un correo')

    const token   = crypto.randomBytes(32).toString('hex')
    const expira  = new Date(Date.now() + 3600000) // 1 hora

    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { tokenResetPass: token, tokenResetExpira: expira },
    })

    const url = `${env.FRONTEND_URL}/reset/${token}`
    sendEmail({
      to: email,
      subject: 'Restablece tu contraseña — Farmacy',
      html: emailTemplates.resetPassword(cliente.nombre, url),
    })

    return responder.ok(res, null, 'Si el email existe, recibirás un correo')
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// ── POST /reset-password ──────────────────────────────────
authClienteRouter.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body
  if (!token || !password) return responder.error(res, 'Token y contraseña requeridos')

  try {
    const cliente = await prisma.cliente.findFirst({
      where: {
        tokenResetPass: token,
        tokenResetExpira: { gte: new Date() },
      },
    })
    if (!cliente) return responder.error(res, 'Token inválido o expirado', 400)

    const hash = await bcrypt.hash(password, 12)
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { password: hash, tokenResetPass: null, tokenResetExpira: null },
    })
    return responder.ok(res, null, 'Contraseña actualizada exitosamente')
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// ── GET /me ───────────────────────────────────────────────
authClienteRouter.get('/me', autenticarCliente, async (req: Request, res: Response) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.cliente!.id },
      select: {
        id: true, nombre: true, apellido: true, email: true,
        telefono: true, ciudad: true, puntosAcumulados: true,
        puntosExpiranEn: true, creadoEn: true,
      },
    })
    if (!cliente) return responder.noEncontrado(res, 'Cliente')
    return responder.ok(res, cliente)
  } catch (err) {
    return responder.serverError(res, err)
  }
})

authClienteRouter.get('/pedidos', autenticarCliente, async (req: Request, res: Response) => {
  try {
    const pedidos = await prisma.venta.findMany({
      where: { clienteId: req.cliente!.id },
      orderBy: { creadoEn: 'desc' },
      include: { detalles: { include: { producto: { select: { nombre: true } } } } }
    })
    return responder.ok(res, pedidos)
  } catch (err) { return responder.serverError(res, err) }
})

// ── POST /pedidos/:id/devolucion-request — Cliente solicita devolución
authClienteRouter.post('/pedidos/:id/devolucion-request', autenticarCliente, async (req: Request, res: Response) => {
  const ventaId = req.params.id
  const { motivo } = req.body
  if (!motivo) return responder.error(res, 'motivo requerido', 400)
  try {
    const venta = await prisma.venta.findUnique({ where: { id: ventaId }, include: { cliente: true } })
    if (!venta) return responder.noEncontrado(res, 'Venta')
    if (venta.clienteId !== req.cliente!.id) return responder.noAutorizado(res, 'No autorizado para esta venta')

    const diasDesdeVenta = Math.floor((Date.now() - venta.creadoEn.getTime()) / (1000 * 60 * 60 * 24))
    if (diasDesdeVenta > 15) return responder.error(res, 'Han pasado más de 15 días desde la compra', 400)

    // Enviar correo al equipo de soporte con los detalles de la solicitud
    const soporteEmail = process.env.SOPORTE_EMAIL || 'soporte@farmacy.co'
    const html = `<p>Cliente ${venta.cliente?.nombre} ${venta.cliente?.apellido} solicita devolución para la venta #${venta.numero}</p>
      <p>Motivo: ${motivo}</p>
      <p>Venta ID: ${venta.id} · Total: ${venta.total}</p>`
    await sendEmail({ to: soporteEmail, subject: `Solicitud de devolución - Venta ${venta.numero}`, html })

    return responder.ok(res, null, 'Solicitud de devolución enviada. Nuestro equipo te contactará.')
  } catch (err) { return responder.serverError(res, err) }
})

// ── POST /favoritos — Toggle favorito para el cliente autenticado
authClienteRouter.post('/favoritos', autenticarCliente, async (req: Request, res: Response) => {
  const { productoId } = req.body
  if (!productoId) return responder.error(res, 'productoId requerido', 400)
  try {
    const existe = await prisma.favorito.findFirst({ where: { clienteId: req.cliente!.id, productoId } })
    if (existe) {
      await prisma.favorito.delete({ where: { id: existe.id } })
      return responder.ok(res, null, 'Eliminado de favoritos')
    }
    const fav = await prisma.favorito.create({ data: { clienteId: req.cliente!.id, productoId } })
    return responder.creado(res, fav, 'Agregado a favoritos')
  } catch (err) { return responder.serverError(res, err) }
})