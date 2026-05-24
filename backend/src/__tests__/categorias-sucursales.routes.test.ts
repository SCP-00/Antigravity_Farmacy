import { describe, it, expect, vi, beforeEach } from 'vitest'

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

const mockPrisma = vi.hoisted(() => ({
  categoria: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  sucursal: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

const mockCache = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}))

vi.mock('../config/database', () => ({ prisma: mockPrisma }))
vi.mock('../config/redis', () => ({ cache: mockCache }))
vi.mock('../config/mailer', () => ({ sendEmail: vi.fn(), emailTemplates: {} }))

import supertest from 'supertest'
import { app } from '../app'

const request = supertest(app)
const apiPrefix = '/api/v1'

// ── Categorías ────────────────────────────────────────────
describe('Categorías Routes - GET /categorias', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna categorías cacheadas', async () => {
    const fakeCats = [{ id: 1, nombre: 'Analgésicos' }]
    mockCache.get.mockResolvedValue(fakeCats)
    const res = await request.get(`${apiPrefix}/categorias`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual(fakeCats)
  })

  it('consulta BD si no hay caché', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.categoria.findMany.mockResolvedValue([{ id: 1, nombre: 'Analgésicos', _count: { productos: 5 } }])
    const res = await request.get(`${apiPrefix}/categorias`)
    expect(res.status).toBe(200)
    expect(res.body.data[0].nombre).toBe('Analgésicos')
    expect(mockCache.set).toHaveBeenCalled()
  })

  it('retorna array vacío si no hay categorías', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.categoria.findMany.mockResolvedValue([])
    const res = await request.get(`${apiPrefix}/categorias`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('maneja error interno', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.categoria.findMany.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/categorias`)
    expect(res.status).toBe(500)
  })
})

describe('Categorías Routes - POST /categorias', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.post(`${apiPrefix}/categorias`).send({ nombre: 'Test' })
    expect(res.status).toBe(401)
  })

  it('rechaza con rol no autorizado', async () => {
    const res = await request.post(`${apiPrefix}/categorias`)
      .set('Authorization', 'Bearer valid-farmaceuta-token')
      .send({ nombre: 'Test' })
    expect(res.status).toBe(403)
  })

  it('rechaza nombre muy corto', async () => {
    const res = await request.post(`${apiPrefix}/categorias`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'A', slug: 'a' })
    expect(res.status).toBe(400)
  })

  it('rechaza slug inválido', async () => {
    const res = await request.post(`${apiPrefix}/categorias`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Test', slug: 'SLUG CON ESPACIOS' })
    expect(res.status).toBe(400)
  })

  it('crea categoría exitosamente', async () => {
    mockPrisma.categoria.create.mockResolvedValue({ id: 1, nombre: 'Vitaminas', slug: 'vitaminas' })
    const res = await request.post(`${apiPrefix}/categorias`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Vitaminas', slug: 'vitaminas', orden: 1 })
    expect(res.status).toBe(201)
  })

  it('maneja conflicto P2002', async () => {
    mockPrisma.categoria.create.mockRejectedValue({ code: 'P2002' })
    const res = await request.post(`${apiPrefix}/categorias`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Vitaminas', slug: 'vitaminas' })
    expect(res.status).toBe(409)
  })
})

describe('Categorías Routes - PATCH /categorias/:id', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.patch(`${apiPrefix}/categorias/1`).send({ nombre: 'Editado' })
    expect(res.status).toBe(401)
  })

  it('actualiza categoría exitosamente', async () => {
    mockPrisma.categoria.update.mockResolvedValue({ id: 1, nombre: 'Editado' })
    const res = await request.patch(`${apiPrefix}/categorias/1`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Editado' })
    expect(res.status).toBe(200)
    expect(mockCache.del).toHaveBeenCalledWith('categorias:all')
  })

  it('maneja error interno', async () => {
    mockPrisma.categoria.update.mockRejectedValue(new Error('DB error'))
    const res = await request.patch(`${apiPrefix}/categorias/1`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Editado' })
    expect(res.status).toBe(500)
  })
})

// ── Sucursales ───────────────────────────────────────────
describe('Sucursales Routes - GET /sucursales', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna lista de sucursales activas', async () => {
    mockPrisma.sucursal.findMany.mockResolvedValue([
      { id: 1, nombre: 'Principal', activa: true },
      { id: 2, nombre: 'Norte', activa: true },
    ])
    const res = await request.get(`${apiPrefix}/sucursales`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
  })

  it('retorna array vacío', async () => {
    mockPrisma.sucursal.findMany.mockResolvedValue([])
    const res = await request.get(`${apiPrefix}/sucursales`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('maneja error interno', async () => {
    mockPrisma.sucursal.findMany.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/sucursales`)
    expect(res.status).toBe(500)
  })
})

describe('Sucursales Routes - POST /sucursales', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.post(`${apiPrefix}/sucursales`).send({ nombre: 'Nueva' })
    expect(res.status).toBe(401)
  })

  it('crea sucursal exitosamente', async () => {
    mockPrisma.sucursal.create.mockResolvedValue({ id: 3, nombre: 'Sur' })
    const res = await request.post(`${apiPrefix}/sucursales`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Sur', direccion: 'Calle 123', telefono: '555-0000' })
    expect(res.status).toBe(201)
  })

  it('maneja error interno', async () => {
    mockPrisma.sucursal.create.mockRejectedValue(new Error('DB error'))
    const res = await request.post(`${apiPrefix}/sucursales`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Sur' })
    expect(res.status).toBe(500)
  })
})

describe('Sucursales Routes - PATCH /sucursales/:id', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.patch(`${apiPrefix}/sucursales/1`).send({ nombre: 'Editado' })
    expect(res.status).toBe(401)
  })

  it('actualiza sucursal exitosamente', async () => {
    mockPrisma.sucursal.update.mockResolvedValue({ id: 1, nombre: 'Principal Editado' })
    const res = await request.patch(`${apiPrefix}/sucursales/1`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Principal Editado' })
    expect(res.status).toBe(200)
  })
})
