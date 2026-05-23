// Centralized middleware exports for backend routes.

import { Request, Response, NextFunction } from 'express'
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit'
import { ZodSchema } from 'zod'
import { jwtEmpleado, jwtCliente } from '../utils/jwt.utils'
import { responder } from '../utils/respuesta.utils'
import { prisma } from '../config/database'
import { cache } from '../config/redis'
import { logger } from '../utils/logger'
import { env } from '../config/env'

declare global {
  namespace Express {
    interface Request {
      empleado?: { id: string; nombre: string; email: string; rol: string; sucursalId?: number | null }
      cliente?:  { id: string; nombre: string; email: string; tipo: 'cliente' }
    }
  }
}

// ── 1. Autenticación con validación en Redis (Blacklist) ──
export async function autenticar(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return responder.noAutorizado(res, 'Token no proporcionado')

  try {
    // Verificar si el token fue revocado (Logout)
    const revocado = await cache.get(`bl_${token}`)
    if (revocado) return responder.noAutorizado(res, 'Sesión finalizada (Token revocado)')

    req.empleado = jwtEmpleado.verificar(token)
    next()
  } catch {
    return responder.noAutorizado(res, 'Token inválido o expirado')
  }
}

export async function autenticarCliente(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return responder.noAutorizado(res, 'Debes iniciar sesión')

  try {
    const revocado = await cache.get(`bl_cli_${token}`)
    if (revocado) return responder.noAutorizado(res, 'Sesión finalizada')

    req.cliente = jwtCliente.verificar(token)
    next()
  } catch {
    return responder.noAutorizado(res, 'Sesión expirada, inicia sesión de nuevo')
  }
}

export const autenticarClientes = autenticarCliente

// ── 2. Autorización RBAC con auditoría ────────────────────
export function autorizar(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.empleado) return responder.noAutorizado(res)

    if (!roles.includes(req.empleado.rol)) {
      // Registrar intento de violación de acceso
      await prisma.logActividad.create({
        data: {
          empleadoId: req.empleado.id,
          ip: req.ip ?? 'unknown',
          accion: 'ACCESO_DENEGADO_RBAC',
          modulo: req.baseUrl,
        },
      }).catch(() => {})

      logger.warn(`[Seguridad] Intento de acceso denegado. Empleado: ${req.empleado.email} | Ruta: ${req.originalUrl}`)
      return responder.prohibido(res, `Acceso denegado. Roles permitidos: ${roles.join(', ')}`)
    }
    next()
  }
}

// ── 3. Validadores Zod ────────────────────────────────────
export function validarCuerpo(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errores = result.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }))
      return res.status(422).json({ ok: false, error: 'Datos inválidos', errores })
    }
    req.body = result.data
    next()
  }
}

export function validarQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      const errores = result.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }))
      return res.status(422).json({ ok: false, error: 'Parámetros inválidos', errores })
    }
    req.query = result.data as any
    next()
  }
}

// ── 4. Control de Errores y Límites ───────────────────────
export function manejarErrores(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error(`[Error] ${req.method} ${req.path} - ${err.message}`)
  if (err.message.includes('Unique constraint')) return responder.error(res, 'Ya existe un registro con esos datos', 409)
  if (err.message.includes('Foreign key constraint')) return responder.error(res, 'Referencia a un registro que no existe', 400)
  if (err.message.includes('Record to update not found')) return responder.noEncontrado(res, 'Registro')
  return responder.serverError(res, err)
}

export const limitarPeticiones: RateLimitRequestHandler = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiadas peticiones, intenta más tarde' },
})

export const limitarLogin: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(env.RATE_LIMIT_AUTH_MAX),
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${req.ip ?? 'unknown'}:${typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : ''}`,
  message: { ok: false, error: 'Demasiados intentos de login. Espera 15 minutos.' },
})

export function loggerHttp(req: Request, _res: Response, next: NextFunction) {
  if (env.NODE_ENV === 'development') logger.debug(`-> ${req.method} ${req.path}`)
  next()
}
