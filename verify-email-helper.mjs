/**
 * ═══════════════════════════════════════════════════════════
 *  Helper: Verificar email de cliente vía DB + API
 * ═══════════════════════════════════════════════════════════
 *
 *  Uso: node verify-email-helper.mjs <email>
 *
 *  1. Busca el cliente en PostgreSQL por email
 *  2. Obtiene el tokenVerificacion
 *  3. Llama al endpoint POST /clientes/auth/verificar-email
 * ═══════════════════════════════════════════════════════════
 */

const API_URL = 'http://localhost:3000/api/v1'
const DB_USER = 'farmacy_user'
const DB_PASS = 'farmacy_pass'
const DB_NAME = 'farmacy_db'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Uso: node verify-email-helper.mjs <email>')
    process.exit(1)
  }

  console.log(`🔍 Buscando cliente: ${email}`)

  // 1. Obtener token de verificación desde PostgreSQL via Docker
  const { execSync } = await import('child_process')

  try {
    // Usar psql via Docker
    const sanitizedEmail = email.replace(/'/g, "''")
    const result = execSync(
      `docker exec farmacy_postgres_dev psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT token_verificacion FROM clientes WHERE email='${sanitizedEmail}' AND token_verificacion IS NOT NULL LIMIT 1;"`,
      { encoding: 'utf8', timeout: 10000 }
    )

    const token = result.trim()
    if (!token) {
      console.error('❌ No se encontró token de verificación para', email)
      console.error('   Posibles causas: email ya verificado, cliente no existe, o DB no accesible')
      process.exit(1)
    }

    console.log(`✅ Token obtenido: ${token.substring(0, 20)}...`)

    // 2. Llamar al endpoint de verificación
    const res = await fetch(`${API_URL}/clientes/auth/verificar-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    const data = await res.json()
    if (res.ok) {
      console.log('✅ Email verificado exitosamente!')
      process.exit(0)
    } else {
      console.error(`❌ Error al verificar email: ${data.error || res.status}`)
      process.exit(1)
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
    console.error('   Asegúrate de que el contenedor Docker esté corriendo:')
    console.error('   docker ps | grep farmacy_postgres')
    process.exit(1)
  }
}

main()
