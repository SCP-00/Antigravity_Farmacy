import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import express from 'express'

// ── Hoisted env vars ──────────────────────────────────────
vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.JWT_SECRET = 'a'.repeat(32)
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
  process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
  process.env.FRONTEND_URL = 'http://localhost:5173'
  process.env.API_PREFIX = '/api/v1'
  process.env.RATE_LIMIT_WINDOW_MS = '900000'
  process.env.RATE_LIMIT_MAX = '1000'
  process.env.RATE_LIMIT_AUTH_MAX = '100'
  process.env.NODE_ENV = 'test'
  process.env.PORT = '0'
  process.env.FARMACIA_NOMBRE = 'Farmacy Test'
  process.env.HORARIO_DIAS = '1,2,3,4,5'
  process.env.HORARIO_INICIO = '08:00'
  process.env.HORARIO_FIN = '18:00'
  process.env.REDIS_URL = 'redis://localhost:6379'
  process.env.GOOGLE_CLIENT_ID = ''
  process.env.GOOGLE_CLIENT_SECRET = ''
})

vi.mock('dotenv', () => ({ default: { config: vi.fn() }, config: vi.fn() }))

// ── Mocks hoisted ─────────────────────────────────────────
const mockPrisma = vi.hoisted(() => ({
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  cliente: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
  empleado: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
  producto: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  categoria: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn(), count: vi.fn() },
  sucursal: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn(), count: vi.fn() },
  venta: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
  lote: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), count: vi.fn() },
  inventario: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
  caja: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  cajaMovimiento: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
  proveedor: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  compra: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), count: vi.fn() },
  detalleCompra: { create: vi.fn(), createMany: vi.fn() },
  pago: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
  reporte: { findMany: vi.fn() },
  logActividad: { create: vi.fn().mockResolvedValue({}) },
  chatbotSesion: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn().mockResolvedValue({}) },
  alertaInventario: { findMany: vi.fn(), create: vi.fn(), deleteMany: vi.fn(), update: vi.fn(), count: vi.fn() },
  loteVenta: { create: vi.fn(), createMany: vi.fn() },
  detalleVenta: { create: vi.fn(), createMany: vi.fn() },
  $transaction: vi.fn(),
}))

const mockCache = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn(),
  del: vi.fn(),
  delPattern: vi.fn(),
}))

const mockBcrypt = vi.hoisted(() => ({ compare: vi.fn(), hash: vi.fn() }))
vi.mock('bcryptjs', () => ({ default: mockBcrypt }))
vi.mock('../config/database', () => ({ prisma: mockPrisma }))
vi.mock('../config/redis', () => ({
  redis: { on: vi.fn(), connect: vi.fn() },
  cache: mockCache,
  connectRedis: vi.fn(),
}))
vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('../config/mailer', () => ({ sendEmail: vi.fn(), emailTemplates: {} }))
vi.mock('node-cron', () => ({ default: { schedule: vi.fn() }, schedule: vi.fn() }))

// ── Mock JWT utils para magic tokens de auth ────────────────
vi.mock('../utils/jwt.utils', () => ({
  jwtEmpleado: {
    verificar: vi.fn((token: string) => {
      if (token === 'valid-admin-token') return { id: 'emp-1', nombre: 'Admin', email: 'admin@test.com', rol: 'ADMINISTRADOR', sucursalId: 1 }
      if (token === 'valid-farmaceuta-token') return { id: 'emp-2', nombre: 'Farmaceuta', email: 'farm@test.com', rol: 'FARMACEUTA', sucursalId: 1 }
      if (token === 'valid-auxiliar-token') return { id: 'emp-3', nombre: 'Auxiliar', email: 'aux@test.com', rol: 'AUXILIAR', sucursalId: 1 }
      throw new Error('Token inválido')
    }),
    firmar: vi.fn(() => 'fake-token'),
    firmarRefresh: vi.fn(() => 'fake-refresh-token'),
    verificarRefresh: vi.fn(() => ({ id: 'emp-1' })),
  },
  jwtCliente: {
    verificar: vi.fn((token: string) => {
      if (token === 'valid-client-token') return { id: 'cli-1', nombre: 'Cliente', email: 'cliente@test.com', tipo: 'cliente' }
      throw new Error('Token inválido')
    }),
    firmar: vi.fn(() => 'fake-client-token'),
  },
  jwtTemp: {
    firmar: vi.fn(() => 'fake-temp-token'),
    verificar: vi.fn(() => ({})),
  },
}))

import supertest from 'supertest'
import { createApp } from '../app'

const apiPrefix = '/api/v1'

