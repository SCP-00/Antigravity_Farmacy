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
  lote: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  producto: { count: vi.fn(), update: vi.fn() },
  movimientoInventario: {
    count: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  alertaInventario: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  proveedor: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

const mockInventarioService = vi.hoisted(() => ({
  actualizarCostoPromedio: vi.fn(),
}))

vi.mock('../config/database', () => ({ prisma: mockPrisma }))
vi.mock('../config/redis', () => ({ cache: { get: vi.fn(), set: vi.fn(), del: vi.fn(), delPattern: vi.fn() } }))
vi.mock('../config/mailer', () => ({ sendEmail: vi.fn(), emailTemplates: {} }))
vi.mock('../services/inventario.service', () => ({ InventarioService: mockInventarioService }))

import supertest from 'supertest'
import { app } from '../app'

const request = supertest(app)
const apiPrefix = '/api/v1'

// ── LOTES ─────────────────────────────────────────────────
describe('Lotes Routes - GET /lotes', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/lotes`)
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
    const res = await request.get(`${apiPrefix}/lotes`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('filtra por sucursalId', async () => {
    mockPrisma.lote.count.mockResolvedValue(1)
    mockPrisma.lote.findMany.mockResolvedValue([{ id: 'lote-1', codigoLote: 'LOT-001', cantidadActual: 50, fechaVencimiento: new Date(), producto: { nombre: 'P', concentracion: 'C' }, sucursal: { nombre: 'S' }, proveedor: { nombre: 'Prov' } }])
    const res = await request.get(`${apiPrefix}/lotes?sucursalId=1`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('filtra proximos a vencer', async () => {
    mockPrisma.lote.count.mockResolvedValue(1)
    mockPrisma.lote.findMany.mockResolvedValue([{ id: 'lote-1', codigoLote: 'LOT-001', cantidadActual: 10, fechaVencimiento: new Date(), producto: { nombre: 'P', concentracion: 'C' }, sucursal: { nombre: 'S' }, proveedor: { nombre: 'Prov' } }])
    const res = await request.get(`${apiPrefix}/lotes?proximosVencer=true`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('retorna array vacío', async () => {
    mockPrisma.lote.count.mockResolvedValue(0)
    mockPrisma.lote.findMany.mockResolvedValue([])
    const res = await request.get(`${apiPrefix}/lotes`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('Lotes Routes - POST /lotes', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.post(`${apiPrefix}/lotes`).send({})
    expect(res.status).toBe(401)
  })

  it('crea lote exitosamente y actualiza costo promedio', async () => {
    mockPrisma.lote.create.mockResolvedValue({
      id: 'lote-new', codigoLote: 'LOT-NEW', cantidadActual: 100,
    })
    const res = await request.post(`${apiPrefix}/lotes`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({
        productoId: 'prod-1', codigoLote: 'LOT-NEW',
        cantidadInicial: 100, precioCompra: 15000,
        fechaVencimiento: '2026-12-31',
      })
    expect(res.status).toBe(201)
    expect(mockInventarioService.actualizarCostoPromedio).toHaveBeenCalledWith('prod-1', 15000)
  })

  it('rechaza datos inválidos (validarCuerpo)', async () => {
    const res = await request.post(`${apiPrefix}/lotes`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ productoId: 'prod-1' })
    expect(res.status).toBe(400)
  })
})

// ── INVENTARIO ────────────────────────────────────────────
describe('Inventario Routes - POST /inventario/ajuste', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.post(`${apiPrefix}/inventario/ajuste`).send({})
    expect(res.status).toBe(401)
  })

  it('retorna 404 si lote no existe', async () => {
    mockPrisma.lote.findUnique.mockResolvedValue(null)
    const res = await request.post(`${apiPrefix}/inventario/ajuste`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ loteId: 'lote-999', tipo: 'AJUSTE_POSITIVO', cantidad: 10, motivo: 'Ajuste manual' })
    expect(res.status).toBe(404)
  })

  it('rechaza cantidad negativa resultante', async () => {
    mockPrisma.lote.findUnique.mockResolvedValue({ id: 'lote-1', cantidadActual: 5 })
    const res = await request.post(`${apiPrefix}/inventario/ajuste`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ loteId: 'lote-1', tipo: 'AJUSTE_NEGATIVO', cantidad: 10, motivo: 'Ajuste' })
    expect(res.status).toBe(400)
  })

  it('realiza ajuste positivo exitosamente', async () => {
    mockPrisma.lote.findUnique.mockResolvedValue({ id: 'lote-1', cantidadActual: 50 })
    mockPrisma.lote.update.mockResolvedValue({})
    mockPrisma.movimientoInventario.create.mockResolvedValue({})
    const res = await request.post(`${apiPrefix}/inventario/ajuste`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ loteId: 'lote-1', tipo: 'AJUSTE_POSITIVO', cantidad: 10, motivo: 'Reconteo' })
    expect(res.status).toBe(200)
    expect(res.body.data.nuevaCantidad).toBe(60)
  })

  it('realiza ajuste negativo exitosamente', async () => {
    mockPrisma.lote.findUnique.mockResolvedValue({ id: 'lote-1', cantidadActual: 50 })
    const res = await request.post(`${apiPrefix}/inventario/ajuste`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ loteId: 'lote-1', tipo: 'AJUSTE_NEGATIVO', cantidad: 5, motivo: 'Rotura' })
    expect(res.status).toBe(200)
    expect(res.body.data.nuevaCantidad).toBe(45)
  })
})

describe('Inventario Routes - GET /inventario/movimientos', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/inventario/movimientos`)
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
    const res = await request.get(`${apiPrefix}/inventario/movimientos`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })
})

