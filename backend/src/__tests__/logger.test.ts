import { describe, it, expect, vi } from 'vitest'

// ═══════════════════════════════════════════════════════════
//  Hoisted: env vars ANTES de importar cualquier módulo
// ═══════════════════════════════════════════════════════════
vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.JWT_SECRET = 'a'.repeat(32)
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
  process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
  process.env.NODE_ENV = 'development'
  process.env.LOG_LEVEL = 'debug'
})

// ── Mock dotenv para evitar que cargue .env real ──────────
vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
  config: vi.fn(),
}))

// ── Mock winston ─────────────────────────────────────────
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}))

const mockCreateLogger = vi.hoisted(() => vi.fn().mockReturnValue(mockLogger))

vi.mock('winston', () => {
  const mockFormat = {
    combine: vi.fn(),
    timestamp: vi.fn().mockReturnValue('timestamp-mock' as any),
    colorize: vi.fn().mockReturnValue('colorize-mock' as any),
    printf: vi.fn().mockReturnValue('printf-mock' as any),
    json: vi.fn().mockReturnValue('json-mock' as any),
  }

  return {
    default: {
      createLogger: mockCreateLogger,
      format: mockFormat,
      transports: { Console: vi.fn() },
    },
    format: mockFormat,
    transports: { Console: vi.fn() },
    createLogger: mockCreateLogger,
  }
})

import { logger } from '../utils/logger'

describe('logger', () => {
  it('se crea con createLogger de winston usando LOG_LEVEL', () => {
    expect(mockCreateLogger).toHaveBeenCalledTimes(1)
    expect(mockCreateLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
        transports: expect.arrayContaining([expect.anything()]),
      })
    )
  })

  it('logger.info funciona', () => {
    logger.info('test info')
    expect(mockLogger.info).toHaveBeenCalledWith('test info')
  })

  it('logger.error funciona', () => {
    logger.error('test error')
    expect(mockLogger.error).toHaveBeenCalledWith('test error')
  })

  it('logger.warn funciona', () => {
    logger.warn('test warn')
    expect(mockLogger.warn).toHaveBeenCalledWith('test warn')
  })

  it('logger.debug funciona', () => {
    logger.debug('test debug')
    expect(mockLogger.debug).toHaveBeenCalledWith('test debug')
  })
})