describe('Auth Routes - POST /login', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza login sin email', async () => {
    const res = await supertest(app).post(`${apiPrefix}/auth/login`).send({ password: '123456' })
    // validarCuerpo retorna 422
    expect(res.status).toBe(422)
  })

  it('rechaza login sin password', async () => {
    const res = await supertest(app).post(`${apiPrefix}/auth/login`).send({ email: 'test@test.com' })
    expect(res.status).toBe(422)
  })

  it('rechaza email inválido', async () => {
    const res = await supertest(app).post(`${apiPrefix}/auth/login`).send({ email: 'invalido', password: '123456' })
    expect(res.status).toBe(422)
  })

  it('rechaza credenciales inválidas — empleado no existe', async () => {
    mockPrisma.empleado.findUnique.mockResolvedValue(null)
    const res = await supertest(app).post(`${apiPrefix}/auth/login`).send({ email: 'no@existe.com', password: '123456' })
    expect(res.status).toBe(401)
  })

  it('rechaza credenciales inválidas — empleado inactivo', async () => {
    mockPrisma.empleado.findUnique.mockResolvedValue({ id: '1', activo: false })
    const res = await supertest(app).post(`${apiPrefix}/auth/login`).send({ email: 'inactivo@test.com', password: '123456' })
    expect(res.status).toBe(401)
  })

  it('rechaza password incorrecto', async () => {
    mockPrisma.empleado.findUnique.mockResolvedValue({ id: '1', activo: true, password: '$2a$12$hash' })
    mockBcrypt.compare.mockResolvedValue(false)
    const res = await supertest(app).post(`${apiPrefix}/auth/login`).send({ email: 'activo@test.com', password: 'wrong' })
    expect(res.status).toBe(401)
  })

  it('login exitoso retorna token y empleado', async () => {
    mockPrisma.empleado.findUnique.mockResolvedValue({
      id: '1', activo: true, password: '$2a$12$hashreal',
      nombre: 'Admin', apellido: 'Sistema', email: 'admin@farmacy.co',
      rol: 'ADMINISTRADOR', sucursalId: 1,
      sucursal: { nombre: 'Principal' },
    })
    mockBcrypt.compare.mockResolvedValue(true)
    mockPrisma.empleado.update.mockResolvedValue({})

    const res = await supertest(app).post(`${apiPrefix}/auth/login`).send({
      email: 'admin@farmacy.co', password: 'Admin123!',
    })
    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.refreshToken).toBeDefined()
    expect(res.body.data.empleado.email).toBe('admin@farmacy.co')
    expect(res.body.data.empleado.rol).toBe('ADMINISTRADOR')
  })

  it('maneja error interno con 500', async () => {
    mockPrisma.empleado.findUnique.mockRejectedValue(new Error('DB error'))
    const res = await supertest(app).post(`${apiPrefix}/auth/login`).send({
      email: 'admin@farmacy.co', password: 'Admin123!',
    })
    expect(res.status).toBe(500)
  })
})

describe('Auth Routes - POST /refresh', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin refreshToken', async () => {
    const res = await supertest(app).post(`${apiPrefix}/auth/refresh`).send({})
    expect(res.status).toBe(400)
  })

  it('rechaza refresh token revocado', async () => {
    mockCache.get.mockResolvedValue('revoked')
    const res = await supertest(app).post(`${apiPrefix}/auth/refresh`).send({ refreshToken: 'revocado' })
    expect(res.status).toBe(401)
  })

  it('rechaza refresh token inválido', async () => {
    mockCache.get.mockResolvedValue(null)
    const res = await supertest(app).post(`${apiPrefix}/auth/refresh`).send({ refreshToken: 'token-invalido' })
    expect(res.status).toBe(401)
  })

  it('refresca exitosamente y rota tokens', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.empleado.findUnique.mockResolvedValue({
      id: 'emp-1', activo: true, nombre: 'Admin', apellido: 'Sistema',
      email: 'admin@test.com', rol: 'ADMINISTRADOR', sucursalId: 1,
    })
    const res = await supertest(app).post(`${apiPrefix}/auth/refresh`).send({ refreshToken: 'valid-refresh' })
    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.refreshToken).toBeDefined()
    expect(mockCache.set).toHaveBeenCalledWith('bl_ref_valid-refresh', 'revoked', expect.any(Number))
  })

  it('rechaza refresh si empleado está inactivo', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.empleado.findUnique.mockResolvedValue({
      id: 'emp-1', activo: false,
    })
    const res = await supertest(app).post(`${apiPrefix}/auth/refresh`).send({ refreshToken: 'valid-refresh' })
    expect(res.status).toBe(401)
  })
})

describe('Auth Routes - POST /logout', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin token de autenticación', async () => {
    const res = await supertest(app).post(`${apiPrefix}/auth/logout`).send({})
    expect(res.status).toBe(401)
  })

  it('cierra sesión exitosamente con token y refreshToken', async () => {
    mockPrisma.logActividad.create.mockResolvedValue({})
    const res = await supertest(app).post(`${apiPrefix}/auth/logout`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ refreshToken: 'some-refresh-token' })
    expect(res.status).toBe(200)
    expect(mockCache.set).toHaveBeenCalledTimes(2)
  })

  it('cierra sesión sin refreshToken', async () => {
    mockPrisma.logActividad.create.mockResolvedValue({})
    const res = await supertest(app).post(`${apiPrefix}/auth/logout`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({})
    expect(res.status).toBe(200)
    expect(mockCache.set).toHaveBeenCalledTimes(1)
  })
})

describe('Auth Routes - GET /me', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin token', async () => {
    const res = await supertest(app).get(`${apiPrefix}/auth/me`)
    expect(res.status).toBe(401)
  })

  it('retorna 404 si empleado no existe', async () => {
    mockPrisma.empleado.findUnique.mockResolvedValue(null)
    const res = await supertest(app).get(`${apiPrefix}/auth/me`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(404)
  })

  it('retorna perfil del empleado autenticado', async () => {
    mockPrisma.empleado.findUnique.mockResolvedValue({
      id: '1', nombre: 'Admin', apellido: 'Sistema',
      email: 'admin@farmacy.co', rol: 'ADMINISTRADOR',
      activo: true, ultimoAcceso: new Date(),
      sucursal: { id: 1, nombre: 'Principal' },
    })
    const res = await supertest(app).get(`${apiPrefix}/auth/me`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe('admin@farmacy.co')
  })

  it('maneja error interno con 500', async () => {
    mockPrisma.empleado.findUnique.mockRejectedValue(new Error('DB error'))
    const res = await supertest(app).get(`${apiPrefix}/auth/me`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(500)
  })
})