describe('Inventario Routes - GET /inventario/alertas', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/inventario/alertas`)
    expect(res.status).toBe(401)
  })

  it('retorna alertas no leídas por defecto', async () => {
    mockPrisma.alertaInventario.findMany.mockResolvedValue([{
      id: 'al-1', tipo: 'STOCK_BAJO', leida: false, creadoEn: new Date(),
      mensaje: 'Stock bajo', lote: { producto: { nombre: 'Acetaminofén', id: 'p-1' } },
    }])
    const res = await request.get(`${apiPrefix}/inventario/alertas`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('retorna todas las alertas si leidas=true', async () => {
    mockPrisma.alertaInventario.findMany.mockResolvedValue([])
    const res = await request.get(`${apiPrefix}/inventario/alertas?leidas=true`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })
})

describe('Inventario Routes - PATCH /inventario/alertas/:id/leer', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.patch(`${apiPrefix}/inventario/alertas/al-1/leer`)
    expect(res.status).toBe(401)
  })

  it('marca alerta como leída', async () => {
    mockPrisma.alertaInventario.update.mockResolvedValue({ id: 'al-1', leida: true })
    const res = await request.patch(`${apiPrefix}/inventario/alertas/al-1/leer`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toContain('leída')
  })
})

// ── PROVEEDORES ───────────────────────────────────────────
describe('Proveedores Routes - GET /proveedores', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/proveedores`)
    expect(res.status).toBe(401)
  })

  it('retorna lista paginada', async () => {
    mockPrisma.proveedor.count.mockResolvedValue(1)
    mockPrisma.proveedor.findMany.mockResolvedValue([{
      id: 'prov-1', nombre: 'Genfar', nit: '123456789',
      _count: { ordenesCompra: 5, lotes: 10 },
    }])
    const res = await request.get(`${apiPrefix}/proveedores`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('filtra por query q', async () => {
    mockPrisma.proveedor.count.mockResolvedValue(1)
    mockPrisma.proveedor.findMany.mockResolvedValue([{ id: 'prov-1', nombre: 'Genfar', nit: '123', _count: { ordenesCompra: 0, lotes: 0 } }])
    const res = await request.get(`${apiPrefix}/proveedores?q=Genfar`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('retorna array vacío', async () => {
    mockPrisma.proveedor.count.mockResolvedValue(0)
    mockPrisma.proveedor.findMany.mockResolvedValue([])
    const res = await request.get(`${apiPrefix}/proveedores`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('Proveedores Routes - POST /proveedores', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('crea proveedor exitosamente', async () => {
    mockPrisma.proveedor.create.mockResolvedValue({ id: 'prov-2', nombre: 'Nuevo Prov', nit: '987654321' })
    const res = await request.post(`${apiPrefix}/proveedores`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Nuevo Prov', nit: '987654321', telefono: '555-0000' })
    expect(res.status).toBe(201)
  })

  it('maneja NIT duplicado P2002', async () => {
    mockPrisma.proveedor.create.mockRejectedValue({ code: 'P2002' })
    const res = await request.post(`${apiPrefix}/proveedores`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Nuevo Prov', nit: 'dup' })
    expect(res.status).toBe(409)
  })
})

describe('Proveedores Routes - GET /proveedores/:id', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna detalle del proveedor', async () => {
    mockPrisma.proveedor.findUnique.mockResolvedValue({ id: 'prov-1', nombre: 'Genfar', _count: { ordenesCompra: 5, lotes: 10 } })
    const res = await request.get(`${apiPrefix}/proveedores/prov-1`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('retorna 404 si no existe', async () => {
    mockPrisma.proveedor.findUnique.mockResolvedValue(null)
    const res = await request.get(`${apiPrefix}/proveedores/prov-999`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(404)
  })
})

describe('Proveedores Routes - PATCH /proveedores/:id', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('actualiza proveedor', async () => {
    mockPrisma.proveedor.update.mockResolvedValue({ id: 'prov-1', nombre: 'Editado' })
    const res = await request.patch(`${apiPrefix}/proveedores/prov-1`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Editado' })
    expect(res.status).toBe(200)
  })
})
