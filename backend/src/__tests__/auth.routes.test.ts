import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted env vars ──────────────────────────────────────
vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.JWT_SECRET = 'test-secret-for-jwt'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
  process.env.NODE_ENV = 'test'
  process.env.API_PREFIX = '/api/v1'
  process.env.FRONTEND_URL = 'http://localhost:5173'
  process.env.REDIS_URL = 'redis://localhost:6379'
})

vi.mock('dotenv', () => ({ default: { config: vi.fn() }, config: vi.fn() }))

// ── Mocks hoisted ─────────────────────────────────────────
const mockPrisma = vi.hoisted(() => ({
  empleado: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  logActividad: { create: vi.fn() },
}))

const mockCache = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}))

vi.mock('../config/database', () => ({ prisma: mockPrisma }))
vi.mock('../config/redis', () => ({ cache: mockCache }))
vi.mock('../config/mailer', () => ({ sendEmail: vi.fn(), emailTemplates: {} }))

const mockBcrypt = vi.hoisted(() => ({ compare: vi.fn(), hash: vi.fn() }))
vi.mock('bcryptjs', () => mockBcrypt)

import supertest from 'supertest'
import { app } from '../app'

const request = supertest(app)
const apiPrefix = '/api/v1'

describe('Auth Routes - POST /login', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza login sin email', async () => {
    const res = await request.post(`${apiPrefix}/auth/login`).send({ password: '123456' })
    expect(res.status).toBe(400)
  })

  it('rechaza login sin password', async () => {
    const res = await request.post(`${apiPrefix}/auth/login`).send({ email: 'test@test.com' })
    expect(res.status).toBe(400)
  })

  it('rechaza email inválido', async () => {
    const res = await request.post(`${apiPrefix}/auth/login`).send({ email: 'invalido', password: '123456' })
    expect(res.status).toBe(400)
  })

  it('rechaza credenciales inválidas — empleado no existe', async () => {
    mockPrisma.empleado.findUnique.mockResolvedValue(null)
    const res = await request.post(`${apiPrefix}/auth/login`).send({ email: 'no@existe.com', password: '123456' })
    expect(res.status).toBe(401)
  })

  it('rechaza credenciales inválidas — empleado inactivo', async () => {
    mockPrisma.empleado.findUnique.mockResolvedValue({ id: '1', activo: false })
    const res = await request.post(`${apiPrefix}/auth/login`).send({ email: 'inactivo@test.com', password: '123456' })
    expect(res.status).toBe(401)
  })

  it('rechaza password incorrecto', async () => {
    mockPrisma.empleado.findUnique.mockResolvedValue({ id: '1', activo: true, password: '$2a$12$hash' })
    mockBcrypt.compare.mockResolvedValue(false)
    const res = await request.post(`${apiPrefix}/auth/login`).send({ email: 'activo@test.com', password: 'wrong' })
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

    const res = await request.post(`${apiPrefix}/auth/login`).send({
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
    const res = await request.post(`${apiPrefix}/auth/login`).send({
      email: 'admin@farmacy.co', password: 'Admin123!',
    })
    expect(res.status).toBe(500)
  })
})

describe('Auth Routes - POST /refresh', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin refreshToken', async () => {
    const res = await request.post(`${apiPrefix}/auth/refresh`).send({})
    expect(res.status).toBe(400)
  })

  it('rechaza refresh token revocado', async () => {
    mockCache.get.mockResolvedValue('revoked')
    const res = await request.post(`${apiPrefix}/auth/refresh`).send({ refreshToken: 'revocado' })
    expect(res.status).toBe(401)
  })

  it('rechaza refresh token inválido', async () => {
    mockCache.get.mockResolvedValue(null)
    const res = await request.post(`${apiPrefix}/auth/refresh`).send({ refreshToken: 'token-invalido' })
    expect(res.status).toBe(401)
  })
})

describe('Auth Routes - POST /logout', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin token de autenticación', async () => {
    const res = await request.post(`${apiPrefix}/auth/logout`).send({})
    expect(res.status).toBe(401)
  })
})

describe('Auth Routes - GET /me', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin token', async () => {
    const res = await request.get(`${apiPrefix}/auth/me`)
    expect(res.status).toBe(401)
  })

  it('retorna 404 si empleado no existe', async () => {
    mockPrisma.empleado.findUnique.mockResolvedValue(null)
    const res = await request.get(`${apiPrefix}/auth/me`)
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
    const res = await request.get(`${apiPrefix}/auth/me`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe('admin@farmacy.co')
  })

  it('maneja error interno con 500', async () => {
    mockPrisma.empleado.findUnique.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/auth/me`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(500)
  })
})
