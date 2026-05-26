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
  devolucion: { create: vi.fn() },
}))

const mockCache = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn(),
  del: vi.fn(),
  delPattern: vi.fn(),
}))

const mockBcrypt = vi.hoisted(() => ({ hash: vi.fn() }))
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

vi.mock('../utils/jwt.utils', () => ({
  jwtEmpleado: {
    verificar: vi.fn((token: string) => {
      if (token === 'valid-admin-token') return { id: 'emp-1', nombre: 'Admin', email: 'admin@test.com', rol: 'ADMINISTRADOR', sucursalId: 1 }
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

// ── EMPLEADOS ─────────────────────────────────────────────
describe('Empleados Routes - GET /empleados', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).get(`${apiPrefix}/empleados`)
    expect(res.status).toBe(401)
  })

  it('rechaza con rol no autorizado', async () => {
    const res = await supertest(app).get(`${apiPrefix}/empleados`)
      .set('Authorization', 'Bearer valid-auxiliar-token')
    expect(res.status).toBe(403)
  })

  it('retorna lista paginada', async () => {
    mockPrisma.empleado.count.mockResolvedValue(1)
    mockPrisma.empleado.findMany.mockResolvedValue([{
      id: 'emp-1', nombre: 'Admin', apellido: 'Sistema',
      email: 'admin@farmacy.co', rol: 'ADMINISTRADOR',
      activo: true, ultimoAcceso: null,
      sucursal: { nombre: 'Principal' },
    }])
    const res = await supertest(app).get(`${apiPrefix}/empleados`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.meta.total).toBe(1)
  })

  it('retorna array vacío', async () => {
    mockPrisma.empleado.count.mockResolvedValue(0)
    mockPrisma.empleado.findMany.mockResolvedValue([])
    const res = await supertest(app).get(`${apiPrefix}/empleados`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('maneja error interno', async () => {
    mockPrisma.empleado.count.mockRejectedValue(new Error('DB error'))
    const res = await supertest(app).get(`${apiPrefix}/empleados`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(500)
  })
})

describe('Empleados Routes - POST /empleados', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).post(`${apiPrefix}/empleados`).send({})
    expect(res.status).toBe(401)
  })

  it('crea empleado exitosamente', async () => {
    mockBcrypt.hash.mockResolvedValue('$2a$12$hash123')
    mockPrisma.empleado.create.mockResolvedValue({
      id: 'emp-2', nombre: 'Juan', email: 'juan@farmacy.co', rol: 'FARMACEUTA',
    })
    const res = await supertest(app).post(`${apiPrefix}/empleados`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Juan', apellido: 'Pérez', email: 'juan@farmacy.co', password: 'Pass123!', rol: 'FARMACEUTA', sucursalId: 1 })
    expect(res.status).toBe(201)
  })

  it('maneja email duplicado P2002', async () => {
    mockBcrypt.hash.mockResolvedValue('hash')
    mockPrisma.empleado.create.mockRejectedValue({ code: 'P2002' })
    const res = await supertest(app).post(`${apiPrefix}/empleados`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Juan', apellido: 'Pérez', email: 'dup@farmacy.co', password: 'Pass123!', rol: 'FARMACEUTA', sucursalId: 1 })
    expect(res.status).toBe(409)
  })
})

describe('Empleados Routes - PATCH /empleados/:id', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('actualiza empleado sin password', async () => {
    mockPrisma.empleado.update.mockResolvedValue({ id: 'emp-1', nombre: 'Admin Editado', email: 'admin@farmacy.co', rol: 'ADMINISTRADOR', activo: true })
    const res = await supertest(app).patch(`${apiPrefix}/empleados/emp-1`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Admin Editado' })
    expect(res.status).toBe(200)
  })

  it('actualiza empleado con password', async () => {
    mockBcrypt.hash.mockResolvedValue('$2a$12$newhash')
    mockPrisma.empleado.update.mockResolvedValue({ id: 'emp-1', nombre: 'Admin', email: 'admin@farmacy.co', rol: 'ADMINISTRADOR', activo: true })
    const res = await supertest(app).patch(`${apiPrefix}/empleados/emp-1`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ password: 'NewPass1!' })
    expect(res.status).toBe(200)
  })
})

describe('Empleados Routes - PATCH /empleados/:id/estado', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('activa empleado', async () => {
    mockPrisma.empleado.update.mockResolvedValue({})
    const res = await supertest(app).patch(`${apiPrefix}/empleados/emp-1/estado`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ activo: true })
    expect(res.status).toBe(200)
  })

  it('desactiva empleado', async () => {
    mockPrisma.empleado.update.mockResolvedValue({})
    const res = await supertest(app).patch(`${apiPrefix}/empleados/emp-1/estado`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ activo: false })
    expect(res.status).toBe(200)
  })
})

