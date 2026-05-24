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
  venta: {
    aggregate: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  producto: { count: vi.fn() },
  lote: { count: vi.fn(), update: vi.fn() },
  devolucion: { create: vi.fn() },
}))

const mockVentasService = vi.hoisted(() => ({
  registrarVenta: vi.fn(),
}))

vi.mock('../config/database', () => ({ prisma: mockPrisma }))
vi.mock('../config/redis', () => ({ cache: { get: vi.fn(), set: vi.fn(), del: vi.fn() } }))
vi.mock('../config/mailer', () => ({ sendEmail: vi.fn(), emailTemplates: {} }))
vi.mock('../services/ventas.service', () => ({ VentasService: mockVentasService }))

import supertest from 'supertest'
import { app } from '../app'

const request = supertest(app)
const apiPrefix = '/api/v1'

describe('Ventas Routes - GET /ventas/dashboard', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/ventas/dashboard`)
    expect(res.status).toBe(401)
  })

  it('rechaza con rol no autorizado', async () => {
    const res = await request.get(`${apiPrefix}/ventas/dashboard`)
      .set('Authorization', 'Bearer valid-auxiliar-token')
    expect(res.status).toBe(403)
  })

  it('retorna dashboard con métricas', async () => {
    mockPrisma.venta.aggregate.mockResolvedValue({ _sum: { total: 500000 }, _count: { id: 10 } })
    mockPrisma.producto.count.mockResolvedValue(3)
    mockPrisma.lote.count.mockResolvedValue(5)
    const res = await request.get(`${apiPrefix}/ventas/dashboard`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data.total_dia).toBe(500000)
    expect(res.body.data.transacciones).toBe(10)
    expect(res.body.data.stock_critico).toBe(3)
    expect(res.body.data.por_vencer).toBe(5)
  })

  it('maneja error interno', async () => {
    mockPrisma.venta.aggregate.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/ventas/dashboard`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(500)
  })
})

describe('Ventas Routes - GET /ventas', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/ventas`)
    expect(res.status).toBe(401)
  })

  it('retorna lista paginada para admin (todas las sucursales)', async () => {
    mockPrisma.venta.count.mockResolvedValue(1)
    mockPrisma.venta.findMany.mockResolvedValue([{
      id: 'venta-1', numero: 'V-001', total: 50000, estado: 'PAGADO',
      creadoEn: new Date(), empleado: { nombre: 'Admin', apellido: 'Sistema' },
      cliente: { nombre: 'Juan', apellido: 'Pérez' },
      caja: { sucursal: { nombre: 'Principal' } },
      _count: { detalles: 3 },
    }])
    const res = await request.get(`${apiPrefix}/ventas`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].cajero).toBe('Admin Sistema')
    expect(res.body.data[0].cliente).toBe('Juan Pérez')
    expect(res.body.data[0].sucursal).toBe('Principal')
    expect(res.body.data[0].items).toBe(3)
  })

  it('retorna lista vacía si no hay ventas', async () => {
    mockPrisma.venta.count.mockResolvedValue(0)
    mockPrisma.venta.findMany.mockResolvedValue([])
    const res = await request.get(`${apiPrefix}/ventas`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('filtra por estado', async () => {
    mockPrisma.venta.count.mockResolvedValue(1)
    mockPrisma.venta.findMany.mockResolvedValue([{ id: 'v-1', numero: 'V-001', total: 50000, estado: 'PAGADO', creadoEn: new Date(), empleado: { nombre: 'A', apellido: 'B' }, cliente: null, caja: { sucursal: { nombre: 'P' } }, _count: { detalles: 2 } }])
    const res = await request.get(`${apiPrefix}/ventas?estado=PAGADO`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('maneja error interno', async () => {
    mockPrisma.venta.count.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/ventas`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(500)
  })
})

describe('Ventas Routes - POST /ventas', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.post(`${apiPrefix}/ventas`).send({})
    expect(res.status).toBe(401)
  })

  it('registra venta exitosamente', async () => {
    mockVentasService.registrarVenta.mockResolvedValue({
      id: 'venta-1', numero: 'V-001', total: 50000,
    })
    const res = await request.post(`${apiPrefix}/ventas`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({
        clienteId: 'cli-1', cajaId: 'caja-1',
        metodoPago: 'EFECTIVO', items: [{ productoId: 'prod-1', cantidad: 2, precioUnitario: 2500 }],
      })
    expect(res.status).toBe(201)
    expect(res.body.data.ventaNum).toBe('V-001')
  })

  it('retorna 400 si el servicio lanza error', async () => {
    mockVentasService.registrarVenta.mockRejectedValue(new Error('Stock insuficiente'))
    const res = await request.post(`${apiPrefix}/ventas`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ clienteId: 'cli-1', cajaId: 'caja-1', metodoPago: 'EFECTIVO', items: [] })
    expect(res.status).toBe(400)
  })
})

describe('Ventas Routes - POST /ventas/:id/devolucion', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.post(`${apiPrefix}/ventas/v-1/devolucion`).send({ motivo: 'Defectuoso' })
    expect(res.status).toBe(401)
  })

  it('retorna 404 si venta no existe', async () => {
    mockPrisma.venta.findUnique.mockResolvedValue(null)
    const res = await request.post(`${apiPrefix}/ventas/v-999/devolucion`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ motivo: 'Defectuoso' })
    expect(res.status).toBe(404)
  })

  it('rechaza devolución si ya existe', async () => {
    mockPrisma.venta.findUnique.mockResolvedValue({
      id: 'v-1', estado: 'PAGADO', creadoEn: new Date(),
      total: 50000, devolucion: { id: 'dev-1' }, detalles: [],
    })
    const res = await request.post(`${apiPrefix}/ventas/v-1/devolucion`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ motivo: 'Defectuoso' })
    expect(res.status).toBe(400)
    expect(res.body.mensaje).toContain('ya tiene una devolución')
  })

  it('rechaza devolución de venta no pagada', async () => {
    mockPrisma.venta.findUnique.mockResolvedValue({
      id: 'v-1', estado: 'PENDIENTE', creadoEn: new Date(),
      total: 50000, devolucion: null, detalles: [],
    })
    const res = await request.post(`${apiPrefix}/ventas/v-1/devolucion`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ motivo: 'Defectuoso' })
    expect(res.status).toBe(400)
  })

  it('rechaza devolución después de 15 días', async () => {
    const fechaVieja = new Date()
    fechaVieja.setDate(fechaVieja.getDate() - 20)
    mockPrisma.venta.findUnique.mockResolvedValue({
      id: 'v-1', estado: 'PAGADO', creadoEn: fechaVieja,
      total: 50000, devolucion: null, detalles: [],
    })
    const res = await request.post(`${apiPrefix}/ventas/v-1/devolucion`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ motivo: 'Defectuoso' })
    expect(res.status).toBe(400)
  })

  it('procesa devolución exitosamente con reintegro de stock', async () => {
    const fechaReciente = new Date()
    fechaReciente.setDate(fechaReciente.getDate() - 5)
    mockPrisma.venta.findUnique.mockResolvedValue({
      id: 'v-1', estado: 'PAGADO', creadoEn: fechaReciente,
      total: 50000, devolucion: null,
      detalles: [{ loteId: 'lote-1', cantidad: 2, productoId: 'prod-1', precioUnitario: 2500, subtotal: 5000, id: 'det-1' }],
    })
    const res = await request.post(`${apiPrefix}/ventas/v-1/devolucion`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ motivo: 'Defectuoso', reintegraStock: true })
    expect(res.status).toBe(200)
  })
})
