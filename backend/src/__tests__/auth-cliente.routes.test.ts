import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.JWT_SECRET = 'test-secret-for-jwt'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
  process.env.NODE_ENV = 'test'
  process.env.API_PREFIX = '/api/v1'
  process.env.FRONTEND_URL = 'http://localhost:5173'
  process.env.SOPORTE_EMAIL = 'soporte@farmacy.co'
  process.env.REDIS_URL = 'redis://localhost:6379'
})

vi.mock('dotenv', () => ({ default: { config: vi.fn() }, config: vi.fn() }))

const mockBcrypt = vi.hoisted(() => ({ hash: vi.fn(), compare: vi.fn() }))
vi.mock('bcryptjs', () => mockBcrypt)

const mockPrisma = vi.hoisted(() => ({
  cliente: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  venta: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  favorito: {
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
  },
}))

const mockCache = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}))

const mockSendEmail = vi.hoisted(() => vi.fn())
vi.mock('../config/database', () => ({ prisma: mockPrisma }))
vi.mock('../config/redis', () => ({ cache: mockCache }))
vi.mock('../config/mailer', () => ({ sendEmail: mockSendEmail, emailTemplates: { verificarEmail: vi.fn(() => '<html/>'), resetPassword: vi.fn(() => '<html/>') } }))

// Mock passport
vi.mock('passport', () => ({
  default: { authenticate: vi.fn(() => (req: any, res: any, next: any) => next()) },
  authenticate: vi.fn(() => (req: any, res: any, next: any) => next()),
}))

import supertest from 'supertest'
import { app } from '../app'

const request = supertest(app)
const apiPrefix = '/api/v1'

describe('Auth Cliente - POST /clientes/auth/registro', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza nombre muy corto', async () => {
    const res = await request.post(`${apiPrefix}/clientes/auth/registro`).send({
      nombre: 'A', apellido: 'Pérez', email: 'test@test.com',
      password: 'Password1!', autorizacionDatos: true,
    })
    expect(res.status).toBe(400)
  })

  it('rechaza password sin número', async () => {
    const res = await request.post(`${apiPrefix}/clientes/auth/registro`).send({
      nombre: 'Juan', apellido: 'Pérez', email: 'test@test.com',
      password: 'Password!', autorizacionDatos: true,
    })
    expect(res.status).toBe(400)
  })

  it('rechaza password sin especial', async () => {
    const res = await request.post(`${apiPrefix}/clientes/auth/registro`).send({
      nombre: 'Juan', apellido: 'Pérez', email: 'test@test.com',
      password: 'Password1', autorizacionDatos: true,
    })
    expect(res.status).toBe(400)
  })

  it('rechaza autorizacionDatos false', async () => {
    const res = await request.post(`${apiPrefix}/clientes/auth/registro`).send({
      nombre: 'Juan', apellido: 'Pérez', email: 'test@test.com',
      password: 'Password1!', autorizacionDatos: false,
    })
    expect(res.status).toBe(400)
  })

  it('rechaza email duplicado con 409', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue({ id: 'existing' })
    const res = await request.post(`${apiPrefix}/clientes/auth/registro`).send({
      nombre: 'Juan', apellido: 'Pérez', email: 'existente@test.com',
      password: 'Password1!', autorizacionDatos: true,
    })
    expect(res.status).toBe(409)
  })

  it('registra cliente exitosamente', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(null)
    mockBcrypt.hash.mockResolvedValue('$2a$12$hash')
    mockPrisma.cliente.create.mockResolvedValue({ id: 'cli-1', nombre: 'Juan', email: 'juan@test.com' })
    const res = await request.post(`${apiPrefix}/clientes/auth/registro`).send({
      nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com',
      password: 'Password1!', autorizacionDatos: true,
    })
    expect(res.status).toBe(201)
    expect(mockSendEmail).toHaveBeenCalled()
  })

  it('maneja error interno', async () => {
    mockPrisma.cliente.findUnique.mockRejectedValue(new Error('DB error'))
    const res = await request.post(`${apiPrefix}/clientes/auth/registro`).send({
      nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com',
      password: 'Password1!', autorizacionDatos: true,
    })
    expect(res.status).toBe(500)
  })
})

