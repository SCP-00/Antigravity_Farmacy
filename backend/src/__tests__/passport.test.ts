import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────
const mockPassportUse = vi.hoisted(() => vi.fn())

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
    constructor(opts: any, verify: any) {}
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
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/v1/auth/google/callback'

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
})
