// ═══════════════════════════════════════════════════════════
//  Script de Importación Completo: Productos + Lotes
//  CommonJS (.cjs) para evitar problemas de módulos ESM con
//  ts-node. Se ejecuta directamente con Node.js.
//
//  USO:
//    cd backend && node ../database/scripts/importar-y-generar.cjs
// ═══════════════════════════════════════════════════════════

const { PrismaClient } = require('@prisma/client')
const { readFileSync, existsSync } = require('fs')
const { Readable } = require('stream')
const { parse } = require('csv-parse')
const path = require('path')

const prisma = new PrismaClient({ log: ['error'] })

// ── Rutas ─────────────────────────────────────────────────
const CSV_PATH = path.join(__dirname, '..', 'seeds', 'INVIMA-MINI.csv')
const CATEGORIA_DEFAULT_ID = 1

// ── Helpers ───────────────────────────────────────────────
function parseFecha(f) {
  if (!f || f.trim() === '') return null
  const d = new Date(f.trim())
  return isNaN(d.getTime()) ? null : d
}

function parseBool(v) {
  return v?.trim().toLowerCase() === 'si'
}

function nullIfEmpty(v) {
  return v?.trim() || null
}

function generarSlug(nombre, cum) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + cum
}

function sumarDias(fecha, dias) {
  const r = new Date(fecha)
  r.setDate(r.getDate() + dias)
  return r
}

// ── Perfiles de lotes por ATC ─────────────────────────────
const PERFILES_ATC = {
  A: { lotesPorProducto: 3, cantidades: [120, 80, 200], nombreBase: 'DIG' },
  B: { lotesPorProducto: 2, cantidades: [60, 100], nombreBase: 'HEM' },
  C: { lotesPorProducto: 3, cantidades: [150, 100, 250], nombreBase: 'CARD' },
  D: { lotesPorProducto: 2, cantidades: [80, 120], nombreBase: 'DERM' },
  G: { lotesPorProducto: 2, cantidades: [50, 80], nombreBase: 'GEN' },
  H: { lotesPorProducto: 2, cantidades: [40, 60], nombreBase: 'HORM' },
  J: { lotesPorProducto: 3, cantidades: [100, 150, 200], nombreBase: 'INF' },
  L: { lotesPorProducto: 1, cantidades: [30], nombreBase: 'ONCO' },
  M: { lotesPorProducto: 2, cantidades: [80, 150], nombreBase: 'MUSC' },
  N: { lotesPorProducto: 3, cantidades: [100, 60, 180], nombreBase: 'NER' },
  P: { lotesPorProducto: 2, cantidades: [70, 130], nombreBase: 'PARA' },
  R: { lotesPorProducto: 3, cantidades: [90, 120, 160], nombreBase: 'RESP' },
  S: { lotesPorProducto: 2, cantidades: [60, 90], nombreBase: 'SENS' },
  V: { lotesPorProducto: 1, cantidades: [50], nombreBase: 'VAR' },
}

const PERFIL_DEFAULT = { lotesPorProducto: 2, cantidades: [50, 80], nombreBase: 'GEN' }

// ── Contadores ────────────────────────────────────────────
let totalLeidos = 0
let totalProductos = 0
let totalLotes = 0
let totalErrores = 0

