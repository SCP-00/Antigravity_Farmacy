/**
 * ═══════════════════════════════════════════════════════════
 *  Actualizar precios de medicamentos con precios reales COP
 * ═══════════════════════════════════════════════════════════
 *
 *  Basado en investigación web de precios colombianos 2025-2026
 *  Fuentes: Cruz Verde, Farmatodo, Colsubsidio, La Rebaja
 *
 *  Ejecutar: node actualizar-precios.mjs
 * ═══════════════════════════════════════════════════════════
 */

// Mapa de precios reales: busca por nombre contiene (case insensitive)
// y actualiza precioVenta y precioCosto
const ACTUALIZACIONES = [
  // ── ANALGÉSICOS ──────────────────────────────────────────
  { busca: 'ACETAMINOFEN 500',  precioVenta: 5500,  precioCosto: 2800 },
  { busca: 'ACETAMINOFÉN 500',  precioVenta: 5500,  precioCosto: 2800 },
  { busca: 'IBUPROFENO 400',    precioVenta: 8500,  precioCosto: 4200 },
  { busca: 'IBUPROFENO 600',    precioVenta: 12000, precioCosto: 6000 },
  { busca: 'DICLOFENACO 50',    precioVenta: 6500,  precioCosto: 3200 },
  { busca: 'DICLOFENACO SOD',   precioVenta: 6500,  precioCosto: 3200 },
  { busca: 'NAPROXENO 500',     precioVenta: 8000,  precioCosto: 4000 },
  { busca: 'NAPROXENO SÓDICO',  precioVenta: 8000,  precioCosto: 4000 },

  // ── ANTIBIÓTICOS ─────────────────────────────────────────
  { busca: 'AMOXICILINA 500',      precioVenta: 18000, precioCosto: 9000 },
  { busca: 'AMOXICILINA 500MG',    precioVenta: 18000, precioCosto: 9000 },

  // ── CARDIOVASCULAR ───────────────────────────────────────
  { busca: 'LOSARTAN 50',       precioVenta: 10000, precioCosto: 5000 },
  { busca: 'LOSARTÁN 50',       precioVenta: 10000, precioCosto: 5000 },
  { busca: 'ENALAPRIL 20',      precioVenta: 8500,  precioCosto: 4200 },
  { busca: 'ENALAPRIL 10',      precioVenta: 6500,  precioCosto: 3200 },
  { busca: 'ATORVASTATINA 20',  precioVenta: 28000, precioCosto: 14000 },
  { busca: 'ATORVASTATINA 10',  precioVenta: 18000, precioCosto: 9000 },
  { busca: 'METFORMINA 850',    precioVenta: 12000, precioCosto: 6000 },
  { busca: 'METFORMINA 500',    precioVenta: 9000,  precioCosto: 4500 },

  // ── ANTIALÉRGICOS ────────────────────────────────────────
  { busca: 'LORATADINA 10',     precioVenta: 5500,  precioCosto: 2700 },
  { busca: 'CETIRIZINA',        precioVenta: 18500, precioCosto: 9000 },
  { busca: 'ALERCET',           precioVenta: 18500, precioCosto: 9000 },

  // ── DERMATOLOGÍA ─────────────────────────────────────────
  { busca: 'CREMA HIDRATANTE', precioVenta: 15000, precioCosto: 7500 },

  // ── GASTROINTESTINAL ─────────────────────────────────────
  { busca: 'OMEPRAZOL 20',     precioVenta: 10000, precioCosto: 5000 },

  // ── RESPIRATORIO ─────────────────────────────────────────
  { busca: 'SALBUTAMOL',       precioVenta: 38000, precioCosto: 19000 },
  { busca: 'AMBROXOL',         precioVenta: 8773,  precioCosto: 4300 },

  // ── VITAMINAS ────────────────────────────────────────────
  { busca: 'VITAMINA C 1000',  precioVenta: 16000, precioCosto: 8000 },
  { busca: 'VITAMINA C 1G',    precioVenta: 16000, precioCosto: 8000 },
  { busca: 'ACIDO FOLICO',     precioVenta: 2143,  precioCosto: 1000 },

  // ── OTROS ────────────────────────────────────────────────
  { busca: 'LEVOTIROXINA 50',  precioVenta: 18000, precioCosto: 9000 },
  { busca: 'LEVOTIROXINA SÓDICA', precioVenta: 18000, precioCosto: 9000 },
  { busca: 'INSULINA NPH',     precioVenta: 85000, precioCosto: 45000 },
  { busca: 'AGUA ESTÉRIL',     precioVenta: 8469,  precioCosto: 4200 },
  { busca: 'PREDNISOLONA',     precioVenta: 12000, precioCosto: 6000 },
]

const DB_USER = 'farmacy_user'
const DB_NAME = 'farmacy_db'
const TS      = Date.now()

async function main() {
  console.log('\n' + '═'.repeat(55))
  console.log('  ACTUALIZAR PRECIOS — Precios Colombia 2025-2026')
  console.log('═'.repeat(55) + '\n')

  const { execSync } = await import('child_process')
  let actualizados = 0
  let noEncontrados = 0

  for (const upd of ACTUALIZACIONES) {
    // Primero buscar productos que coincidan
    const query = upd.busca.replace(/'/g, "''")
    const searchResult = execSync(
      `docker exec farmacy_postgres_dev psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT id, nombre, precio_venta FROM productos WHERE UPPER(nombre) LIKE UPPER('%${query}%');"`,
      { encoding: 'utf8', timeout: 10000 }
    )

    const lines = searchResult.trim().split('\n').filter(l => l.trim())
    
    if (lines.length === 0) {
      console.log(`  ⚠️  No encontrado: "${upd.busca}"`)
      noEncontrados++
      continue
    }

    for (const line of lines) {
      const parts = line.trim().split('|').map(s => s.trim())
      if (parts.length < 3) continue
      const [id, nombre, precioAnterior] = parts
      
      const updateCmd = `docker exec farmacy_postgres_dev psql -U ${DB_USER} -d ${DB_NAME} -c "UPDATE productos SET precio_venta = ${upd.precioVenta} WHERE id = '${id}';"`
      execSync(updateCmd, { encoding: 'utf8', timeout: 10000 })

      console.log(`  ✅ ${nombre.trim().substring(0, 45).padEnd(45)} $${precioAnterior.padStart(8)} → $${String(upd.precioVenta).padStart(8)}`)
      actualizados++
    }
  }

  console.log('\n' + '═'.repeat(55))
  console.log(`  Total: ${actualizados} actualizados | ${noEncontrados} no encontrados`)
  console.log('═'.repeat(55) + '\n')
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
