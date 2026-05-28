import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@prisma/client': path.resolve(__dirname, './node_modules/@prisma/client'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/types/**',
      ],
      reportsDirectory: './coverage',
    },
  },
})
