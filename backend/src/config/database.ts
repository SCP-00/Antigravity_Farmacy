import { PrismaClient } from '@prisma/client'
import { env } from './env'

// Patrón singleton — una sola instancia de Prisma en toda la app
// Evita "too many connections" en desarrollo con hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  })

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Verifica la conexión al iniciar
export async function connectDB(): Promise<void> {
  try {
    await prisma.$connect()
    console.log('✅ [DB] Conectado a PostgreSQL via Prisma')
  } catch (error) {
    console.error('❌ [DB] Error al conectar a PostgreSQL:', error)
    process.exit(1)
  }
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect()
  console.log('🔌 [DB] Desconectado de PostgreSQL')
}