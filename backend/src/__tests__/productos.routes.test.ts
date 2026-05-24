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
  producto: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

const mockCache = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delPattern: vi.fn(),
}))

vi.mock('../config/database', () => ({ prisma: mockPrisma }))
vi.mock('../config/redis', () => ({ cache: mockCache }))
vi.mock('../config/mailer', () => ({ sendEmail: vi.fn(), emailTemplates: {} }))

import supertest from 'supertest'
import { app } from '../app'

const request = supertest(app)
const apiPrefix = '/api/v1'

const createMockProducto = (overrides = {}) => ({
  id: 'prod-1', nombre: 'Acetaminofén', slug: 'acetaminofen', presentacion: 'Tabletas',
  concentracion: '500 mg', laboratorio: 'Genfar', requiereRx: false,
  precioVenta: 2500, imagenUrl: null, cum: '12345', registroInvima: 'INVIMA-2023-001',
  principioActivo: 'Acetaminofén', atc: 'N02BE01', descripcionAtc: 'Analgésicos',
  titular: 'Genfar', expediente: 'EXP-001', formaFarmaceutica: 'Tableta',
  viaAdministracion: 'Oral', estadoCum: 'ACTIVO', estadoRegistro: 'VIGENTE',
  fechaExpedicion: null, fechaVencimientoRegistro: null, fechaActivoCum: null,
  fechaInactivoCum: null, esMuestraMedica: false, alergenos: '', advertencias: '',
  indicaciones: '', contraindicaciones: '', reaccionesAdversas: '',
  interacciones: '', modoUso: '', unidadReferencia: 'Tableta', cantidad: 10,
  unidadMedida: 'unidades', modalidad: 'Venta Libre', ium: null,
  activo: true, stockMinimo: 5,
  categoria: { id: 1, nombre: 'Analgésicos', slug: 'analgesicos', icono: '💊' },
  categoriaId: 1,
  lotes: [{ cantidadActual: 50, fechaVencimiento: new Date('2026-12-31'), codigoLote: 'LOT-001' }],
  ...overrides,
})

describe('Productos Routes - GET /productos/buscar (público)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna productos cacheados', async () => {
    mockCache.get.mockResolvedValue({ data: [createMockProducto()], meta: { pagina: 1, limite: 20, total: 1, totalPaginas: 1 } })
    const res = await request.get(`${apiPrefix}/productos/buscar`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('consulta BD si no hay caché', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.producto.count.mockResolvedValue(1)
    mockPrisma.producto.findMany.mockResolvedValue([createMockProducto()])
    const res = await request.get(`${apiPrefix}/productos/buscar`)
    expect(res.status).toBe(200)
    expect(res.body.data[0].nombre).toBe('Acetaminofén')
    expect(res.body.data[0].stockTotal).toBe(50)
    expect(res.body.data[0].lotes).toBeUndefined()
  })

  it('filtra por query q', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.producto.count.mockResolvedValue(1)
    mockPrisma.producto.findMany.mockResolvedValue([createMockProducto()])
    const res = await request.get(`${apiPrefix}/productos/buscar?q=acetaminofen`)
    expect(res.status).toBe(200)
  })

  it('filtra por categoría', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.producto.count.mockResolvedValue(1)
    mockPrisma.producto.findMany.mockResolvedValue([createMockProducto()])
    const res = await request.get(`${apiPrefix}/productos/buscar?categoria=analgesicos`)
    expect(res.status).toBe(200)
  })

  it('filtra por rx=true', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.producto.count.mockResolvedValue(1)
    mockPrisma.producto.findMany.mockResolvedValue([createMockProducto({ requiereRx: true })])
    const res = await request.get(`${apiPrefix}/productos/buscar?rx=true`)
    expect(res.status).toBe(200)
  })

  it('ordena por precio ascendente', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.producto.count.mockResolvedValue(2)
    mockPrisma.producto.findMany.mockResolvedValue([
      createMockProducto({ id: 'prod-1', nombre: 'A', precioVenta: 1000 }),
      createMockProducto({ id: 'prod-2', nombre: 'B', precioVenta: 2000 }),
    ])
    const res = await request.get(`${apiPrefix}/productos/buscar?ordenar=precio_asc`)
    expect(res.status).toBe(200)
  })

  it('retorna array vacío si no hay resultados', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.producto.count.mockResolvedValue(0)
    mockPrisma.producto.findMany.mockResolvedValue([])
    const res = await request.get(`${apiPrefix}/productos/buscar?q=zzzzz`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('maneja error interno', async () => {
    mockCache.get.mockResolvedValue(null)
    mockPrisma.producto.count.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/productos/buscar`)
    expect(res.status).toBe(500)
  })
})

describe('Productos Routes - GET /productos (admin)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.get(`${apiPrefix}/productos`)
    expect(res.status).toBe(401)
  })

  it('retorna lista administrativa con stockTotal y stockBajo', async () => {
    mockPrisma.producto.count.mockResolvedValue(1)
    mockPrisma.producto.findMany.mockResolvedValue([{
      ...createMockProducto(),
      stockMinimo: 10,
      lotes: [{ cantidadActual: 50, fechaVencimiento: new Date('2026-12-31'), codigoLote: 'LOT-001' }],
    }])
    const res = await request.get(`${apiPrefix}/productos`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data[0].stockTotal).toBe(50)
    expect(res.body.data[0].stockBajo).toBe(false)
    expect(res.body.data[0].proximoVencer).toBeDefined()
  })

  it('marca stockBajo=true cuando stock <= stockMinimo', async () => {
    mockPrisma.producto.count.mockResolvedValue(1)
    mockPrisma.producto.findMany.mockResolvedValue([{
      ...createMockProducto(),
      stockMinimo: 10,
      lotes: [{ cantidadActual: 3, fechaVencimiento: new Date('2026-12-31'), codigoLote: 'LOT-001' }],
    }])
    const res = await request.get(`${apiPrefix}/productos`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(res.body.data[0].stockBajo).toBe(true)
  })

  it('filtra por query q', async () => {
    mockPrisma.producto.count.mockResolvedValue(1)
    mockPrisma.producto.findMany.mockResolvedValue([createMockProducto()])
    const res = await request.get(`${apiPrefix}/productos?q=Acetaminofén`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
  })

  it('maneja error interno', async () => {
    mockPrisma.producto.count.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/productos`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(500)
  })
})

