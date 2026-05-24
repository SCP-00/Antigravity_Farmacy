import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrismaClient = vi.hoisted(() => ({
  $connect: vi.fn(),
  $disconnect: vi.fn(),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient),
}))

describe('database', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exporta prisma como singleton', async () => {
    // Ensure env is valid
    vi.hoisted(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.JWT_SECRET = 'a'.repeat(32)
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
      process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
    })

    const { prisma } = await import('../config/database')
    expect(prisma).toBeDefined()
  })

  it('connectDB llama a $connect', async () => {
    vi.hoisted(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.JWT_SECRET = 'a'.repeat(32)
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
      process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
    })

    mockPrismaClient.$connect.mockResolvedValue(undefined)
    const { connectDB } = await import('../config/database')
    await connectDB()
    expect(mockPrismaClient.$connect).toHaveBeenCalled()
  })

  it('connectDB hace exit si falla la conexión', async () => {
    vi.hoisted(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.JWT_SECRET = 'a'.repeat(32)
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
      process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
    })

    mockPrismaClient.$connect.mockRejectedValue(new Error('Connection failed'))
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    const { connectDB } = await import('../config/database')
    await connectDB()
    expect(mockExit).toHaveBeenCalledWith(1)
    mockExit.mockRestore()
  })

  it('disconnectDB llama a $disconnect', async () => {
    vi.hoisted(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.JWT_SECRET = 'a'.repeat(32)
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32)
      process.env.JWT_CLIENTE_SECRET = 'c'.repeat(32)
    })

    mockPrismaClient.$disconnect.mockResolvedValue(undefined)
    const { disconnectDB } = await import('../config/database')
    await disconnectDB()
    expect(mockPrismaClient.$disconnect).toHaveBeenCalled()
  })
})