// ── Función principal ─────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('  IMPORTACIÓN + LOTES INVIMA')
  console.log('═══════════════════════════════════════════════\n')

  // Verificar CSV
  if (!existsSync(CSV_PATH)) {
    console.error('❌ No se encontró:', CSV_PATH)
    process.exit(1)
  }

  // Verificar categorías
  const catCount = await prisma.categoria.count()
  if (catCount === 0) {
    console.error('❌ No hay categorías. Ejecuta: pnpm run db:seed')
    process.exit(1)
  }
  console.log(`✅ ${catCount} categorías disponibles`)

  // Obtener sucursales y proveedores
  const sucursales = await prisma.sucursal.findMany({ take: 2 })
  const proveedores = await prisma.proveedor.findMany({ take: 2 })
  console.log(`✅ ${sucursales.length} sucursales, ${proveedores.length} proveedores\n`)

  // ── FASE 1: Importar productos ──────────────────────────
  console.log('📦 FASE 1: Importando productos desde CSV...')

  const cumsImportados = []

  // Leer y limpiar BOM manualmente antes de parsear
  const rawContent = readFileSync(CSV_PATH, 'utf-8')
  const cleanedContent = rawContent.replace(/^\ufeff/, '')

  const parser = Readable.from(cleanedContent).pipe(
    parse({
      columns: (headers) => headers.map(h => h.trim()),
      delimiter: ',',
      quote: '"',
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
      bom: false,
    })
  )

  for await (const row of parser) {
    totalLeidos++
    const record = row

    try {
      const cum = `${record.expedientecum || '0'}-${record.consecutivocum || '0'}`
      const requiereRx = record.modalidad?.toLowerCase().includes('control') || false

      const productoData = {
        cum,
        registroInvima: nullIfEmpty(record.registrosanitario) || 'SIN_REGISTRO',
        nombre: nullIfEmpty(record.producto) || 'SIN_NOMBRE',
        principioActivo: nullIfEmpty(record.principioactivo) || 'SIN_PRINCIPIO_ACTIVO',
        atc: nullIfEmpty(record.atc),
        descripcionAtc: nullIfEmpty(record.descripcionatc),
        titular: nullIfEmpty(record.titular),
        expediente: nullIfEmpty(record.expediente),
        formaFarmaceutica: nullIfEmpty(record.formafarmaceutica),
        viaAdministracion: nullIfEmpty(record.viaadministracion),
        slug: generarSlug(record.producto, cum),
        laboratorio: nullIfEmpty(record.titular),
        presentacion: nullIfEmpty(record.descripcioncomercial),
        concentracion: nullIfEmpty(record.concentracion),
        requiereRx,
        precioVenta: parseFloat(record.precioventa) || 0,
        precioPromedio: Math.round((parseFloat(record.preciocompra) || 0) * 1.10),
        stockMinimo: 10,
        estadoCum: record.estadocum?.trim() === 'Activo' ? 'Activo' : 'Inactivo',
        estadoRegistro: nullIfEmpty(record.estadoregistro) || 'Vigente',
        fechaExpedicion: parseFecha(record.fechaexpedicion),
        fechaVencimientoRegistro: parseFecha(record.fechavencimiento),
        fechaActivoCum: parseFecha(record.fechaactivo),
        fechaInactivoCum: parseFecha(record.fechainactivo),
        esMuestraMedica: parseBool(record.muestramedica),
        unidadReferencia: nullIfEmpty(record.unidadreferencia),
        cantidad: nullIfEmpty(record.cantidad),
        unidadMedida: nullIfEmpty(record.unidadmedida),
        modalidad: nullIfEmpty(record.modalidad),
        ium: nullIfEmpty(record.IUM),
        categoriaId: CATEGORIA_DEFAULT_ID,
        activo: true,
      }

      await prisma.producto.upsert({
        where: { cum },
        update: productoData,
        create: productoData,
      })

      cumsImportados.push({
        cum,
        atc: (record.atc || 'X').trim().charAt(0).toUpperCase(),
        precioCompra: parseFloat(record.preciocompra) || 0,
      })
      totalProductos++
    } catch (err) {
      totalErrores++
      if (totalErrores <= 5) {
        const cumId = `${record.expedientecum || '?'}-${record.consecutivocum || '?'}`
        console.error(`  ⚠️  Error [${cumId}]: ${err.message?.substring(0, 120)}`)
      }
    }

    if (totalLeidos % 20 === 0) {
      process.stdout.write(`  ⏳ ${totalLeidos} registros... (${totalProductos} productos)\r`)
    }
  }

  console.log(`\n  ✅ ${totalProductos} productos importados`)
  if (totalErrores > 0) console.log(`  ⚠️  ${totalErrores} errores`)

  if (cumsImportados.length === 0) {
    console.log('❌ No hay productos para crear lotes.')
    process.exit(0)
  }

  // ── FASE 2: Generar lotes ──────────────────────────────
  console.log('\n📦 FASE 2: Generando lotes de inventario...')

  // Obtener IDs de los productos importados
  const productos = await prisma.producto.findMany({
    where: { cum: { in: cumsImportados.map(c => c.cum) } },
    select: { id: true, cum: true, atc: true },
  })
  const prodMap = new Map(productos.map(p => [p.cum, p]))

  // Limpiar lotes existentes
  const prodIds = productos.map(p => p.id)
  const lotesExist = await prisma.lote.count({ where: { productoId: { in: prodIds } } })
  if (lotesExist > 0) {
    console.log(`  ⚠️  Eliminando ${lotesExist} lotes anteriores + datos relacionados...`)
    await prisma.alertaInventario.deleteMany({ where: { lote: { productoId: { in: prodIds } } } })
    await prisma.movimientoInventario.deleteMany({ where: { lote: { productoId: { in: prodIds } } } })
    await prisma.detalleVenta.deleteMany({ where: { lote: { productoId: { in: prodIds } } } })
    await prisma.lote.deleteMany({ where: { productoId: { in: prodIds } } })
    console.log('  ✅ Lotes anteriores eliminados')
  }

  const hoy = new Date()
  const lotesToCreate = []
  let idx = 0

  for (const csvRecord of cumsImportados) {
    const producto = prodMap.get(csvRecord.cum)
    if (!producto) continue

    const atcLetter = producto.atc?.trim().charAt(0).toUpperCase() || csvRecord.atc
    const perfil = PERFILES_ATC[atcLetter] || PERFIL_DEFAULT
    const precioCompra = csvRecord.precioCompra || Math.round(Math.random() * 5000 + 500)
    const proveedor = proveedores[idx % proveedores.length]
    const sucursal = sucursales[idx % sucursales.length]

    for (let i = 0; i < perfil.lotesPorProducto; i++) {
      idx++

      let diasOffset
      if (i === 0) diasOffset = 45 + Math.floor(Math.random() * 75)
      else if (i === 1) diasOffset = 300 + Math.floor(Math.random() * 240)
      else diasOffset = 730 + Math.floor(Math.random() * 365)

      const fechaVenc = sumarDias(hoy, diasOffset)
      const cantidad = perfil.cantidades[i] || 50
      const vendido = Math.floor(Math.random() * Math.max(1, cantidad * 0.3))
      const cantidadActual = cantidad - vendido
      const diasFab = Math.floor(Math.random() * 540 + 90)
      const fechaFab = sumarDias(fechaVenc, -diasFab)
      const cumSimple = csvRecord.cum.replace(/[^a-zA-Z0-9]/g, '')
      const codigoLote = `L-${perfil.nombreBase}-${cumSimple.substring(0, 6)}-${i + 1}`

      lotesToCreate.push({
        codigoLote,
        productoId: producto.id,
        sucursalId: sucursal.id,
        proveedorId: proveedor.id,
        fechaFabricacion: fechaFab,
        fechaVencimiento: fechaVenc,
        cantidadInicial: cantidad,
        cantidadActual,
        precioCompra,
      })
    }
  }

  // Insertar lotes
  const BATCH = 50
  for (let i = 0; i < lotesToCreate.length; i += BATCH) {
    await prisma.lote.createMany({ data: lotesToCreate.slice(i, i + BATCH) })
  }
  totalLotes = lotesToCreate.length
  console.log(`  ✅ ${totalLotes} lotes creados`)

  // ── FASE 3: Recalcular costos promedio ──────────────────
  console.log('\n💰 FASE 3: Recalculando costos promedio...')
  let actualizados = 0

  for (const producto of productos) {
    const lotes = await prisma.lote.findMany({
      where: { productoId: producto.id, cantidadActual: { gt: 0 } },
      select: { cantidadActual: true, precioCompra: true },
    })
    const totalCant = lotes.reduce((s, l) => s + l.cantidadActual, 0)
    const totalCost = lotes.reduce((s, l) => s + l.cantidadActual * Number(l.precioCompra), 0)
    const promedio = totalCant > 0
      ? Math.round(totalCost / totalCant)
      : Math.round(Math.random() * 5000 + 500)

    await prisma.producto.update({
      where: { id: producto.id },
      data: { precioPromedio: promedio },
    })
    actualizados++
  }
  console.log(`  ✅ ${actualizados} productos actualizados`)

  // ── Resumen Final ──────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════')
  console.log('  PROCESO COMPLETADO')
  console.log('═══════════════════════════════════════════════')
  console.log(`  📊 Productos importados: ${totalProductos}`)
  console.log(`  📦 Lotes generados:      ${totalLotes}`)
  console.log(`  ❌ Errores:               ${totalErrores}`)
  console.log(`  🏪 Sucursales:           ${sucursales.length}`)
  console.log(`  🏭 Proveedores:          ${proveedores.length}`)
  console.log('')
}

main()
  .catch(e => { console.error('❌ Error fatal:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); console.log('🔌 Conexión cerrada.') })
