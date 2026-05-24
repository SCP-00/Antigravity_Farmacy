import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.JWT_SECRET = 'test-secret-for-jwt'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
  process.env.NODE_ENV = 'test'
  process.env.API_PREFIX = '/api/v1'
  process.env.FRONTEND_URL = 'http://localhost:5173'
  process.env.REDIS_URL = 'redis://localhost:6379'
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
  process.env.CLOUDINARY_API_KEY = 'test-key'
  process.env.CLOUDINARY_API_SECRET = 'test-secret'
})

vi.mock('dotenv', () => ({ default: { config: vi.fn() }, config: vi.fn() }))

const mockPrisma = vi.hoisted(() => ({
  venta: {
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  },
  lote: {
    aggregate: vi.fn(),
    findMany: vi.fn(),
  },
  producto: { count: vi.fn() },
}))

vi.mock('../config/database', () => ({ prisma: mockPrisma }))
vi.mock('../config/redis', () => ({ cache: { get: vi.fn(), set: vi.fn(), del: vi.fn() } }))
vi.mock('../config/mailer', () => ({ sendEmail: vi.fn(), emailTemplates: {} }))

// Mock Cloudinary
vi.mock('cloudinary', () => ({
  default: {
    v2: {
      config: vi.fn(),
      uploader: {
        upload_stream: vi.fn(),
        destroy: vi.fn(),
      },
    },
  },
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}))

// Mock Multer
vi.mock('multer', () => ({
  default: () => ({
    single: () => (req: any, _res: any, next: any) => { req.file = undefined; next() },
  }),
}))

import supertest from 'supertest'
import { app } from '../app'

const request = supertest(app)
const apiPrefix = '/api/v1'

// ── REPORTES ──────────────────────────────────────────────
describe('Reportes Routes - GET /reportes/ventas', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/reportes/ventas`)
    expect(res.status).toBe(401)
  })

  it('rechaza con rol no autorizado', async () => {
    const res = await request.get(`${apiPrefix}/reportes/ventas`)
      .set('Authorization', 'Bearer valid-auxiliar-token')
    expect(res.status).toBe(403)
  })

  it('retorna reporte de ventas con totales, por día y por método', async () => {
    mockPrisma.venta.aggregate.mockResolvedValue({ _sum: { total: 1000000, descuento: 50000 }, _count: { id: 20 }, _avg: { total: 50000 } })
    mockPrisma.venta.groupBy
      .mockResolvedValueOnce([{ creadoEn: new Date(), _sum: { total: 500000 }, _count: { id: 10 } }])
      .mockResolvedValueOnce([{ metodoPago: 'EFECTIVO', _sum: { total: 600000 }, _count: { id: 12 } }])
    const res = await request.get(`${apiPrefix}/reportes/ventas`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data.totales).toBeDefined()
    expect(res.body.data.porDia).toBeDefined()
    expect(res.body.data.porMetodo).toBeDefined()
  })

  it('filtra por fechas', async () => {
    mockPrisma.venta.aggregate.mockResolvedValue({ _sum: { total: 0, descuento: 0 }, _count: { id: 0 }, _avg: { total: 0 } })
    mockPrisma.venta.groupBy.mockResolvedValue([]).mockResolvedValue([])
    const res = await request.get(`${apiPrefix}/reportes/ventas?desde=2026-01-01&hasta=2026-12-31`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('maneja error interno', async () => {
    mockPrisma.venta.aggregate.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/reportes/ventas`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(500)
  })
})

describe('Reportes Routes - GET /reportes/inventario', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna reporte de inventario', async () => {
    mockPrisma.lote.aggregate.mockResolvedValue({ _sum: { cantidadActual: 5000 } })
    mockPrisma.producto.count.mockResolvedValueOnce(5).mockResolvedValueOnce(3)
    mockPrisma.lote.findMany.mockResolvedValue([
      { producto: { nombre: 'Acetaminofén' }, codigoLote: 'LOT-001', cantidadActual: 10, fechaVencimiento: new Date('2026-06-01'), id: 'lote-1', loteId: null, productoId: 'p-1', sucursalId: 1, proveedorId: null, ordenCompraId: null, precioCompra: 15000, cantidadInicial: 10, creadoEn: new Date(), actualizadoEn: new Date() },
    ])
    const res = await request.get(`${apiPrefix}/reportes/inventario`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data.stockTotal).toBe(5000)
    expect(res.body.data.stockCritico).toBe(5)
    expect(res.body.data.agotados).toBe(3)
    expect(res.body.data.porVencer).toHaveLength(1)
  })

  it('maneja error interno', async () => {
    mockPrisma.lote.aggregate.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/reportes/inventario`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(500)
  })
})

// ── IMÁGENES ──────────────────────────────────────────────
describe('Imagenes Routes - POST /imagenes/subir', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.post(`${apiPrefix}/imagenes/subir`)
    expect(res.status).toBe(401)
  })

  it('rechaza con rol no autorizado', async () => {
    const res = await request.post(`${apiPrefix}/imagenes/subir`)
      .set('Authorization', 'Bearer valid-farmaceuta-token')
    expect(res.status).toBe(403)
  })

  it('rechaza si no se envía imagen', async () => {
    const res = await request.post(`${apiPrefix}/imagenes/subir`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(400)
  })
})

describe('Imagenes Routes - DELETE /imagenes/:publicId', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.delete(`${apiPrefix}/imagenes/test-public-id`)
    expect(res.status).toBe(401)
  })

  it('rechaza con rol no autorizado (solo ADMIN)', async () => {
    const res = await request.delete(`${apiPrefix}/imagenes/test-public-id`)
      .set('Authorization', 'Bearer valid-auxiliar-token')
    expect(res.status).toBe(403)
  })
})
