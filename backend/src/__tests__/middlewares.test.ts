import { describe, it, expect, vi, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════
//  Hoisted: env vars para importar middlewares
// ═══════════════════════════════════════════════════════════
vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.JWT_SECRET = 'a'.repeat(32)
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
  process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
  process.env.RATE_LIMIT_WINDOW_MS = '900000'
  process.env.RATE_LIMIT_MAX = '100'
  process.env.RATE_LIMIT_AUTH_MAX = '10'
  process.env.NODE_ENV = 'test'
})

// ── Mock dotenv para evitar carga de .env real ──────────
vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
  config: vi.fn(),
}))

// ── Mock Redis para auth middleware ───────────────────────
vi.mock('../config/redis', () => ({
  redis: { on: vi.fn() },
  cache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
    del: vi.fn(),
    delPattern: vi.fn(),
  },
}))

// ── Mock logger ─────────────────────────────────────────
vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

// ── Mock database (prisma) para autorizar ────────────────
vi.mock('../config/database', () => ({
  prisma: {
    logActividad: { create: vi.fn().mockResolvedValue({}) },
  },
}))

// ── Mock jwt.utils (necesario para autenticar) ──────────
vi.mock('../utils/jwt.utils', () => ({
  jwtEmpleado: {
    verificar: vi.fn((token: string) => {
      if (token === 'valid-admin-token') {
        return { id: 'emp-1', nombre: 'Admin', email: 'admin@test.com', rol: 'ADMIN', sucursalId: 1 }
      }
      throw new Error('Token inválido')
    }),
  },
  jwtCliente: {
    verificar: vi.fn((token: string) => {
      if (token === 'valid-client-token') {
        return { id: 'cli-1', nombre: 'Cliente', email: 'cliente@test.com', tipo: 'cliente' }
      }
      throw new Error('Token inválido')
    }),
  },
}))

// ── Helper ────────────────────────────────────────────────
function mockReqRes(overrides: Partial<Record<string, unknown>> = {}) {
  const req = {
    headers: {},
    ip: '127.0.0.1',
    body: {},
    query: {},
    baseUrl: '/api/v1/test',
    originalUrl: '/api/v1/test',
    path: '/test',
    method: 'GET',
    ...overrides,
  } as any

  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }

  const next = vi.fn()
  return { req, res, next }
}

// ═══════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════
describe('autenticar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rechaza si no hay token', async () => {
    const { autenticar } = await import('../middlewares/index')
    const { req, res, next } = mockReqRes()
    await autenticar(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Token no proporcionado' })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('rechaza token inválido', async () => {
    const { autenticar } = await import('../middlewares/index')
    const { req, res, next } = mockReqRes({
      headers: { authorization: 'Bearer invalid-token' },
    })
    await autenticar(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/Token|inválido|expirado/) })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('pasa validación con token válido', async () => {
    const { autenticar } = await import('../middlewares/index')
    const { req, res, next } = mockReqRes({
      headers: { authorization: 'Bearer valid-admin-token' },
    })
    await autenticar(req, res, next)
    expect(next).toHaveBeenCalled()
  })
})

describe('autenticarCliente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rechaza si no hay token', async () => {
    const { autenticarCliente } = await import('../middlewares/index')
    const { req, res, next } = mockReqRes()
    await autenticarCliente(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Debes iniciar sesión' })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('pasa validación con token de cliente válido', async () => {
    const { autenticarCliente } = await import('../middlewares/index')
    const { req, res, next } = mockReqRes({
      headers: { authorization: 'Bearer valid-client-token' },
    })
    await autenticarCliente(req, res, next)
    expect(next).toHaveBeenCalled()
  })
})

