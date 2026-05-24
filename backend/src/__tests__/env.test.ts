import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dotenv para evitar que cargue .env real
vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
  config: vi.fn(),
}))

// Establecer env vars base ANTES de que se evalúe cualquier módulo
vi.hoisted(() => {
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.JWT_SECRET = 'a'.repeat(32)
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
  process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
  delete process.env.API_PREFIX
})

const mockExit = vi.hoisted(() => vi.fn())

describe('env.ts', () => {
  beforeEach(() => {
    vi.resetModules()
    // Restaurar vars base limpiando lo que tests anteriores pudieron ensuciar
    process.env.NODE_ENV = 'test'
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.JWT_SECRET = 'a'.repeat(32)
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
    process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_SECRET
    delete process.env.GOOGLE_CALLBACK_URL
    delete process.env.API_PREFIX
    delete process.env.PORT
    delete process.env.FRONTEND_URL
    delete process.env.FARMACIA_NOMBRE
    delete process.env.LOG_LEVEL
  })

  it('exporta env con valores por defecto cuando faltan opcionales', async () => {
    // Asegurar que las requeridas están presentes
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.JWT_SECRET = 'a'.repeat(32)
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
    process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
    // Explicitly unset API_PREFIX so default is used
    delete process.env.API_PREFIX
    // Unset NODE_ENV so the default 'development' is used
    delete process.env.NODE_ENV

    const { env } = await import('../config/env')
    expect(env.NODE_ENV).toBe('development')
    expect(env.PORT).toBe('3000')
    expect(env.API_PREFIX).toBe('/api/v1')
    expect(env.LOG_LEVEL).toBe('debug')
    expect(env.FRONTEND_URL).toBe('http://localhost:5173')
    expect(env.RATE_LIMIT_WINDOW_MS).toBe('900000')
    expect(env.RATE_LIMIT_MAX).toBe('100')
    expect(env.JWT_EXPIRES_IN).toBe('8h')
    expect(env.JWT_CLIENTE_EXPIRES_IN).toBe('30d')
    expect(env.FARMACIA_NOMBRE).toBe('Farmacy')
    expect(env.HORARIO_INICIO).toBe('08:00')
    expect(env.HORARIO_FIN).toBe('18:00')
    expect(env.HORARIO_DIAS).toBe('1,2,3,4,5')
    expect(env.WOMPI_BASE_URL).toBe('https://sandbox.wompi.co/v1')
  })

  it('usa valores de process.env cuando están definidos', async () => {
    process.env.DATABASE_URL = 'postgresql://custom:custom@localhost:5432/custom'
    process.env.JWT_SECRET = 'd'.repeat(32)
    process.env.JWT_REFRESH_SECRET = 'e'.repeat(32)
    process.env.JWT_CLIENTE_SECRET = 'f'.repeat(32)
    process.env.NODE_ENV = 'production'
    process.env.PORT = '4000'
    process.env.API_PREFIX = '/api/v2'
    process.env.LOG_LEVEL = 'info'
    process.env.FARMACIA_NOMBRE = 'Mi Farmacia Test'
    process.env.FRONTEND_URL = 'https://mitienda.com'

    const { env } = await import('../config/env')
    expect(env.NODE_ENV).toBe('production')
    expect(env.PORT).toBe('4000')
    expect(env.API_PREFIX).toBe('/api/v2')
    expect(env.LOG_LEVEL).toBe('info')
    expect(env.FARMACIA_NOMBRE).toBe('Mi Farmacia Test')
    expect(env.FRONTEND_URL).toBe('https://mitienda.com')
  })

  it('valida NODE_ENV solo acepta valores permitidos', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.JWT_SECRET = 'a'.repeat(32)
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
    process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
    process.env.NODE_ENV = 'invalid'
    delete process.env.API_PREFIX

    vi.spyOn(process, 'exit').mockImplementation(mockExit)

    await import('../config/env')

    expect(mockExit).toHaveBeenCalledWith(1)
  })

  it('valida que JWT_SECRET tenga al menos 32 caracteres', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.JWT_SECRET = 'short'
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
    process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
    delete process.env.API_PREFIX

    vi.spyOn(process, 'exit').mockImplementation(mockExit)

    await import('../config/env')

    expect(mockExit).toHaveBeenCalledWith(1)
  })

  it('valida que DATABASE_URL sea requerida', async () => {
    process.env.JWT_SECRET = 'a'.repeat(32)
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
    process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
    delete process.env.DATABASE_URL
    delete process.env.API_PREFIX

    vi.spyOn(process, 'exit').mockImplementation(mockExit)

    await import('../config/env')

    expect(mockExit).toHaveBeenCalledWith(1)
  })

  it('tiene el tipo Env exportado', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.JWT_SECRET = 'a'.repeat(32)
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
    process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
    delete process.env.API_PREFIX

    const mod = await import('../config/env')
    expect(mod.env).toBeDefined()
    // Verificar que las claves esperadas existen
    expect(mod.env).toHaveProperty('NODE_ENV')
    expect(mod.env).toHaveProperty('PORT')
    expect(mod.env).toHaveProperty('DATABASE_URL')
    expect(mod.env).toHaveProperty('JWT_SECRET')
    expect(mod.env).toHaveProperty('REDIS_URL')
  })
})
