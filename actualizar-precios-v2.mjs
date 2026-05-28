/**
 * ═══════════════════════════════════════════════════════════
 *  Actualizar precios v2 — genera SQL y ejecuta via Docker
 * ═══════════════════════════════════════════════════════════
 *
 *  Ejecutar: node actualizar-precios-v2.mjs
 * ═══════════════════════════════════════════════════════════
 */

const fs = await import('fs')
const { execSync } = await import('child_process')

const DB_USER = 'farmacy_user'
const DB_NAME = 'farmacy_db'

const MAPA_PRECIOS = [
  ['ACIDO FOLICO', 2143, 1000],
  ['AGUA ESTÉRIL', 8469, 4200],
  ['AMBROXOL', 8773, 4300],
  ['AZITROMICINA 500MG', 5000, 2500],
  ['AZITROMICINA MK 200 MG', 25000, 13000],
  ['B-CORT', 50000, 25000],
  ['BIODERM', 17060, 8500],
  ['BROMURO DE PANCURONIO', 31540, 16000],
  ['CEBION', 5000, 2500],
  ['CLINDAMICINA CAPSULAS 300 MG', 7000, 3500],
  ['CONDILOM', 22500, 11200],
  ['CYCLOFEM', 21600, 10800],
  ['DESFERAL', 28710, 14000],
  ['DIANEAL', 8191, 4000],
  ['DUO-DECADRON', 23865, 12000],
  ['E-Z CAT', 19877, 9900],
  ['ENDOXAN 500 MG', 26463, 13000],
  ['ENDOXAN 50 MG', 5000, 2500],
  ['FENILSONE', 16960, 8500],
  ['FLUOXETINA 20 MG', 5000, 2500],
  ['FYBOGEL', 11346, 5700],
  ['GAMADERM', 9552, 4800],
  ['HALOPERIDOL 10 MG', 5000, 2500],
  ['HERREX', 17620, 8800],
  ['HIDROCLOROTIAZIDA 25 MG', 5000, 2500],
  ['KETOPROFENO GEL', 12000, 6000],
  ['MAXITROL', 22429, 11000],
  ['MD-GASTROVIEW', 8671, 4300],
  ['MERTHIOLATE', 9091, 4500],
  ['METOCARBAMOL 750 MG', 5000, 2500],
  ['METRONIDAZOL 500MG', 5000, 2500],
  ['METROZIN 500 MG', 7000, 3500],
  ['MINIRIN MELT', 9495, 4700],
  ['MIOSTAT', 30357, 15000],
  ['OMEPRAZOL 20 MG', 10000, 5000],
  ['PAMOATO DE PIRANTEL', 21930, 11000],
  ['PREDNISOLONA 5 MG', 12000, 6000],
  ['PROCICAR', 16766, 8400],
  ['PROSTIN VR', 27467, 14000],
  ['PROVERA 5MG', 5000, 2500],
  ['PROXIGEL', 7000, 3500],
  ['RETROVIR IV', 27356, 14000],
  ['SANDIMMUN NEORAL', 7459, 3700],
  ['SYNTOCINON', 24526, 12000],
  ['TEARS NATURALE', 9931, 5000],
  ['TESTOVIRON DEPOT', 31499, 16000],
  // Palabras clave genéricas
  ['ACETAMINOFEN', 5500, 2800],
  ['SALBUTAMOL', 38000, 19000],
  ['VITAMINA C', 16000, 8000],
  ['LORATADINA', 5500, 2700],
  ['CETIRIZINA', 18500, 9000],
  ['DICLOFENACO', 6500, 3200],
  ['NAPROXENO', 8000, 4000],
  ['AMOXICILINA', 18000, 9000],
  ['LOSARTAN', 10000, 5000],
  ['ENALAPRIL', 8500, 4200],
  ['ATORVASTATINA', 28000, 14000],
  ['METFORMINA', 12000, 6000],
  ['INSULINA', 85000, 45000],
  ['LEVOTIROXINA', 18000, 9000],
  ['PREDNISOLONA', 12000, 6000],
  ['OMEPRAZOL', 10000, 5000],
  ['FLUOXETINA', 5000, 2500],
  ['IBUPROFENO 400', 8500, 4200],
  ['IBUPROFENO 600', 12000, 6000],
]

