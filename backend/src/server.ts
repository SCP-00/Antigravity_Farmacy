// ══════════════════════════════════════════════════════════
//  server.ts — Punto de entrada del backend
//  Conecta BD ANTES de aceptar peticiones HTTP
// ══════════════════════════════════════════════════════════
import { createApp } from './app'
import { env } from './config/env'
import { connectDB, disconnectDB } from './config/database'

async function main() {
  // 1. Verificar conexión a PostgreSQL
  await connectDB()

  // 2. Crear Express con todos los middlewares y rutas
  const app = createApp()

  // 3. Levantar servidor HTTP
  const server = app.listen(Number(env.PORT), () => {
    console.log(`\n🚀 FARMACY backend → http://localhost:${env.PORT}${env.API_PREFIX}`)
    console.log(`   Entorno  : ${env.NODE_ENV}`)
    console.log(`   Farmacia : ${env.FARMACIA_NOMBRE}\n`)
  })

  // 4. Cierre limpio (Ctrl+C, Docker stop)
  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Cerrando servidor...`)
    server.close(async () => {
      await disconnectDB()
      console.log('Servidor cerrado correctamente.')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
}

main().catch(err => {
  console.error('❌ Error fatal al iniciar:', err)
  process.exit(1)
})
