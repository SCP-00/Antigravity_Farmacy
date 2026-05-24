// ═══════════════════════════════════════════════════════════
//  Generador de Mini-CSV INVIMA
//  Filtra ~3-4 productos comerciales representativos por
//  grupo ATC, agrega precios de compra/venta realistas
//  y genera un archivo pequeño y manejable (~50 productos)
//
//  USO (desde backend/):
//    node scripts/generar-mini-csv.mjs
//
//  SALIDA: ../database/seeds/INVIMA-MINI.csv
// ═══════════════════════════════════════════════════════════

import { createReadStream, createWriteStream, existsSync } from 'fs'
import { parse } from 'csv-parse'
import { stringify } from 'csv-stringify/sync'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CSV_ORIGINAL = path.resolve(__dirname, '..', '..', 'INVIMA.csv')
const CSV_SALIDA   = path.resolve(__dirname, '..', '..', 'database', 'seeds', 'INVIMA-MINI.csv')

const PRODUCTOS_POR_ATC = 4

// ── Precios de referencia Colombia (2024-2025) ────────────
const PRECIOS = {
  default:          { compra: 5000,  venta: 8500 },
  tableta:          { compra: 1200,  venta: 2500 },
  capsula:          { compra: 1500,  venta: 3200 },
  jarabe:           { compra: 8000,  venta: 18500 },
  suspension:       { compra: 9500,  venta: 22000 },
  crema:            { compra: 6500,  venta: 15000 },
  solucion:         { compra: 4500,  venta: 9500 },
  inyectable:       { compra: 12000, venta: 28000 },
  inhalador:        { compra: 35000, venta: 78000 },
  oftalmica:        { compra: 8500,  venta: 19500 },
  vaginal:          { compra: 7000,  venta: 16000 },
  reconstituir:     { compra: 15000, venta: 35000 },
  cardiovascular:   { compra: 8000,  venta: 18500 },
  antibiotico:      { compra: 10000, venta: 25000 },
  sistemaNervioso:  { compra: 6000,  venta: 14000 },
  digestivo:        { compra: 4500,  venta: 10000 },
}

function obtenerPrecio(forma, atc) {
  const f = (forma || '').toLowerCase()
  const a = (atc || ' ')[0]?.toUpperCase() || ''

  if (f.includes('tableta') || f.includes('comprimido') || f.includes('gragea')) return PRECIOS.tableta
  if (f.includes('capsula')) return PRECIOS.capsula
  if (f.includes('jarabe') || f.includes('elixir')) return PRECIOS.jarabe
  if (f.includes('crema') || f.includes('ungüento') || f.includes('pomada')) return PRECIOS.crema
  if (f.includes('suspension')) return PRECIOS.suspension
  if (f.includes('solucion') && !f.includes('inyectable')) return PRECIOS.solucion
  if (f.includes('inyectable') || f.includes('parenteral')) return PRECIOS.inyectable
  if (f.includes('polvo') && f.includes('reconstituir')) return PRECIOS.reconstituir
  if (f.includes('inhalador') || f.includes('aerosol') || f.includes('nebulizacion')) return PRECIOS.inhalador
  if (f.includes('oftalmica') || f.includes('gotas oculares')) return PRECIOS.oftalmica
  if (f.includes('vaginal') || f.includes('ovulo')) return PRECIOS.vaginal

  if (a === 'C') return PRECIOS.cardiovascular
  if (a === 'J') return PRECIOS.antibiotico
  if (a === 'N') return PRECIOS.sistemaNervioso
  if (a === 'A') return PRECIOS.digestivo

  return PRECIOS.default
}

function formaGrupo(forma) {
  const f = (forma || '').toLowerCase()
  if (f.includes('tableta') || f.includes('comprimido')) return 'tableta'
  if (f.includes('capsula')) return 'capsula'
  if (f.includes('jarabe') || f.includes('elixir')) return 'jarabe'
  if (f.includes('crema') || f.includes('ungüento')) return 'crema'
  if (f.includes('suspension')) return 'suspension'
  if (f.includes('solucion') && !f.includes('inyectable')) return 'solucion'
  if (f.includes('inyectable')) return 'inyectable'
  if (f.includes('inhalador') || f.includes('aerosol')) return 'inhalador'
  if (f.includes('oftalmica')) return 'oftalmica'
  return 'otro'
}

