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
vi.mock('../services/inventario.service', () => ({ InventarioService: { actualizarCostoPromedio: vi.fn() } }))

vi.mock('../utils/jwt.utils', () => ({
  jwtEmpleado: {
    verificar: vi.fn((token: string) => {
      if (token === 'valid-admin-token') return { id: 'emp-1', nombre: 'Admin', email: 'admin@test.com', rol: 'ADMINISTRADOR', sucursalId: 1 }
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

// ── LOTES ─────────────────────────────────────────────────
describe('Lotes Routes - GET /lotes', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).get(`${apiPrefix}/lotes`)
    expect(res.status).toBe(401)
  })

  it('retorna lista paginada', async () => {
    mockPrisma.lote.count.mockResolvedValue(1)
    mockPrisma.lote.findMany.mockResolvedValue([{
      id: 'lote-1', codigoLote: 'LOT-001', cantidadActual: 50,
      fechaVencimiento: new Date('2026-12-31'),
      producto: { nombre: 'Acetaminofén', concentracion: '500 mg' },
      sucursal: { nombre: 'Principal' },
      proveedor: { nombre: 'Genfar' },
    }])
    const res = await supertest(app).get(`${apiPrefix}/lotes`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('filtra por sucursalId', async () => {
    mockPrisma.lote.count.mockResolvedValue(1)
    mockPrisma.lote.findMany.mockResolvedValue([{ id: 'lote-1', codigoLote: 'LOT-001', cantidadActual: 50, fechaVencimiento: new Date(), producto: { nombre: 'P', concentracion: 'C' }, sucursal: { nombre: 'S' }, proveedor: { nombre: 'Prov' } }])
    const res = await supertest(app).get(`${apiPrefix}/lotes?sucursalId=1`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('filtra proximos a vencer', async () => {
    mockPrisma.lote.count.mockResolvedValue(1)
    mockPrisma.lote.findMany.mockResolvedValue([{ id: 'lote-1', codigoLote: 'LOT-001', cantidadActual: 10, fechaVencimiento: new Date(), producto: { nombre: 'P', concentracion: 'C' }, sucursal: { nombre: 'S' }, proveedor: { nombre: 'Prov' } }])
    const res = await supertest(app).get(`${apiPrefix}/lotes?proximosVencer=true`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('retorna array vacío', async () => {
    mockPrisma.lote.count.mockResolvedValue(0)
    mockPrisma.lote.findMany.mockResolvedValue([])
    const res = await supertest(app).get(`${apiPrefix}/lotes`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('Lotes Routes - POST /lotes', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).post(`${apiPrefix}/lotes`).send({})
    expect(res.status).toBe(401)
  })

  it('crea lote exitosamente y actualiza costo promedio', async () => {
    mockPrisma.lote.create.mockResolvedValue({
      id: 'lote-new', codigoLote: 'LOT-NEW', cantidadActual: 100,
    })
    const res = await supertest(app).post(`${apiPrefix}/lotes`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({
        codigoLote: 'LOT-NEW', productoId: '11111111-1111-4111-1111-111111111111',
        sucursalId: 1, cantidadInicial: 100, precioCompra: 15000,
        fechaVencimiento: '2026-12-31',
      })
    expect(res.status).toBe(201)
    const InventarioService = (await import('../services/inventario.service')).InventarioService
    expect(InventarioService.actualizarCostoPromedio).toHaveBeenCalledWith('11111111-1111-4111-1111-111111111111', 15000)
  })

  it('rechaza datos inválidos (validarCuerpo)', async () => {
    const res = await supertest(app).post(`${apiPrefix}/lotes`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ codigoLote: 'AB', productoId: '11111111-1111-4111-1111-111111111111', sucursalId: 1, cantidadInicial: 10, precioCompra: 5000, fechaVencimiento: '2026-12-31' })
    expect(res.status).toBe(422)
  })
})

// ── INVENTARIO ────────────────────────────────────────────
describe('Inventario Routes - POST /inventario/ajuste', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).post(`${apiPrefix}/inventario/ajuste`).send({})
    expect(res.status).toBe(401)
  })

  it('retorna 404 si lote no existe', async () => {
    mockPrisma.lote.findUnique.mockResolvedValue(null)
    const res = await supertest(app).post(`${apiPrefix}/inventario/ajuste`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ loteId: '99999999-9999-4999-9999-999999999999', tipo: 'AJUSTE_POSITIVO', cantidad: 10, motivo: 'INVENTARIO_FISICO' })
    expect(res.status).toBe(404)
  })

  it('rechaza cantidad negativa resultante', async () => {
    mockPrisma.lote.findUnique.mockResolvedValue({ id: 'lote-1', cantidadActual: 5 })
    const res = await supertest(app).post(`${apiPrefix}/inventario/ajuste`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ loteId: '11111111-1111-4111-1111-111111111111', tipo: 'AJUSTE_NEGATIVO', cantidad: 10, motivo: 'INVENTARIO_FISICO' })
    expect(res.status).toBe(400)
  })

  it('realiza ajuste positivo exitosamente', async () => {
    mockPrisma.lote.findUnique.mockResolvedValue({ id: '11111111-1111-4111-1111-111111111111', cantidadActual: 50 })
    mockPrisma.lote.update.mockResolvedValue({})
    mockPrisma.movimientoInventario.create.mockResolvedValue({})
    const res = await supertest(app).post(`${apiPrefix}/inventario/ajuste`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ loteId: '11111111-1111-4111-1111-111111111111', tipo: 'AJUSTE_POSITIVO', cantidad: 10, motivo: 'INVENTARIO_FISICO' })
    expect(res.status).toBe(200)
    expect(res.body.data.nuevaCantidad).toBe(60)
  })

  it('realiza ajuste negativo exitosamente', async () => {
    mockPrisma.lote.findUnique.mockResolvedValue({ id: 'lote-1', cantidadActual: 50 })
    const res = await supertest(app).post(`${apiPrefix}/inventario/ajuste`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ loteId: '11111111-1111-4111-1111-111111111111', tipo: 'AJUSTE_NEGATIVO', cantidad: 5, motivo: 'DANO' })
    expect(res.status).toBe(200)
    expect(res.body.data.nuevaCantidad).toBe(45)
  })
})

describe('Inventario Routes - GET /inventario/movimientos', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).get(`${apiPrefix}/inventario/movimientos`)
    expect(res.status).toBe(401)
  })

  it('retorna lista paginada', async () => {
    mockPrisma.movimientoInventario.count.mockResolvedValue(1)
    mockPrisma.movimientoInventario.findMany.mockResolvedValue([{
      id: 'mov-1', tipo: 'AJUSTE_POSITIVO', cantidad: 10, motivo: 'Reconteo',
      creadoEn: new Date(),
      lote: { producto: { nombre: 'Acetaminofén' } },
      empleado: { nombre: 'Admin' },
    }])
    const res = await supertest(app).get(`${apiPrefix}/inventario/movimientos`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })
})

describe('Inventario Routes - GET /inventario/alertas', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).get(`${apiPrefix}/inventario/alertas`)
    expect(res.status).toBe(401)
  })

  it('retorna alertas no leídas por defecto', async () => {
    mockPrisma.alertaInventario.findMany.mockResolvedValue([{
      id: 'al-1', tipo: 'STOCK_BAJO', leida: false, creadoEn: new Date(),
      mensaje: 'Stock bajo', lote: { producto: { nombre: 'Acetaminofén', id: 'p-1' } },
    }])
    const res = await supertest(app).get(`${apiPrefix}/inventario/alertas`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('retorna todas las alertas si leidas=true', async () => {
    mockPrisma.alertaInventario.findMany.mockResolvedValue([])
    const res = await supertest(app).get(`${apiPrefix}/inventario/alertas?leidas=true`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })
})

describe('Inventario Routes - PATCH /inventario/alertas/:id/leer', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).patch(`${apiPrefix}/inventario/alertas/al-1/leer`)
    expect(res.status).toBe(401)
  })

  it('marca alerta como leída', async () => {
    mockPrisma.alertaInventario.update.mockResolvedValue({ id: 'al-1', leida: true })
    const res = await supertest(app).patch(`${apiPrefix}/inventario/alertas/al-1/leer`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toContain('leída')
  })
})

