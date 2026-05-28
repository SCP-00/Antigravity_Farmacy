import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../../config/database'
import { cache } from '../../config/redis'
import { jwtEmpleado } from '../../utils/jwt.utils'
import { responder } from '../../utils/respuesta.utils'
import { autenticar, validarCuerpo, limitarLogin, limitarCreacion } from '../../middlewares/index'
import { logger } from '../../utils/logger'

const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(1, 'Contraseña requerida'),
})

export const authRouter: Router = Router()

// POST /api/v1/auth/login
authRouter.post('/login', limitarLogin, validarCuerpo(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { email },
      include: { sucursal: { select: { nombre: true } } },
    })

    if (!empleado || !empleado.activo) return responder.noAutorizado(res, 'Credenciales inválidas')

    const passwordOk = await bcrypt.compare(password, empleado.password)
    if (!passwordOk) {
      await prisma.logActividad.create({ data: { ip: req.ip ?? 'unknown', accion: 'LOGIN_FALLIDO', modulo: 'auth' } }).catch(() => {})
      return responder.noAutorizado(res, 'Credenciales inválidas')
    }

    const payload = {
      id: empleado.id, nombre: `${empleado.nombre} ${empleado.apellido}`,
      email: empleado.email, rol: empleado.rol, sucursalId: empleado.sucursalId,
    }

    const token = jwtEmpleado.firmar(payload)
    const refreshToken = jwtEmpleado.firmarRefresh({ id: empleado.id })

    await prisma.empleado.update({ where: { id: empleado.id }, data: { ultimoAcceso: new Date() } }).catch(() => {})
    await prisma.logActividad.create({ data: { empleadoId: empleado.id, ip: req.ip ?? 'unknown', accion: 'LOGIN', modulo: 'auth' } }).catch(() => {})

    logger.info(`[Auth] Login exitoso: ${email} (${empleado.rol})`)

    return responder.ok(res, {
      token, refreshToken,
      empleado: { ...payload, sucursal: empleado.sucursal?.nombre ?? null },
    }, 'Login exitoso')
  } catch (err) { return responder.serverError(res, err) }
})

// POST /api/v1/auth/refresh (Rotación de Tokens)
authRouter.post('/refresh', limitarCreacion, async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) return responder.error(res, 'Refresh token requerido')

  try {
    // 1. Verificar si el refresh token fue revocado (Replay attack protection)
    const revocado = await cache.get(`bl_ref_${refreshToken}`)
    if (revocado) return responder.noAutorizado(res, 'Refresh token revocado. Inicia sesión de nuevo.')

    const decoded = jwtEmpleado.verificarRefresh(refreshToken)
    const empleado = await prisma.empleado.findUnique({ where: { id: decoded.id } })

    if (!empleado || !empleado.activo) return responder.noAutorizado(res, 'Sesión inválida')

    // 2. Revocar el refresh token usado para que no se use de nuevo (Rotación)
    await cache.set(`bl_ref_${refreshToken}`, 'revoked', 60 * 60 * 24 * 7) // Guardar 7 días

    // 3. Generar par nuevo
    const nuevoToken = jwtEmpleado.firmar({
      id: empleado.id, nombre: `${empleado.nombre} ${empleado.apellido}`,
      email: empleado.email, rol: empleado.rol, sucursalId: empleado.sucursalId,
    })
    const nuevoRefreshToken = jwtEmpleado.firmarRefresh({ id: empleado.id })

    return responder.ok(res, { token: nuevoToken, refreshToken: nuevoRefreshToken })
  } catch {
    return responder.noAutorizado(res, 'Refresh token inválido o expirado')
  }
})

// POST /api/v1/auth/logout
authRouter.post('/logout', autenticar, limitarCreacion, async (req: Request, res: Response) => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  const { refreshToken } = req.body

  if (token) await cache.set(`bl_${token}`, 'revoked', 60 * 60 * 8) // Blacklist token por 8h
  if (refreshToken) await cache.set(`bl_ref_${refreshToken}`, 'revoked', 60 * 60 * 24 * 7) // Blacklist refresh token por 7d

  await prisma.logActividad.create({ data: { empleadoId: req.empleado!.id, ip: req.ip ?? 'unknown', accion: 'LOGOUT', modulo: 'auth' } }).catch(() => {})
  return responder.ok(res, null, 'Sesión cerrada de forma segura')
})

// GET /api/v1/auth/me
authRouter.get('/me', autenticar, async (req: Request, res: Response) => {
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id: req.empleado!.id },
      select: { id: true, nombre: true, apellido: true, email: true, rol: true, activo: true, ultimoAcceso: true, sucursal: { select: { id: true, nombre: true } } },
    })
    if (!empleado) return responder.noEncontrado(res, 'Empleado')
    return responder.ok(res, empleado)
  } catch (err) { return responder.serverError(res, err) }
})
