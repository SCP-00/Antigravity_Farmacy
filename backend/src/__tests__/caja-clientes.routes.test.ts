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
  caja: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  venta: {
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  cliente: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
}))

vi.mock('../config/database', () => ({ prisma: mockPrisma }))
vi.mock('../config/redis', () => ({ cache: { get: vi.fn(), set: vi.fn(), del: vi.fn() } }))
vi.mock('../config/mailer', () => ({ sendEmail: vi.fn(), emailTemplates: {} }))

import supertest from 'supertest'
import { app } from '../app'

const request = supertest(app)
const apiPrefix = '/api/v1'

// ── CAJA ──────────────────────────────────────────────────
describe('Caja Routes - GET /caja/actual', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/caja/actual`)
    expect(res.status).toBe(401)
  })

  it('rechaza con rol no autorizado', async () => {
    const res = await request.get(`${apiPrefix}/caja/actual`)
      .set('Authorization', 'Bearer valid-auxiliar-token')
    expect(res.status).toBe(403)
  })

  it('retorna caja abierta cuando existe', async () => {
    mockPrisma.caja.findFirst.mockResolvedValue({
      id: 'caja-1', empleadoId: '1', montoApertura: 500000, cerradaEn: null,
      sucursal: { nombre: 'Principal' },
    })
    const res = await request.get(`${apiPrefix}/caja/actual`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe('caja-1')
  })

  it('retorna null cuando no hay caja abierta', async () => {
    mockPrisma.caja.findFirst.mockResolvedValue(null)
    const res = await request.get(`${apiPrefix}/caja/actual`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toBeNull()
  })

  it('maneja error interno', async () => {
    mockPrisma.caja.findFirst.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/caja/actual`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(500)
  })
})

describe('Caja Routes - POST /caja/abrir', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.post(`${apiPrefix}/caja/abrir`).send({ sucursalId: 1, montoApertura: 500000 })
    expect(res.status).toBe(401)
  })

  it('rechaza si ya hay caja abierta', async () => {
    mockPrisma.caja.findFirst.mockResolvedValue({ id: 'caja-1', cerradaEn: null })
    const res = await request.post(`${apiPrefix}/caja/abrir`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ sucursalId: 1, montoApertura: 500000 })
    expect(res.status).toBe(409)
  })

  it('abre caja exitosamente', async () => {
    mockPrisma.caja.findFirst.mockResolvedValue(null)
    mockPrisma.caja.create.mockResolvedValue({ id: 'caja-nueva', montoApertura: 500000 })
    const res = await request.post(`${apiPrefix}/caja/abrir`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ sucursalId: 1, montoApertura: 500000 })
    expect(res.status).toBe(201)
  })
})

describe('Caja Routes - POST /caja/:id/cerrar', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza si hay ventas pendientes', async () => {
    mockPrisma.venta.count.mockResolvedValue(2)
    const res = await request.post(`${apiPrefix}/caja/caja-1/cerrar`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ montoCierre: 1000000 })
    expect(res.status).toBe(400)
    expect(res.body.mensaje).toContain('pendientes')
  })

  it('cierra caja exitosamente con diferencia', async () => {
    mockPrisma.venta.count.mockResolvedValue(0)
    mockPrisma.venta.aggregate.mockResolvedValue({ _sum: { total: 900000 } })
    mockPrisma.caja.update.mockResolvedValue({ id: 'caja-1', cerradaEn: new Date() })
    const res = await request.post(`${apiPrefix}/caja/caja-1/cerrar`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ montoCierre: 1000000, totalEfectivo: 500000, totalTarjeta: 400000, totalOnline: 100000 })
    expect(res.status).toBe(200)
  })
})

describe('Caja Routes - GET /caja/historial', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna historial para admin (todas las cajas)', async () => {
    mockPrisma.caja.findMany.mockResolvedValue([{ id: 'caja-1', empleado: { nombre: 'A', apellido: 'B' }, sucursal: { nombre: 'P' }, _count: { ventas: 5 } }])
    const res = await request.get(`${apiPrefix}/caja/historial`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/caja/historial`)
    expect(res.status).toBe(401)
  })
})

// ── CLIENTES ADMIN ────────────────────────────────────────
describe('Clientes Admin Routes - GET /clientes', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/clientes`)
    expect(res.status).toBe(401)
  })

  it('retorna lista paginada de clientes', async () => {
    mockPrisma.cliente.count.mockResolvedValue(1)
    mockPrisma.cliente.findMany.mockResolvedValue([{
      id: 'cli-1', nombre: 'Juan', apellido: 'Pérez',
      email: 'juan@test.com', telefono: '555-0000',
      puntosAcumulados: 100, creadoEn: new Date(),
      _count: { ventas: 3 },
    }])
    const res = await request.get(`${apiPrefix}/clientes`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.meta.total).toBe(1)
  })

  it('filtra por query q', async () => {
    mockPrisma.cliente.count.mockResolvedValue(1)
    mockPrisma.cliente.findMany.mockResolvedValue([{ id: 'cli-1', nombre: 'Juan', _count: { ventas: 0 } }])
    const res = await request.get(`${apiPrefix}/clientes?q=Juan`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('retorna array vacío si no hay clientes', async () => {
    mockPrisma.cliente.count.mockResolvedValue(0)
    mockPrisma.cliente.findMany.mockResolvedValue([])
    const res = await request.get(`${apiPrefix}/clientes`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('maneja error interno', async () => {
    mockPrisma.cliente.count.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/clientes`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(500)
  })
})

describe('Clientes Admin Routes - GET /clientes/:id', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/clientes/cli-1`)
    expect(res.status).toBe(401)
  })

  it('retorna 404 si cliente no existe', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(null)
    const res = await request.get(`${apiPrefix}/clientes/cli-999`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(404)
  })

  it('retorna detalle del cliente', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue({
      id: 'cli-1', nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com',
      ventas: [{ numero: 'V-001', total: 50000, creadoEn: new Date(), estado: 'PAGADO' }],
    })
    const res = await request.get(`${apiPrefix}/clientes/cli-1`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data.nombre).toBe('Juan')
    expect(res.body.data.ventas).toHaveLength(1)
  })

  it('maneja error interno', async () => {
    mockPrisma.cliente.findUnique.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/clientes/cli-1`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(500)
  })
})
