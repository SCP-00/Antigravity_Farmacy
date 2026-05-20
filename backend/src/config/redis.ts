import Redis from 'ioredis'
import { env } from './env'
import { logger } from '../utils/logger'

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
})

redis.on('connect', () => logger.info('✅ [Redis] Conectado'))
redis.on('error', (err) => logger.warn(`⚠️  [Redis] ${err.message} — continuando sin caché`))

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect()
  } catch {
    logger.warn('⚠️  [Redis] No disponible — la app funciona sin caché')
  }
}

// Helpers tipados
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await redis.get(key)
      return val ? JSON.parse(val) : null
    } catch { return null }
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch { /* silencioso */ }
  },

  async del(key: string): Promise<void> {
    try { await redis.del(key) } catch { /* silencioso */ }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) await redis.del(...keys)
    } catch { /* silencioso */ }
  },
}