describe('Productos Routes - GET /productos/:id (público)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna producto con lotes disponibles', async () => {
    mockPrisma.producto.findUnique.mockResolvedValue({
      ...createMockProducto(),
      categoria: { id: 1, nombre: 'Analgésicos', slug: 'analgesicos', icono: '💊', descripcion: '', activa: true, orden: 0, creadoEn: new Date(), actualizadoEn: new Date() },
      lotes: [{ id: 'lote-1', cantidadActual: 50, fechaVencimiento: new Date('2026-12-31'), codigoLote: 'LOT-001', sucursal: { nombre: 'Principal' } }],
    })
    const res = await request.get(`${apiPrefix}/productos/prod-1`)
    expect(res.status).toBe(200)
    expect(res.body.data.nombre).toBe('Acetaminofén')
  })

  it('retorna 404 si producto no existe', async () => {
    mockPrisma.producto.findUnique.mockResolvedValue(null)
    const res = await request.get(`${apiPrefix}/productos/prod-999`)
    expect(res.status).toBe(404)
  })

  it('maneja error interno', async () => {
    mockPrisma.producto.findUnique.mockRejectedValue(new Error('DB error'))
    const res = await request.get(`${apiPrefix}/productos/prod-1`)
    expect(res.status).toBe(500)
  })
})

describe('Productos Routes - POST /productos (admin)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin autenticación', async () => {
    const res = await request.post(`${apiPrefix}/productos`).send({ nombre: 'Test' })
    expect(res.status).toBe(401)
  })

  it('crea producto exitosamente', async () => {
    mockPrisma.producto.create.mockResolvedValue(createMockProducto())
    const res = await request.post(`${apiPrefix}/productos`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Ibuprofeno', precioVenta: 5000, principioActivo: 'Ibuprofeno' })
    expect(res.status).toBe(201)
    expect(mockCache.delPattern).toHaveBeenCalledWith('productos:buscar:*')
  })

  it('maneja conflicto CUM duplicado (P2002)', async () => {
    mockPrisma.producto.create.mockRejectedValue({ code: 'P2002' })
    const res = await request.post(`${apiPrefix}/productos`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ nombre: 'Ibuprofeno', precioVenta: 5000 })
    expect(res.status).toBe(409)
  })
})

describe('Productos Routes - PATCH /productos/:id (admin)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('actualiza producto exitosamente', async () => {
    mockPrisma.producto.update.mockResolvedValue(createMockProducto({ precioVenta: 3000 }))
    const res = await request.patch(`${apiPrefix}/productos/prod-1`)
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ precioVenta: 3000 })
    expect(res.status).toBe(200)
    expect(mockCache.delPattern).toHaveBeenCalledWith('productos:buscar:*')
  })
})

describe('Productos Routes - DELETE /productos/:id (admin)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('desactiva producto exitosamente', async () => {
    mockPrisma.producto.update.mockResolvedValue(createMockProducto({ activo: false }))
    const res = await request.delete(`${apiPrefix}/productos/prod-1`)
      .set('Authorization', 'Bearer valid-admin-token')
    expect(res.status).toBe(200)
    expect(mockCache.delPattern).toHaveBeenCalledWith('productos:buscar:*')
  })

  it('rechaza con rol AUXILIAR', async () => {
    const res = await request.delete(`${apiPrefix}/productos/prod-1`)
      .set('Authorization', 'Bearer valid-auxiliar-token')
    expect(res.status).toBe(403)
  })
})
