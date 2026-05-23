// ══════════════════════════════════════════════════════════
//  MÓDULO AUTH — Empleados
//  Rutas: POST /api/v1/auth/login
//         POST /api/v1/auth/refresh
//         GET  /api/v1/auth/me
//         POST /api/v1/auth/logout
// ══════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../../config/database'
import { jwtEmpleado } from '../../utils/jwt.utils'
import { responder } from '../../utils/respuesta.utils'
import { autenticar, validarCuerpo, limitarLogin } from '../../middlewares/index'
import { logger } from '../../utils/logger'

// ── Schemas Zod ───────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(1, 'Contraseña requerida'),
})

// ── Router ────────────────────────────────────────────────
export const authRouter: Router = Router()

// POST /api/v1/auth/login
authRouter.post(
  '/login',
  limitarLogin,
  validarCuerpo(loginSchema),
  async (req: Request, res: Response) => {
    const { email, password } = req.body

    try {
      const empleado = await prisma.empleado.findUnique({
        where: { email },
        include: { sucursal: { select: { nombre: true } } },
      })

      if (!empleado || !empleado.activo) {
        return responder.noAutorizado(res, 'Credenciales inválidas')
      }

      const passwordOk = await bcrypt.compare(password, empleado.password)
      if (!passwordOk) {
        // Log del intento fallido
        await prisma.logActividad.create({
          data: { ip: req.ip ?? 'unknown', accion: 'LOGIN_FALLIDO', modulo: 'auth' },
        }).catch(() => {})
        return responder.noAutorizado(res, 'Credenciales inválidas')
      }

      const payload = {
        id:         empleado.id,
        nombre:     `${empleado.nombre} ${empleado.apellido}`,
        email:      empleado.email,
        rol:        empleado.rol,
        sucursalId: empleado.sucursalId,
      }

      const token        = jwtEmpleado.firmar(payload)
      const refreshToken = jwtEmpleado.firmarRefresh({ id: empleado.id })

      // Actualiza último acceso
      await prisma.empleado.update({
        where: { id: empleado.id },
        data: { ultimoAcceso: new Date() },
      }).catch(() => {})

      // Log de acceso exitoso
      await prisma.logActividad.create({
        data: {
          empleadoId: empleado.id,
          ip: req.ip ?? 'unknown',
          accion: 'LOGIN',
          modulo: 'auth',
        },
      }).catch(() => {})

      logger.info(`[Auth] Login exitoso: ${email} (${empleado.rol})`)

      return responder.ok(res, {
        token,
        refreshToken,
        empleado: {
          id:        empleado.id,
          nombre:    `${empleado.nombre} ${empleado.apellido}`,
          email:     empleado.email,
          rol:       empleado.rol,
          sucursal:  empleado.sucursal?.nombre ?? null,
          sucursalId:empleado.sucursalId,
        },
      }, 'Login exitoso')

    } catch (err) {
      return responder.serverError(res, err)
    }
  }
)

// POST /api/v1/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) return responder.error(res, 'Refresh token requerido')

  try {
    const decoded = jwtEmpleado.verificarRefresh(refreshToken)
    const empleado = await prisma.empleado.findUnique({ where: { id: decoded.id } })

    if (!empleado || !empleado.activo) {
      return responder.noAutorizado(res, 'Sesión inválida')
    }

    const nuevoToken = jwtEmpleado.firmar({
      id:         empleado.id,
      nombre:     `${empleado.nombre} ${empleado.apellido}`,
      email:      empleado.email,
      rol:        empleado.rol,
      sucursalId: empleado.sucursalId,
    })

    return responder.ok(res, { token: nuevoToken })
  } catch {
    return responder.noAutorizado(res, 'Refresh token inválido')
  }
})

// GET /api/v1/auth/me
authRouter.get('/me', autenticar, async (req: Request, res: Response) => {
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id: req.empleado!.id },
      select: {
        id: true, nombre: true, apellido: true,
        email: true, rol: true, activo: true,
        ultimoAcceso: true,
        sucursal: { select: { id: true, nombre: true } },
      },
    })
    if (!empleado) return responder.noEncontrado(res, 'Empleado')
    return responder.ok(res, empleado)
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// POST /api/v1/auth/logout (registra el logout en logs)
authRouter.post('/logout', autenticar, async (req: Request, res: Response) => {
  await prisma.logActividad.create({
    data: {
      empleadoId: req.empleado!.id,
      ip: req.ip ?? 'unknown',
      accion: 'LOGOUT',
      modulo: 'auth',
    },
  }).catch(() => {})
  return responder.ok(res, null, 'Sesión cerrada')
})