/**
 * Post-generate script for Prisma Client
 *
 * pnpm stores @prisma/client in a versioned directory inside the pnpm store.
 * The generated .prisma/client output lives at:
 *   node_modules/.pnpm/@prisma+client@<version>_prisma@<version>/node_modules/.prisma/client
 *
 * Our tsconfig maps @prisma/client to ./node_modules/.prisma/client, so we
 * need to copy the generated output to that location after each prisma generate.
 *
 * Usa fs.cpSync (Node 16.7+) — sin PowerShell, más portable.
 */

const path = require('path')
const fs = require('fs')

const backendDir = path.resolve(__dirname, '..')
const projectRoot = path.resolve(__dirname, '..', '..')

const pnpmDir = path.join(projectRoot, 'node_modules', '.pnpm')

function findPrismaClient() {
  const entries = fs.readdirSync(pnpmDir)
  const clientDir = entries.find(d => d.startsWith('@prisma+client@'))
  if (!clientDir) return null
  return path.join(pnpmDir, clientDir, 'node_modules', '.prisma', 'client')
}

try {
  const src = findPrismaClient()
  if (!src) {
    console.error('[prisma-postgenerate] ❌ No se encontró @prisma+client@* en el pnpm store')
    process.exit(1)
  }

  const dest = path.join(backendDir, 'node_modules', '.prisma', 'client')

  // Limpiar destino si existe
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true })
  }

  // Copiar recursivamente
  fs.cpSync(src, dest, { recursive: true, force: true })

  // Verificar copia
  const indexFile = path.join(dest, 'index.d.ts')
  if (!fs.existsSync(indexFile)) {
    console.error('[prisma-postgenerate] ❌ La copia falló — index.d.ts no encontrado en destino')
    process.exit(1)
  }

  const lineCount = fs.readFileSync(indexFile, 'utf-8').split('\n').length
  console.log(`[prisma-postgenerate] ✅ Prisma Client copiado a backend/node_modules/.prisma/client (${lineCount} líneas en index.d.ts)`)
} catch (err) {
  console.error('[prisma-postgenerate] ❌ Error:', err.message)
  process.exit(1)
}