async function main() {
  console.log('\n' + '═'.repeat(65))
  console.log('  ACTUALIZAR PRECIOS v2 — Precios Colombia 2025-2026')
  console.log('═'.repeat(65) + '\n')

  let updated = 0
  let notFound = 0
  const lines = []

  for (const [busca, precioVenta, precioCosto] of MAPA_PRECIOS) {
    const q = busca.replace(/'/g, "''") // sanitizar contra SQL injection
    const q2 = q.replace(/[%_]/g, '\\$&') // escapar caracteres especiales LIKE
    
    // Buscar en DB usando docker exec con comillas dobles
    try {
      const result = execSync(
        `docker exec farmacy_postgres_dev psql -U ${DB_USER} -d ${DB_NAME} -t -A -F"|" -c "SELECT id, nombre, precio_venta FROM productos WHERE UPPER(nombre) LIKE UPPER('%"${q}"%') LIMIT 5;"`,
        { encoding: 'utf8', timeout: 15000 }
      )
      
      const resultLines = result.trim().split('\n').filter(l => l.trim())
      
      if (resultLines.length === 0) {
        // Try without quotes
        const result2 = execSync(
          `docker exec farmacy_postgres_dev psql -U ${DB_USER} -d ${DB_NAME} -t -A -F"|" -c "SELECT id, nombre, precio_venta FROM productos WHERE UPPER(nombre) LIKE UPPER('%${q}%') LIMIT 5;"`,
          { encoding: 'utf8', timeout: 15000 }
        )
        const resultLines2 = result2.trim().split('\n').filter(l => l.trim())
        
        if (resultLines2.length === 0) {
          lines.push(`  ⚠️  No encontrado: "${busca}"`)
          notFound++
          continue
        }
        
        for (const line of resultLines2) {
          const parts = line.split('|')
          if (parts.length < 3) continue
          const [id, nombre, oldPrice] = parts
          
          execSync(
            `docker exec farmacy_postgres_dev psql -U ${DB_USER} -d ${DB_NAME} -c "UPDATE productos SET precio_venta = ${precioVenta} WHERE id = '${id}';"`,
            { encoding: 'utf8', timeout: 10000 }
          )
          
          lines.push(`  ✅ ${(nombre.trim().substring(0, 48)).padEnd(48)} $${oldPrice.replace('.00','').padStart(8)} → $${String(precioVenta).padStart(8)}`)
          updated++
        }
        continue
      }

      for (const line of resultLines) {
        const parts = line.split('|')
        if (parts.length < 3) continue
        const [id, nombre, oldPrice] = parts
        
        execSync(
          `docker exec farmacy_postgres_dev psql -U ${DB_USER} -d ${DB_NAME} -c "UPDATE productos SET precio_venta = ${precioVenta} WHERE id = '${id}';"`,
          { encoding: 'utf8', timeout: 10000 }
        )
        
        lines.push(`  ✅ ${(nombre.trim().substring(0, 48)).padEnd(48)} $${oldPrice.replace('.00','').padStart(8)} → $${String(precioVenta).padStart(8)}`)
        updated++
      }
    } catch (err) {
      lines.push(`  ⚠️  Error buscando "${busca}": ${err.message}`)
      notFound++
    }
  }

  lines.forEach(l => console.log(l))

  // Total products
  const total = execSync(
    `docker exec farmacy_postgres_dev psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM productos;"`,
    { encoding: 'utf8', timeout: 10000 }
  ).trim()
  
  const conPrecio = execSync(
    `docker exec farmacy_postgres_dev psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM productos WHERE precio_venta > 1000;"`,
    { encoding: 'utf8', timeout: 10000 }
  ).trim()

  console.log('\n' + '═'.repeat(65))
  console.log(`  Actualizados: ${updated} | No encontrados: ${notFound}`)
  console.log(`  Productos totales: ${total} | Con precio > $1,000: ${conPrecio}`)
  console.log('═'.repeat(65) + '\n')
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