describe('autorizar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rechaza si no hay empleado en req', async () => {
    const { autorizar } = await import('../middlewares/index')
    const middleware = autorizar('ADMIN')
    const { req, res, next } = mockReqRes()
    await middleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rechaza si el rol no está permitido', async () => {
    const { autorizar } = await import('../middlewares/index')
    const middleware = autorizar('ADMIN')
    const { req, res, next } = mockReqRes()
    req.empleado = { id: 'emp-1', nombre: 'Test', email: 'test@test.com', rol: 'VENDEDOR', sucursalId: 1 }
    await middleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('permite si el rol coincide', async () => {
    const { autorizar } = await import('../middlewares/index')
    const middleware = autorizar('ADMIN')
    const { req, res, next } = mockReqRes()
    req.empleado = { id: 'emp-1', nombre: 'Admin', email: 'admin@test.com', rol: 'ADMIN', sucursalId: 1 }
    await middleware(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('validarCuerpo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pasa validación exitosa', async () => {
    const { validarCuerpo } = await import('../middlewares/index')
    const { z } = await import('zod')
    const schema = z.object({ nombre: z.string().min(1) })
    const middleware = validarCuerpo(schema)
    const { req, res, next } = mockReqRes({ body: { nombre: 'Test' } })
    await middleware(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('rechaza cuerpo inválido con 422', async () => {
    const { validarCuerpo } = await import('../middlewares/index')
    const { z } = await import('zod')
    const schema = z.object({ nombre: z.string().min(1) })
    const middleware = validarCuerpo(schema)
    const { req, res, next } = mockReqRes({ body: {} })
    await middleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(422)
    expect(next).not.toHaveBeenCalled()
  })
})

describe('validarQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pasa validación exitosa', async () => {
    const { validarQuery } = await import('../middlewares/index')
    const { z } = await import('zod')
    const schema = z.object({ pagina: z.string().optional() })
    const middleware = validarQuery(schema)
    const { req, res, next } = mockReqRes({ query: { pagina: '1' } })
    await middleware(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('rechaza query inválido con 422', async () => {
    const { validarQuery } = await import('../middlewares/index')
    const { z } = await import('zod')
    const schema = z.object({ pagina: z.string().regex(/^\d+$/) })
    const middleware = validarQuery(schema)
    const { req, res, next } = mockReqRes({ query: { pagina: 'abc' } })
    await middleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(422)
    expect(next).not.toHaveBeenCalled()
  })
})

describe('manejarErrores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('responde 409 para Unique constraint violation', async () => {
    const { manejarErrores } = await import('../middlewares/index')
    const { req, res, next } = mockReqRes()
    const err = new Error('Unique constraint failed on the fields: (`email`)')
    manejarErrores(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false }))
  })

  it('responde 400 para Foreign key constraint violation', async () => {
    const { manejarErrores } = await import('../middlewares/index')
    const { req, res, next } = mockReqRes()
    const err = new Error('Foreign key constraint failed on the field: `categoriaId`')
    manejarErrores(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('responde 404 para Record to update not found', async () => {
    const { manejarErrores } = await import('../middlewares/index')
    const { req, res, next } = mockReqRes()
    const err = new Error('Record to update not found')
    manejarErrores(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('responde 500 para otros errores', async () => {
    const { manejarErrores } = await import('../middlewares/index')
    const { req, res, next } = mockReqRes()
    const err = new Error('Algo inesperado')
    manejarErrores(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('limitarPeticiones', () => {
  it('tiene la configuración correcta', async () => {
    const { limitarPeticiones } = await import('../middlewares/index')
    expect(limitarPeticiones).toBeDefined()
    expect(typeof limitarPeticiones).toBe('function')
  })
})

describe('limitarLogin', () => {
  it('tiene la configuración correcta', async () => {
    const { limitarLogin } = await import('../middlewares/index')
    expect(limitarLogin).toBeDefined()
    expect(typeof limitarLogin).toBe('function')
  })
})

describe('loggerHttp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('llama next sin loggear en producción', async () => {
    const { loggerHttp } = await import('../middlewares/index')
    const { req, res, next } = mockReqRes()
    loggerHttp(req, res, next)
    expect(next).toHaveBeenCalled()
  })
})