describe('Auth Cliente - POST /clientes/auth/login', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza email inválido', async () => {
    const res = await request.post(`${apiPrefix}/clientes/auth/login`).send({
      email: 'invalido', password: '12345678',
    })
    expect(res.status).toBe(400)
  })

  it('rechaza credenciales inválidas', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(null)
    const res = await request.post(`${apiPrefix}/clientes/auth/login`).send({
      email: 'no@existe.com', password: 'Password1!',
    })
    expect(res.status).toBe(401)
  })

  it('rechaza email no verificado', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue({
      id: '1', activo: true, password: '$2a$12$hash', emailVerificado: false,
    })
    const res = await request.post(`${apiPrefix}/clientes/auth/login`).send({
      email: 'no-verificado@test.com', password: 'Password1!',
    })
    expect(res.status).toBe(403)
  })

  it('login exitoso retorna token y cliente', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue({
      id: 'cli-1', activo: true, password: '$2a$12$hash',
      emailVerificado: true, nombre: 'Juan', apellido: 'Pérez',
      email: 'juan@test.com', puntosAcumulados: 100,
    })
    mockBcrypt.compare.mockResolvedValue(true)
    const res = await request.post(`${apiPrefix}/clientes/auth/login`).send({
      email: 'juan@test.com', password: 'Password1!',
    })
    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.cliente.email).toBe('juan@test.com')
    expect(res.body.data.cliente.puntos).toBe(100)
  })

  it('maneja error interno', async () => {
    mockPrisma.cliente.findUnique.mockRejectedValue(new Error('DB error'))
    const res = await request.post(`${apiPrefix}/clientes/auth/login`).send({
      email: 'juan@test.com', password: 'Password1!',
    })
    expect(res.status).toBe(500)
  })
})

describe('Auth Cliente - POST /clientes/auth/verificar-email', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin token', async () => {
    const res = await request.post(`${apiPrefix}/clientes/auth/verificar-email`).send({})
    expect(res.status).toBe(400)
  })

  it('rechaza token inválido', async () => {
    mockPrisma.cliente.findFirst.mockResolvedValue(null)
    const res = await request.post(`${apiPrefix}/clientes/auth/verificar-email`).send({ token: 'invalid' })
    expect(res.status).toBe(400)
  })

  it('verifica email exitosamente', async () => {
    mockPrisma.cliente.findFirst.mockResolvedValue({ id: 'cli-1' })
    mockPrisma.cliente.update.mockResolvedValue({})
    const res = await request.post(`${apiPrefix}/clientes/auth/verificar-email`).send({ token: 'valid-token' })
    expect(res.status).toBe(200)
  })
})

describe('Auth Cliente - POST /clientes/auth/recuperar-password', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin email', async () => {
    const res = await request.post(`${apiPrefix}/clientes/auth/recuperar-password`).send({})
    expect(res.status).toBe(400)
  })

  it('responde igual si email no existe (no revela info)', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(null)
    const res = await request.post(`${apiPrefix}/clientes/auth/recuperar-password`).send({ email: 'no@existe.com' })
    expect(res.status).toBe(200)
  })

  it('envía correo si email existe', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue({ id: 'cli-1', nombre: 'Juan' })
    mockPrisma.cliente.update.mockResolvedValue({})
    const res = await request.post(`${apiPrefix}/clientes/auth/recuperar-password`).send({ email: 'juan@test.com' })
    expect(res.status).toBe(200)
    expect(mockSendEmail).toHaveBeenCalled()
  })
})

describe('Auth Cliente - POST /clientes/auth/reset-password', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin token y password', async () => {
    const res = await request.post(`${apiPrefix}/clientes/auth/reset-password`).send({})
    expect(res.status).toBe(400)
  })

  it('rechaza token inválido o expirado', async () => {
    mockPrisma.cliente.findFirst.mockResolvedValue(null)
    const res = await request.post(`${apiPrefix}/clientes/auth/reset-password`).send({ token: 'invalid', password: 'NewPass1!' })
    expect(res.status).toBe(400)
  })

  it('resetea password exitosamente', async () => {
    mockPrisma.cliente.findFirst.mockResolvedValue({ id: 'cli-1' })
    mockBcrypt.hash.mockResolvedValue('$2a$12$newhash')
    mockPrisma.cliente.update.mockResolvedValue({})
    const res = await request.post(`${apiPrefix}/clientes/auth/reset-password`).send({ token: 'valid', password: 'NewPass1!' })
    expect(res.status).toBe(200)
  })
})

describe('Auth Cliente - GET /clientes/auth/me', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin token', async () => {
    const res = await request.get(`${apiPrefix}/clientes/auth/me`)
    expect(res.status).toBe(401)
  })

  it('retorna perfil del cliente', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue({
      id: 'cli-1', nombre: 'Juan', apellido: 'Pérez',
      email: 'juan@test.com', telefono: '555-0000',
      ciudad: 'Bogotá', puntosAcumulados: 100,
      puntosExpiranEn: null, creadoEn: new Date(),
    })
    const res = await request.get(`${apiPrefix}/clientes/auth/me`)
      .set('Authorization', 'Bearer valid-client-token')
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe('juan@test.com')
  })

  it('retorna 404 si cliente no existe', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(null)
    const res = await request.get(`${apiPrefix}/clientes/auth/me`)
      .set('Authorization', 'Bearer valid-client-token')
    expect(res.status).toBe(404)
  })
})

