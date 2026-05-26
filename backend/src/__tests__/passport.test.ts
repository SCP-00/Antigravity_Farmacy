import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────
const mockPassportUse = vi.hoisted(() => vi.fn())

// Capturar el callback verify de GoogleStrategy para probarlo directamente
let capturedVerifyCallback: any = null

vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
  config: vi.fn(),
}))

vi.mock('passport', () => ({
  default: { use: mockPassportUse },
  use: mockPassportUse,
}))

vi.mock('passport-google-oauth20', () => {
  class MockGoogleStrategy {
    name = 'google'
    constructor(opts: any, verify: any) {
      capturedVerifyCallback = verify
    }
  }
  return {
    Strategy: MockGoogleStrategy,
    default: { Strategy: MockGoogleStrategy },
  }
})

vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock database to avoid PrismaClient instantiation issues
vi.mock('../config/database', () => ({
  prisma: {
    cliente: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Set env vars before ANY imports (including env.ts which loads at module level)
vi.hoisted(() => {
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.JWT_SECRET = 'a'.repeat(32)
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
  process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
  process.env.API_PREFIX = '/api/v1'
})

describe('configurePassport()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('configura Google OAuth cuando hay credenciales', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/v1/clientes/auth/google/callback'

    const { configurePassport } = await import('../config/passport')
    configurePassport()

    const passport = await import('passport')
    expect(passport.use).toHaveBeenCalledTimes(1)
  })

  it('omite Google OAuth si no hay GOOGLE_CLIENT_ID', async () => {
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_SECRET
    delete process.env.GOOGLE_CALLBACK_URL

    const { configurePassport } = await import('../config/passport')
    configurePassport()

    const passport = await import('passport')
    expect(passport.use).not.toHaveBeenCalled()
  })

  it('loggea warning si Google OAuth no está configurado', async () => {
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_SECRET
    delete process.env.GOOGLE_CALLBACK_URL

    const { configurePassport } = await import('../config/passport')
    configurePassport()

    const { logger } = await import('../utils/logger')
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Google OAuth no configurado')
    )
  })

  it('verify callback: crea cliente nuevo si no existe', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/v1/clientes/auth/google/callback'

    const { configurePassport } = await import('../config/passport')
    configurePassport()

    expect(capturedVerifyCallback).not.toBeNull()

    const db = await import('../config/database')
    vi.mocked(db.prisma.cliente.findUnique).mockResolvedValue(null)
    vi.mocked(db.prisma.cliente.create).mockResolvedValue({
      id: 'new-cli-1', nombre: 'Juan', apellido: 'Google', email: 'juan@gmail.com',
      puntosAcumulados: 0, emailVerificado: true, autorizacionDatos: true,
      activo: true, creadoEn: new Date(),
    } as any)

    // Simular callback de Google
    const done = vi.fn()
    await capturedVerifyCallback(
      'access-token',
      'refresh-token',
      {
        id: 'google-id-123',
        name: { givenName: 'Juan', familyName: 'Pérez' },
        emails: [{ value: 'juan@gmail.com' }],
      },
      done
    )

    expect(db.prisma.cliente.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'juan@gmail.com',
          proveedorAuth: 'GOOGLE',
          proveedorAuthId: 'google-id-123',
        }),
      })
    )
    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({ id: 'new-cli-1' }))
  })

  it('verify callback: retorna cliente existente', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/v1/clientes/auth/google/callback'

    const { configurePassport } = await import('../config/passport')
    configurePassport()

    const db = await import('../config/database')
    vi.mocked(db.prisma.cliente.findUnique).mockResolvedValue({
      id: 'existente-cli', nombre: 'Juan', apellido: 'Pérez', email: 'juan@gmail.com',
      puntosAcumulados: 50, emailVerificado: true, autorizacionDatos: true,
      activo: true, creadoEn: new Date('2024-01-01'),
    } as any)

    const done = vi.fn()
    await capturedVerifyCallback(
      'access-token',
      'refresh-token',
      {
        id: 'google-id-123',
        name: { givenName: 'Juan', familyName: 'Pérez' },
        emails: [{ value: 'juan@gmail.com' }],
      },
      done
    )

    expect(db.prisma.cliente.create).not.toHaveBeenCalled()
    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({ id: 'existente-cli' }))
  })

  it('verify callback: error si no hay email de Google', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/v1/clientes/auth/google/callback'

    const { configurePassport } = await import('../config/passport')
    configurePassport()

    const done = vi.fn()
    await capturedVerifyCallback(
      'access-token',
      'refresh-token',
      {
        id: 'google-id-no-email',
        name: { givenName: 'No', familyName: 'Email' },
        emails: [],
      },
      done
    )

    expect(done).toHaveBeenCalledWith(expect.any(Error))
  })

  it('verify callback: maneja error de base de datos', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/v1/clientes/auth/google/callback'

    const { configurePassport } = await import('../config/passport')
    configurePassport()

    const db = await import('../config/database')
    vi.mocked(db.prisma.cliente.findUnique).mockRejectedValue(new Error('DB connection error'))

    const done = vi.fn()
    await capturedVerifyCallback(
      'access-token',
      'refresh-token',
      {
        id: 'google-id-db',
        name: { givenName: 'Test', familyName: 'User' },
        emails: [{ value: 'test@gmail.com' }],
      },
      done
    )

    expect(done).toHaveBeenCalledWith(expect.any(Error))
  })
})
