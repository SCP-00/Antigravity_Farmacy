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

// ── Helpers IP ──────────────────────────────────────────────
function ipv4ANumero(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0
}

function ipEnCidr(ip: string, cidr: string): boolean {
  const [rangeIp, bits] = cidr.split('/')
  const mask = bits ? (~(2 ** (32 - parseInt(bits, 10)) - 1) >>> 0) : 0xFFFFFFFF
  const ipNum = ipv4ANumero(ip)
  const rangeNum = ipv4ANumero(rangeIp)
  return (ipNum & mask) === (rangeNum & mask)
}

// ── Allowlist de IPs para webhooks (configurable vía env) ──
// Si WEBHOOK_IP_ALLOWLIST no está configurada, permite todo (con warning)
let _allowlistAdvertido = false

export function verificarIpPermitida(allowedList: string[]) {
  const ranges = allowedList
    .flatMap(s => s.split(',').map(x => x.trim()))
    .filter(Boolean)

  if (ranges.length === 0) {
    if (!_allowlistAdvertido) {
      logger.warn('[IP Allowlist] No hay IPs configuradas — todas las IPs pueden acceder a webhooks')
      _allowlistAdvertido = true
    }
    // Si no hay allowlist, middleware pasa (no bloquea)
    return (_req: Request, _res: Response, next: NextFunction) => next()
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip ?? req.socket.remoteAddress ?? 'unknown'
    const ipLimpia = clientIp.replace(/^::ffff:/, '') // Normalizar IPv4 mapeado a IPv6

    const permitido = ranges.some(r => {
      if (r.includes('/')) return ipEnCidr(ipLimpia, r)
      return ipLimpia === r
    })

    if (!permitido) {
      logger.warn(`[IP Allowlist] Bloqueado — IP ${ipLimpia} no está en allowlist`)
      return res.status(403).json({ ok: false, error: 'Acceso denegado por seguridad' })
    }

    next()
  }
}

// ── Redis Store para rate limiting persistente ────────────
import RedisStore from 'rate-limit-redis'
import { redis } from '../config/redis'

// Crea RedisStore de forma segura (fallback a memoria si Redis no está disponible)
// rate-limit-redis v5 acepta sendCommand(...args) donde args = [cmd, ...params]
// ioredis v5+ expone call() para comandos raw
// En modo test se desactiva para evitar errores con mocks de Redis
function crearRedisStore() {
  if (env.NODE_ENV === 'test') {
    return undefined
  }

  try {
    return new RedisStore({
      sendCommand: (...args: string[]) => (redis as any).call(...args),
      prefix: 'rl:',
    })
  } catch {
    logger.warn('[RateLimit] Redis no disponible — rate limiting en memoria (se reinicia al reiniciar el servidor)')
    return undefined
  }
}

const redisStore = crearRedisStore()

// ── Rate Limiters granulares por endpoint ───────────────────
export const limitarPeticiones: RateLimitRequestHandler = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
  message: { ok: false, error: 'Demasiadas peticiones, intenta más tarde' },
})

export const limitarLogin: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(env.RATE_LIMIT_AUTH_MAX),
  skipSuccessfulRequests: true,
  store: redisStore,
  keyGenerator: (req) => `${req.ip ?? 'unknown'}:${typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : ''}`,
  message: { ok: false, error: 'Demasiados intentos de login. Espera 15 minutos.' },
})

// Rate limiter para webhooks (alta frecuencia permitida, pero controlada)
export const limitarWebhook: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(env.RATE_LIMIT_WEBHOOK_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
  message: { ok: false, error: 'Demasiadas solicitudes de webhook' },
})

// Rate limiter para endpoints de creación/escritura (POST, PUT, PATCH)
export const limitarCreacion: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(env.RATE_LIMIT_CREACION_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
  message: { ok: false, error: 'Demasiadas solicitudes de creación. Intenta más tarde.' },
})

// Rate limiter para endpoints de búsqueda pública
export const limitarBusqueda: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(env.RATE_LIMIT_BUSQUEDA_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
  message: { ok: false, error: 'Demasiadas búsquedas. Intenta más tarde.' },
})

// Rate limiter estricto para registro de nuevos usuarios (5 intentos por hora por IP)
// Se desactiva en test (NODE_ENV=test) para no interferir con unit tests
export const limitarRegistro: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skip: () => env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
  message: { ok: false, error: 'Demasiados intentos de registro. Espera 1 hora.' },
})

export function loggerHttp(req: Request, _res: Response, next: NextFunction) {
  if (env.NODE_ENV === 'development') logger.debug(`-> ${req.method} ${req.path}`)
  next()
}
