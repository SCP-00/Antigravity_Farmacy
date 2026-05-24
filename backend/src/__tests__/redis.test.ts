import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock ioredis ─────────────────────────────────────────
const mockRedis = vi.hoisted(() => ({
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  on: vi.fn(),
  connect: vi.fn(),
}))

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => mockRedis),
}))

vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

describe('redis config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('crea una instancia de Redis', async () => {
    const { redis } = await import('../config/redis')
    expect(redis).toBeDefined()
    expect(mockRedis.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function))
  })
})

describe('connectRedis()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('conecta exitosamente', async () => {
    mockRedis.connect.mockResolvedValue(undefined)
    const { connectRedis } = await import('../config/redis')
    await connectRedis()
    expect(mockRedis.connect).toHaveBeenCalled()
  })

  it('no lanza error si falla la conexión', async () => {
    mockRedis.connect.mockRejectedValue(new Error('Connection refused'))
    const { connectRedis } = await import('../config/redis')
    await connectRedis() // no debe lanzar
    expect(mockRedis.connect).toHaveBeenCalled()
  })
})

describe('cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('cache.get retorna valor parseado', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ id: 1, name: 'test' }))
    const { cache } = await import('../config/redis')
    const result = await cache.get<{ id: number; name: string }>('test-key')
    expect(result).toEqual({ id: 1, name: 'test' })
    expect(mockRedis.get).toHaveBeenCalledWith('test-key')
  })

  it('cache.get retorna null si no existe', async () => {
    mockRedis.get.mockResolvedValue(null)
    const { cache } = await import('../config/redis')
    const result = await cache.get('missing-key')
    expect(result).toBeNull()
  })

  it('cache.get retorna null si hay error', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis error'))
    const { cache } = await import('../config/redis')
    const result = await cache.get('error-key')
    expect(result).toBeNull()
  })

  it('cache.set guarda con TTL por defecto', async () => {
    mockRedis.setex.mockResolvedValue('OK')
    const { cache } = await import('../config/redis')
    await cache.set('my-key', { foo: 'bar' })
    expect(mockRedis.setex).toHaveBeenCalledWith('my-key', 300, JSON.stringify({ foo: 'bar' }))
  })

  it('cache.set usa TTL personalizado', async () => {
    mockRedis.setex.mockResolvedValue('OK')
    const { cache } = await import('../config/redis')
    await cache.set('my-key', 'data', 60)
    expect(mockRedis.setex).toHaveBeenCalledWith('my-key', 60, expect.any(String))
  })

  it('cache.set no lanza error si falla', async () => {
    mockRedis.setex.mockRejectedValue(new Error('Write error'))
    const { cache } = await import('../config/redis')
    await cache.set('my-key', 'data') // no debe lanzar
  })

  it('cache.del elimina clave', async () => {
    mockRedis.del.mockResolvedValue(1)
    const { cache } = await import('../config/redis')
    await cache.del('my-key')
    expect(mockRedis.del).toHaveBeenCalledWith('my-key')
  })

  it('cache.del no lanza error si falla', async () => {
    mockRedis.del.mockRejectedValue(new Error('Del error'))
    const { cache } = await import('../config/redis')
    await cache.del('my-key') // no debe lanzar
  })

  it('cache.delPattern elimina por patrón', async () => {
    mockRedis.keys.mockResolvedValue(['key:1', 'key:2'])
    mockRedis.del.mockResolvedValue(2)
    const { cache } = await import('../config/redis')
    await cache.delPattern('key:*')
    expect(mockRedis.keys).toHaveBeenCalledWith('key:*')
    expect(mockRedis.del).toHaveBeenCalledWith('key:1', 'key:2')
  })

  it('cache.delPattern no lanza error si falla keys', async () => {
    mockRedis.keys.mockRejectedValue(new Error('Keys error'))
    const { cache } = await import('../config/redis')
    await cache.delPattern('key:*') // no debe lanzar
  })

  it('cache.delPattern no llama del si no hay keys', async () => {
    mockRedis.keys.mockResolvedValue([])
    const { cache } = await import('../config/redis')
    await cache.delPattern('key:*')
    expect(mockRedis.del).not.toHaveBeenCalled()
  })
})