describe('Auth Cliente - GET /clientes/auth/pedidos', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin token', async () => {
    const res = await request.get(`${apiPrefix}/clientes/auth/pedidos`)
    expect(res.status).toBe(401)
  })

  it('retorna lista de pedidos', async () => {
    mockPrisma.venta.findMany.mockResolvedValue([{ id: 'v-1', numero: 'V-001', total: 50000, estado: 'PAGADO', creadoEn: new Date(), detalles: [{ producto: { nombre: 'Acetaminofén' }, id: 'det-1', cantidad: 2, precioUnitario: 2500, subtotal: 5000, loteId: null, productoId: 'p-1', ventaId: 'v-1' }] }])
    const res = await request.get(`${apiPrefix}/clientes/auth/pedidos`)
      .set('Authorization', 'Bearer valid-client-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })
})

describe('Auth Cliente - POST /clientes/auth/favoritos', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin productoId', async () => {
    const res = await request.post(`${apiPrefix}/clientes/auth/favoritos`)
      .set('Authorization', 'Bearer valid-client-token').send({})
    expect(res.status).toBe(400)
  })

  it('agrega a favoritos si no existe', async () => {
    mockPrisma.favorito.findFirst.mockResolvedValue(null)
    mockPrisma.favorito.create.mockResolvedValue({ id: 'fav-1', productoId: 'prod-1', clienteId: 'cli-1' })
    const res = await request.post(`${apiPrefix}/clientes/auth/favoritos`)
      .set('Authorization', 'Bearer valid-client-token')
      .send({ productoId: 'prod-1' })
    expect(res.status).toBe(201)
  })

  it('elimina de favoritos si ya existe', async () => {
    mockPrisma.favorito.findFirst.mockResolvedValue({ id: 'fav-1' })
    mockPrisma.favorito.delete.mockResolvedValue({})
    const res = await request.post(`${apiPrefix}/clientes/auth/favoritos`)
      .set('Authorization', 'Bearer valid-client-token')
      .send({ productoId: 'prod-1' })
    expect(res.status).toBe(200)
  })
})

describe('Auth Cliente - POST /clientes/auth/logout', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin token', async () => {
    const res = await request.post(`${apiPrefix}/clientes/auth/logout`)
    expect(res.status).toBe(401)
  })

  it('cierra sesión exitosamente', async () => {
    const res = await request.post(`${apiPrefix}/clientes/auth/logout`)
      .set('Authorization', 'Bearer valid-client-token')
    expect(res.status).toBe(200)
  })
})

describe('Auth Cliente Perfil - GET /clientes/perfil/me', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza sin token', async () => {
    const res = await request.get(`${apiPrefix}/clientes/perfil/me`)
    expect(res.status).toBe(401)
  })

  it('retorna perfil', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue({ id: 'cli-1', nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com', telefono: null, ciudad: null, puntosAcumulados: 0, puntosExpiranEn: null, creadoEn: new Date() })
    const res = await request.get(`${apiPrefix}/clientes/perfil/me`)
      .set('Authorization', 'Bearer valid-client-token')
    expect(res.status).toBe(200)
  })
})

describe('Auth Cliente Perfil - PATCH /clientes/perfil/me', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('actualiza perfil', async () => {
    mockPrisma.cliente.update.mockResolvedValue({ id: 'cli-1', nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com', telefono: '555-1234', ciudad: 'Bogotá' })
    const res = await request.patch(`${apiPrefix}/clientes/perfil/me`)
      .set('Authorization', 'Bearer valid-client-token')
      .send({ telefono: '555-1234', ciudad: 'Bogotá' })
    expect(res.status).toBe(200)
  })
})

describe('Auth Cliente Perfil - GET /clientes/perfil/favoritos', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna favoritos', async () => {
    mockPrisma.favorito.findMany.mockResolvedValue([{ id: 'fav-1', productoId: 'prod-1', creadoEn: new Date(), producto: { id: 'prod-1', nombre: 'Acetaminofén', slug: 'acetaminofen', imagenUrl: null, precioVenta: 2500 } }])
    const res = await request.get(`${apiPrefix}/clientes/perfil/favoritos`)
      .set('Authorization', 'Bearer valid-client-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })
})
