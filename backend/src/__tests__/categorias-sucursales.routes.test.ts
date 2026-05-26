import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import express from 'express'

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

const mockPrisma = vi.hoisted(() => ({
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  cliente: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
  empleado: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
  producto: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  categoria: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  sucursal: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
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
  favorito: { findFirst: vi.fn(), create: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
  movimientoInventario: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
  ordenCompra: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
}))

const mockCache = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn(),
  del: vi.fn(),
  delPattern: vi.fn(),
}))

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
    verificar: vi.fn(() => { throw new Error('Token inválido') }),
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

// ── Categorías ────────────────────────────────────────────
describe('Categorías Routes - GET /categorias', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna categorías cacheadas', async () => {
    const fakeCats = [{ id: 1, nombre: 'Analgésicos' }]
    mockCache.get.mockResolvedValue(fakeCats)
    const res = await supertest(app).get(`${apiPrefix}/categorias`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual(fakeCats)
  })

  it('consulta BD si no hay caché', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.categoria.findMany.mockResolvedValue([{ id: 1, nombre: 'Analgésicos', _count: { productos: 5 } }])
    const res = await supertest(app).get(`${apiPrefix}/categorias`)
    expect(res.status).toBe(200)
    expect(res.body.data[0].nombre).toBe('Analgésicos')
    expect(mockCache.set).toHaveBeenCalled()
  })

  it('retorna array vacío si no hay categorías', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.categoria.findMany.mockResolvedValue([])
    const res = await supertest(app).get(`${apiPrefix}/categorias`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('maneja error interno', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.categoria.findMany.mockRejectedValue(new Error('DB error'))
    const res = await supertest(app).get(`${apiPrefix}/categorias`)
    expect(res.status).toBe(500)
  })
})

describe('Categorías Routes - POST /categorias', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).post(`${apiPrefix}/categorias`).send({ nombre: 'Test' })
    expect(res.status).toBe(401)
  })

  it('rechaza con rol no autorizado', async () => {
    const res = await supertest(app).post(`${apiPrefix}/categorias`)
      .set('Authorization', 'Bearer valid-farmaceuta-token')
      .send({ nombre: 'Test' })
    expect(res.status).toBe(403)
  })

  it('rechaza nombre muy corto', async () => {
    const res = await supertest(app).post(`${apiPrefix}/categorias`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'A', slug: 'a' })
    expect(res.status).toBe(422)
  })

  it('rechaza slug inválido', async () => {
    const res = await supertest(app).post(`${apiPrefix}/categorias`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Test', slug: 'SLUG CON ESPACIOS' })
    expect(res.status).toBe(422)
  })

  it('crea categoría exitosamente', async () => {
    mockPrisma.categoria.create.mockResolvedValue({ id: 1, nombre: 'Vitaminas', slug: 'vitaminas' })
    const res = await supertest(app).post(`${apiPrefix}/categorias`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Vitaminas', slug: 'vitaminas', orden: 1 })
    expect(res.status).toBe(201)
  })

  it('maneja conflicto P2002', async () => {
    mockPrisma.categoria.create.mockRejectedValue({ code: 'P2002' })
    const res = await supertest(app).post(`${apiPrefix}/categorias`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Vitaminas', slug: 'vitaminas' })
    expect(res.status).toBe(409)
  })
})

describe('Categorías Routes - PATCH /categorias/:id', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).patch(`${apiPrefix}/categorias/1`).send({ nombre: 'Editado' })
    expect(res.status).toBe(401)
  })

  it('actualiza categoría exitosamente', async () => {
    mockPrisma.categoria.update.mockResolvedValue({ id: 1, nombre: 'Editado' })
    const res = await supertest(app).patch(`${apiPrefix}/categorias/1`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Editado' })
    expect(res.status).toBe(200)
    expect(mockCache.del).toHaveBeenCalledWith('categorias:all')
  })

  it('maneja error interno', async () => {
    mockPrisma.categoria.update.mockRejectedValue(new Error('DB error'))
    const res = await supertest(app).patch(`${apiPrefix}/categorias/1`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Editado' })
    expect(res.status).toBe(500)
  })
})

// ── Sucursales ───────────────────────────────────────────
describe('Sucursales Routes - GET /sucursales', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna lista de sucursales activas', async () => {
    mockPrisma.sucursal.findMany.mockResolvedValue([
      { id: 1, nombre: 'Principal', activa: true },
      { id: 2, nombre: 'Norte', activa: true },
    ])
    const res = await supertest(app).get(`${apiPrefix}/sucursales`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
  })

  it('retorna array vacío', async () => {
    mockPrisma.sucursal.findMany.mockResolvedValue([])
    const res = await supertest(app).get(`${apiPrefix}/sucursales`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('maneja error interno', async () => {
    mockPrisma.sucursal.findMany.mockRejectedValue(new Error('DB error'))
    const res = await supertest(app).get(`${apiPrefix}/sucursales`)
    expect(res.status).toBe(500)
  })
})

describe('Sucursales Routes - POST /sucursales', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).post(`${apiPrefix}/sucursales`).send({ nombre: 'Nueva' })
    expect(res.status).toBe(401)
  })

  it('crea sucursal exitosamente', async () => {
    mockPrisma.sucursal.create.mockResolvedValue({ id: 3, nombre: 'Sur' })
    const res = await supertest(app).post(`${apiPrefix}/sucursales`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Sur', direccion: 'Calle 123', telefono: '555-0000' })
    expect(res.status).toBe(201)
  })

  it('maneja error interno', async () => {
    mockPrisma.sucursal.create.mockRejectedValue(new Error('DB error'))
    const res = await supertest(app).post(`${apiPrefix}/sucursales`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Sur' })
    expect(res.status).toBe(500)
  })
})

describe('Sucursales Routes - PATCH /sucursales/:id', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).patch(`${apiPrefix}/sucursales/1`).send({ nombre: 'Editado' })
    expect(res.status).toBe(401)
  })

  it('actualiza sucursal exitosamente', async () => {
    mockPrisma.sucursal.update.mockResolvedValue({ id: 1, nombre: 'Principal Editado' })
    const res = await supertest(app).patch(`${apiPrefix}/sucursales/1`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Principal Editado' })
    expect(res.status).toBe(200)
  })
})
