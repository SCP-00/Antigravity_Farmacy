// Centralized middleware exports for backend routes.

import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import { ZodSchema } from 'zod'
import { jwtEmpleado, jwtCliente } from '../utils/jwt.utils'
import { responder } from '../utils/respuesta.utils'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { env } from '../config/env'

declare global {
  namespace Express {
    interface Request {
      empleado?: {
        id: string
        nombre: string
        email: string
        rol: string
        sucursalId?: number | null
      }
      cliente?: {
        id: string
        nombre: string
        email: string
        tipo: 'cliente'
      }
    }
  }
}

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return responder.noAutorizado(res, 'Token no proporcionado')

  try {
    req.empleado = jwtEmpleado.verificar(token)
    next()
  } catch {
    return responder.noAutorizado(res, 'Token invalido o expirado')
  }
}

export function autenticarCliente(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return responder.noAutorizado(res, 'Debes iniciar sesion')

  try {
    req.cliente = jwtCliente.verificar(token)
    next()
  } catch {
    return responder.noAutorizado(res, 'Sesion expirada, inicia sesion de nuevo')
  }
}

// Backward-compatible alias while old imports are phased out.
export const autenticarClientes = autenticarCliente

export function autorizar(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.empleado) return responder.noAutorizado(res)

    if (!roles.includes(req.empleado.rol)) {
      return responder.prohibido(
        res,
        `Acceso denegado. Roles permitidos: ${roles.join(', ')}`
      )
    }
    next()
  }
}

export function validarCuerpo(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errores = result.error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      }))
      return res.status(422).json({ ok: false, error: 'Datos invalidos', errores })
    }
    req.body = result.data
    next()
  }
}

export function validarQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      const errores = result.error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      }))
      return res.status(422).json({ ok: false, error: 'Parametros invalidos', errores })
    }
    req.query = result.data as any
    next()
  }
}

export function registrarLog(accion: string, modulo?: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (req.empleado?.id) {
      prisma.logActividad
        .create({
          data: {
            empleadoId: req.empleado.id,
            ip: req.ip ?? 'unknown',
            accion,
            modulo,
          },
        })
        .catch(() => {})
    }
    next()
  }
}

export function manejarErrores(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(`[Error] ${req.method} ${req.path} - ${err.message}`)

  if (err.message.includes('Unique constraint')) {
    return responder.error(res, 'Ya existe un registro con esos datos', 409)
  }
  if (err.message.includes('Foreign key constraint')) {
    return responder.error(res, 'Referencia a un registro que no existe', 400)
  }
  if (err.message.includes('Record to update not found')) {
    return responder.noEncontrado(res, 'Registro')
  }

  return responder.serverError(res, err)
}

export const limitarPeticiones = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiadas peticiones, intenta mas tarde' },
})

export const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(env.RATE_LIMIT_AUTH_MAX),
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : ''
    return `${req.ip ?? 'unknown'}:${email}`
  },
  message: { ok: false, error: 'Demasiados intentos de login. Espera 15 minutos.' },
})

export function loggerHttp(req: Request, _res: Response, next: NextFunction) {
  if (env.NODE_ENV === 'development') {
    logger.debug(`-> ${req.method} ${req.path}`)
  }
  next()
}