async function main() {
  console.log('')
  console.log('═══════════════════════════════════════════════')
  console.log('  GENERADOR DE MINI-CSV INVIMA')
  console.log('═══════════════════════════════════════════════')
  console.log('')

  if (!existsSync(CSV_ORIGINAL)) {
    console.error('❌ No se encontró INVIMA.csv en: ' + CSV_ORIGINAL)
    process.exit(1)
  }

  console.log('  📂 Leyendo: ' + CSV_ORIGINAL)
  console.log('')

  const productos = []
  let totalLeidos = 0

  const parser = createReadStream(CSV_ORIGINAL, { encoding: 'utf-8' }).pipe(
    parse({
      columns: (headers) => headers.map(h => h.replace(/^\ufeff/, '').trim()),
      delimiter: ',',
      quote: '"',
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    })
  )

  for await (const row of parser) {
    totalLeidos++
    const estadocum = (row.estadocum || '').trim()
    const muestramedica = (row.muestramedica || '').trim().toLowerCase()
    const atc = (row.atc || '').trim()

    if (estadocum === 'Activo' && muestramedica === 'no' && atc.length >= 1) {
      row.grupoAtc = atc[0].toUpperCase()
      row.formaGrupo = formaGrupo(row.formafarmaceutica || '')
      productos.push(row)
    }

    if (totalLeidos % 50000 === 0) {
      console.log('  📖 Leídos ' + totalLeidos.toLocaleString() + ' registros...')
    }
  }

  // Agrupar por ATC
  const grupos = {}
  for (const p of productos) {
    if (!grupos[p.grupoAtc]) grupos[p.grupoAtc] = []
    grupos[p.grupoAtc].push(p)
  }

  console.log('\n  📊 Total leídos: ' + totalLeidos.toLocaleString())
  console.log('  🎯 Productos activos + comerciales: ' + productos.length.toLocaleString())

  const seleccionados = []
  const gruposKeys = Object.keys(grupos).sort()

  for (const grupo of gruposKeys) {
    const pool = grupos[grupo]
    const formasUsadas = new Set()
    const elegidos = []

    for (const p of pool) {
      if (elegidos.length >= PRODUCTOS_POR_ATC) break
      if (!formasUsadas.has(p.formaGrupo)) {
        elegidos.push(p)
        formasUsadas.add(p.formaGrupo)
      }
    }

    for (const p of pool) {
      if (elegidos.length >= PRODUCTOS_POR_ATC) break
      if (!elegidos.includes(p)) elegidos.push(p)
    }

    const paraGrupo = elegidos.slice(0, PRODUCTOS_POR_ATC)
    seleccionados.push(...paraGrupo)
    console.log('  📂 ATC-' + grupo + ': ' + pool.length.toLocaleString() + ' disp → ' + paraGrupo.length + ' sel.')
  }

  console.log('\n  ✅ Total seleccionados: ' + seleccionados.length + ' productos')

  // Generar CSV con precios
  const cabeceras = [
    'expediente', 'producto', 'titular', 'registrosanitario',
    'fechaexpedicion', 'fechavencimiento', 'estadoregistro',
    'expedientecum', 'consecutivocum', 'cantidadcum',
    'descripcioncomercial', 'estadocum', 'fechaactivo', 'fechainactivo',
    'muestramedica', 'unidad', 'atc', 'descripcionatc',
    'viaadministracion', 'concentracion', 'principioactivo',
    'unidadmedida', 'cantidad', 'unidadreferencia',
    'formafarmaceutica', 'nombrerol', 'tiporol', 'modalidad', 'IUM',
    'preciocompra', 'precioventa',
  ]

  const filas = seleccionados.map((p) => {
    const precios = obtenerPrecio(p.formafarmaceutica || '', p.atc || '')
    const factor = 0.85 + Math.random() * 0.3
    const pCompra = Math.round(precios.compra * factor)
    const pVenta  = Math.round(precios.venta * factor)

    return cabeceras.map(col => {
      if (col === 'preciocompra') return String(pCompra)
      if (col === 'precioventa') return String(pVenta)
      return p[col] || ''
    })
  })

  const csvContent = stringify([cabeceras, ...filas], { delimiter: ',', quoted: true })

  const ws = createWriteStream(CSV_SALIDA, { encoding: 'utf-8' })
  ws.write('\ufeff')
  ws.write(csvContent)
  ws.end()

  console.log('  💾 Guardado: ' + CSV_SALIDA)

  // Estadísticas
  const idxCompra = cabeceras.indexOf('preciocompra')
  const idxVenta  = cabeceras.indexOf('precioventa')
  const totalCompra = filas.reduce((s, f) => s + parseInt(f[idxCompra] || '0'), 0)
  const totalVenta  = filas.reduce((s, f) => s + parseInt(f[idxVenta] || '0'), 0)
  console.log('  💰 Compra total: $' + totalCompra.toLocaleString())
  console.log('  💰 Venta total:  $' + totalVenta.toLocaleString())
  console.log('')
  console.log('═══════════════════════════════════════════════')
  console.log('  ¡MINI-CSV GENERADO!')
  console.log('═══════════════════════════════════════════════')
}

main().catch(console.error)