// ── COMPRAS ───────────────────────────────────────────────
describe('Compras Routes - GET /compras', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).get(`${apiPrefix}/compras`)
    expect(res.status).toBe(401)
  })

  it('retorna lista paginada', async () => {
    mockPrisma.ordenCompra.count.mockResolvedValue(1)
    mockPrisma.ordenCompra.findMany.mockResolvedValue([{
      id: 'oc-1', proveedor: { nombre: 'Proveedor SA' },
      empleado: { nombre: 'Admin' }, _count: { detalles: 3 },
      estado: 'PENDIENTE', total: 150000,
      creadoEn: new Date(), subtotal: 150000, iva: 0,
    }])
    const res = await supertest(app).get(`${apiPrefix}/compras`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('filtra por estado', async () => {
    mockPrisma.ordenCompra.count.mockResolvedValue(1)
    mockPrisma.ordenCompra.findMany.mockResolvedValue([{ id: 'oc-1', proveedor: { nombre: 'P' }, empleado: { nombre: 'A' }, _count: { detalles: 1 }, estado: 'RECIBIDA', total: 100000, creadoEn: new Date(), subtotal: 100000, iva: 0 }])
    const res = await supertest(app).get(`${apiPrefix}/compras?estado=RECIBIDA`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })
})

describe('Compras Routes - POST /compras', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).post(`${apiPrefix}/compras`).send({})
    expect(res.status).toBe(401)
  })

  it('crea orden de compra con detalles', async () => {
    mockPrisma.ordenCompra.create.mockResolvedValue({
      id: 'oc-1', subtotal: 150000, total: 150000, detalles: [{ id: 'det-1' }],
    })
    const res = await supertest(app).post(`${apiPrefix}/compras`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({
        proveedorId: 'prov-1',
        detalles: [{ productoId: 'prod-1', cantidadPedida: 10, precioUnitario: 15000 }],
      })
    expect(res.status).toBe(201)
  })

  it('maneja error interno', async () => {
    mockPrisma.ordenCompra.create.mockRejectedValue(new Error('DB error'))
    const res = await supertest(app).post(`${apiPrefix}/compras`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ proveedorId: 'prov-1', detalles: [] })
    expect(res.status).toBe(500)
  })
})

describe('Compras Routes - GET /compras/:id', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna detalle de orden', async () => {
    mockPrisma.ordenCompra.findUnique.mockResolvedValue({
      id: 'oc-1', proveedor: { nombre: 'P', nit: '123' },
      empleado: { nombre: 'A', apellido: 'B' },
      detalles: [{ producto: { nombre: 'Acetaminofén', presentacion: 'Tab' } }],
      estado: 'PENDIENTE', total: 150000, subtotal: 150000, iva: 0, notas: null, creadoEn: new Date(), fechaEntregaEst: null, recibidaEn: null, proveedorId: 'prov-1', empleadoId: 'emp-1', sucursalId: null,
    })
    const res = await supertest(app).get(`${apiPrefix}/compras/oc-1`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('retorna 404 si no existe', async () => {
    mockPrisma.ordenCompra.findUnique.mockResolvedValue(null)
    const res = await supertest(app).get(`${apiPrefix}/compras/oc-999`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(404)
  })
})

describe('Compras Routes - POST /compras/:id/recibir', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).post(`${apiPrefix}/compras/oc-1/recibir`).send({})
    expect(res.status).toBe(401)
  })

  it('retorna 404 si orden no existe', async () => {
    mockPrisma.ordenCompra.findUnique.mockResolvedValue(null)
    const res = await supertest(app).post(`${apiPrefix}/compras/oc-999/recibir`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ sucursalId: 1, lotes: [] })
    expect(res.status).toBe(404)
  })

  it('rechaza si ya fue recibida', async () => {
    mockPrisma.ordenCompra.findUnique.mockResolvedValue({ id: 'oc-1', estado: 'RECIBIDA', detalles: [] })
    const res = await supertest(app).post(`${apiPrefix}/compras/oc-1/recibir`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ sucursalId: 1, lotes: [] })
      expect(res.status).toBe(400)
  })

  it('procesa recepción exitosamente', async () => {
    mockPrisma.ordenCompra.findUnique.mockResolvedValue({
      id: 'oc-1', estado: 'PENDIENTE', proveedorId: 'prov-1',
      detalles: [{ id: 'det-1', productoId: 'prod-1', cantidadPedida: 10, precioUnitario: 15000 }],
    })
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => cb(mockPrisma))
    mockPrisma.lote.create.mockResolvedValue({})
    mockPrisma.ordenCompra.update.mockResolvedValue({})
    const res = await supertest(app).post(`${apiPrefix}/compras/oc-1/recibir`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({
        sucursalId: 1,
        lotes: [{ productoId: 'prod-1', codigoLote: 'LOT-NEW', fechaVencimiento: '2026-12-31', cantidad: 10, precioCompra: 15000 }],
      })
    expect(res.status).toBe(200)
    expect(mockPrisma.lote.create).toHaveBeenCalled()
    expect(mockPrisma.ordenCompra.update).toHaveBeenCalled()
  })

  it('maneja error interno en recepción', async () => {
    mockPrisma.ordenCompra.findUnique.mockRejectedValue(new Error('DB error'))
    const res = await supertest(app).post(`${apiPrefix}/compras/oc-1/recibir`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ sucursalId: 1, lotes: [] })
    expect(res.status).toBe(500)
  })
})