// ── PROVEEDORES ───────────────────────────────────────────
describe('Proveedores Routes - GET /proveedores', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await supertest(app).get(`${apiPrefix}/proveedores`)
    expect(res.status).toBe(401)
  })

  it('retorna lista paginada', async () => {
    mockPrisma.proveedor.count.mockResolvedValue(1)
    mockPrisma.proveedor.findMany.mockResolvedValue([{
      id: 'prov-1', nombre: 'Genfar', nit: '123456789',
      _count: { ordenesCompra: 5, lotes: 10 },
    }])
    const res = await supertest(app).get(`${apiPrefix}/proveedores`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('filtra por query q', async () => {
    mockPrisma.proveedor.count.mockResolvedValue(1)
    mockPrisma.proveedor.findMany.mockResolvedValue([{ id: 'prov-1', nombre: 'Genfar', nit: '123', _count: { ordenesCompra: 0, lotes: 0 } }])
    const res = await supertest(app).get(`${apiPrefix}/proveedores?q=Genfar`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('retorna array vacío', async () => {
    mockPrisma.proveedor.count.mockResolvedValue(0)
    mockPrisma.proveedor.findMany.mockResolvedValue([])
    const res = await supertest(app).get(`${apiPrefix}/proveedores`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('Proveedores Routes - POST /proveedores', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('crea proveedor exitosamente', async () => {
    mockPrisma.proveedor.create.mockResolvedValue({ id: 'prov-2', nombre: 'Nuevo Prov', nit: '987654321' })
    const res = await supertest(app).post(`${apiPrefix}/proveedores`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Nuevo Prov', nit: '987654321', telefono: '555-0000' })
    expect(res.status).toBe(201)
  })

  it('maneja NIT duplicado P2002', async () => {
    mockPrisma.proveedor.create.mockRejectedValue({ code: 'P2002' })
    const res = await supertest(app).post(`${apiPrefix}/proveedores`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Nuevo Prov', nit: 'dup' })
    expect(res.status).toBe(409)
  })
})

describe('Proveedores Routes - GET /proveedores/:id', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna detalle del proveedor', async () => {
    mockPrisma.proveedor.findUnique.mockResolvedValue({ id: 'prov-1', nombre: 'Genfar', _count: { ordenesCompra: 5, lotes: 10 } })
    const res = await supertest(app).get(`${apiPrefix}/proveedores/prov-1`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('retorna 404 si no existe', async () => {
    mockPrisma.proveedor.findUnique.mockResolvedValue(null)
    const res = await supertest(app).get(`${apiPrefix}/proveedores/prov-999`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(404)
  })
})

describe('Proveedores Routes - PATCH /proveedores/:id', () => {
  let app: express.Express
  beforeAll(() => { app = createApp() })
  beforeEach(() => { vi.clearAllMocks() })

  it('actualiza proveedor', async () => {
    mockPrisma.proveedor.update.mockResolvedValue({ id: 'prov-1', nombre: 'Editado' })
    const res = await supertest(app).patch(`${apiPrefix}/proveedores/prov-1`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Editado' })
    expect(res.status).toBe(200)
  })
})
