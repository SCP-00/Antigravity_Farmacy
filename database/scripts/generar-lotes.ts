// ═══════════════════════════════════════════════════════════
//  Generación Masiva de Lotes de Inventario
//  Lee el mini-CSV INVIMA y crea lotes con fechas de
//  vencimiento variadas para cada producto existente.
//
//  USO:
//    cd backend && npx ts-node ../database/scripts/generar-lotes.ts
//
//  ⚠️  Requisitos:
//     1. Los productos ya deben estar importados (ejecutar
//        importar-invima.ts primero o correr los seeds)
//     2. Deben existir sucursales y proveedores en la DB
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import { createReadStream, existsSync } from 'fs'
import { parse } from 'csv-parse'
import path from 'path'

const prisma = new PrismaClient({ log: ['error'] })

// ── Rutas ─────────────────────────────────────────────────
const CSV_PATH = path.resolve(__dirname, '..', '..', 'database', 'seeds', 'INVIMA-MINI.csv')

// ── Configuración de lotes ────────────────────────────────
// Perfiles de productos para determinar cuántos lotes y qué cantidades asignar
interface PerfilLote {
  lotesPorProducto: number        // 1–3 lotes
  cantidades: number[]            // cantidades para cada lote
  nombreBase: string              // prefijo del código de lote
}

// Clasificación por primera letra del ATC
const PERFILES_ATC: Record<string, PerfilLote> = {
  // A: Digestivo / Vitaminas — alta rotación
  A: { lotesPorProducto: 3, cantidades: [120, 80, 200], nombreBase: 'DIG' },
  // B: Sangre / Antianémicos — rotación media
  B: { lotesPorProducto: 2, cantidades: [60, 100], nombreBase: 'HEM' },
  // C: Cardiovascular — alta rotación
  C: { lotesPorProducto: 3, cantidades: [150, 100, 250], nombreBase: 'CARD' },
  // D: Dermatología — rotación media
  D: { lotesPorProducto: 2, cantidades: [80, 120], nombreBase: 'DERM' },
  // G: Genitourinario — rotación media
  G: { lotesPorProducto: 2, cantidades: [50, 80], nombreBase: 'GEN' },
  // H: Hormonal — rotación baja
  H: { lotesPorProducto: 2, cantidades: [40, 60], nombreBase: 'HORM' },
  // J: Antiinfecciosos — alta rotación
  J: { lotesPorProducto: 3, cantidades: [100, 150, 200], nombreBase: 'INF' },
  // L: Antineoplásicos — rotación baja
  L: { lotesPorProducto: 1, cantidades: [30], nombreBase: 'ONCO' },
  // M: Musculoesquelético — rotación media
  M: { lotesPorProducto: 2, cantidades: [80, 150], nombreBase: 'MUSC' },
  // N: Sistema Nervioso — rotación media-alta
  N: { lotesPorProducto: 3, cantidades: [100, 60, 180], nombreBase: 'NER' },
  // P: Antiparasitarios — rotación media
  P: { lotesPorProducto: 2, cantidades: [70, 130], nombreBase: 'PARA' },
  // R: Respiratorio — alta rotación
  R: { lotesPorProducto: 3, cantidades: [90, 120, 160], nombreBase: 'RESP' },
  // S: Órganos Sensoriales — rotación media
  S: { lotesPorProducto: 2, cantidades: [60, 90], nombreBase: 'SENS' },
  // V: Varios — rotación baja
  V: { lotesPorProducto: 1, cantidades: [50], nombreBase: 'VAR' },
}

// Perfil por defecto si no se encuentra el ATC
const PERFIL_DEFAULT: PerfilLote = {
  lotesPorProducto: 2, cantidades: [50, 80], nombreBase: 'GEN',
}

// ── Helpers de fechas ─────────────────────────────────────
function sumarDias(fecha: Date, dias: number): Date {
  const r = new Date(fecha)
  r.setDate(r.getDate() + dias)
  return r
}

// ── Contadores ────────────────────────────────────────────
let totalProductos = 0
let totalLotes = 0
let totalErrores = 0

// ── Función principal ─────────────────────────────────────
async function main() {
  console.log('')
  console.log('═══════════════════════════════════════════════')
  console.log('  GENERACIÓN MASIVA DE LOTES DE INVENTARIO')
  console.log('═══════════════════════════════════════════════')
  console.log('')

  if (!existsSync(CSV_PATH)) {
    console.error(`❌ No se encontró el archivo: ${CSV_PATH}`)
    process.exit(1)
  }

  // ── 1. Obtener sucursales y proveedores ────────────────
  console.log('📍 Verificando sucursales y proveedores...')
  const sucursales = await prisma.sucursal.findMany({ take: 2 })
  if (sucursales.length === 0) {
    console.error('❌ No hay sucursales en la DB. Ejecuta primero: npm run db:seed')
    process.exit(1)
  }
  console.log(`  ✅ ${sucursales.length} sucursales encontradas`)

  const proveedores = await prisma.proveedor.findMany({ take: 2 })
  if (proveedores.length === 0) {
    console.error('❌ No hay proveedores en la DB. Ejecuta primero: npm run db:seed')
    process.exit(1)
  }
  console.log(`  ✅ ${proveedores.length} proveedores encontrados`)
  console.log('')

  // ── 2. Leer el CSV para obtener lista de CUMs ─────────
  console.log('📂 Leyendo mini-CSV...')
  const cumsDelCsv: { cum: string; precioCompra: number; atc: string }[] = []

  const parser = createReadStream(CSV_PATH, { encoding: 'utf-8' }).pipe(
    parse({
      columns: (headers: string[]) =>
        headers.map(h => h.replace(/^\ufeff/, '').trim()),
      delimiter: ',',
      quote: '"',
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    })
  )

  for await (const row of parser) {
    const record = row as any
    const cum = `${record.expedientecum || '0'}-${record.consecutivocum || '0'}`
    const precioCompra = parseFloat(record.preciocompra) || 0
    const atc = (record.atc || 'X').trim().charAt(0).toUpperCase()
    cumsDelCsv.push({ cum, precioCompra, atc })
  }
  console.log(`  ✅ ${cumsDelCsv.length} productos en el CSV`)
  console.log('')

  // ── 3. Buscar productos en la DB ──────────────────────
  console.log('🔍 Buscando productos en la base de datos...')
  const productos = await prisma.producto.findMany({
    where: { cum: { in: cumsDelCsv.map(c => c.cum) } },
    select: { id: true, cum: true, nombre: true, atc: true },
  })

  // Mapa CUM → producto
  const prodMap = new Map(productos.map(p => [p.cum, p]))
  console.log(`  ✅ ${productos.length} productos encontrados en DB`)
  console.log('')

  if (productos.length === 0) {
    console.error('❌ No se encontraron productos. Importa primero con importar-invima.ts')
    process.exit(1)
  }

  // ── 4. Generar lotes ──────────────────────────────────
  console.log('📦 Generando lotes de inventario...')
  const hoy = new Date()

  // Limpiar lotes existentes de estos productos para regenerar
  const prodIds = productos.map(p => p.id)
  const lotesExist = await prisma.lote.count({
    where: { productoId: { in: prodIds } },
  })
  if (lotesExist > 0) {
    console.log(`  ⚠️  Ya existen ${lotesExist} lotes para estos productos.`)
    console.log('  ⚠️  Se eliminarán (con movimientos/alertas asociados) para regenerarlos.')
    console.log('  Presiona Ctrl+C ahora para cancelar o espera 3s para continuar...')
    await new Promise(r => setTimeout(r, 3000))
    // Eliminar alertas asociadas a estos lotes
    await prisma.alertaInventario.deleteMany({
      where: { lote: { productoId: { in: prodIds } } },
    })
    // Eliminar movimientos asociados a estos lotes
    await prisma.movimientoInventario.deleteMany({
      where: { lote: { productoId: { in: prodIds } } },
    })
    // Eliminar detalles de venta que referencien estos lotes
    await prisma.detalleVenta.deleteMany({
      where: { lote: { productoId: { in: prodIds } } },
    })
    // Finalmente eliminar los lotes
    await prisma.lote.deleteMany({
      where: { productoId: { in: prodIds } },
    })
    console.log('  ✅ Lotes anteriores eliminados')
  }

  // Preparar lotes a insertar
  const lotesToCreate: any[] = []
  let loteIndex = 0

  for (const csvRecord of cumsDelCsv) {
    const producto = prodMap.get(csvRecord.cum)
    if (!producto) {
      totalErrores++
      continue
    }

    const atcLetter = producto.atc?.trim().charAt(0).toUpperCase() || csvRecord.atc
    const perfil = PERFILES_ATC[atcLetter] || PERFIL_DEFAULT
    // Si el CSV no trae precio, generar uno aleatorio (solo para seed/desarrollo)
    const precioCompra = csvRecord.precioCompra || Math.round(Math.random() * 5000 + 500)

    // Determinar el proveedor (alternar entre los 2 disponibles)
    const proveedor = proveedores[loteIndex % proveedores.length]

    // Distribuir entre sucursales
    const sucursal = sucursales[loteIndex % sucursales.length]

    // Generar los lotes para este producto
    for (let i = 0; i < perfil.lotesPorProducto; i++) {
      loteIndex++

      // Fechas de vencimiento variadas:
      // Lote 1 → próximo a vencer (2–4 meses)
      // Lote 2 → mediano plazo (10–18 meses)
      // Lote 3 → largo plazo (2–3 años)
      let fechaVenc: Date
      let diasOffset: number

      if (i === 0) {
        // Cerca de vencer: entre 45 y 120 días
        diasOffset = 45 + Math.floor(Math.random() * 75)
        fechaVenc = sumarDias(hoy, diasOffset)
      } else if (i === 1) {
        // Mediano plazo: entre 10 y 18 meses
        diasOffset = 300 + Math.floor(Math.random() * 240)
        fechaVenc = sumarDias(hoy, diasOffset)
      } else {
        // Largo plazo: entre 2 y 3 años
        diasOffset = 730 + Math.floor(Math.random() * 365)
        fechaVenc = sumarDias(hoy, diasOffset)
      }

      const cantidad = perfil.cantidades[i] || 50
      // Cantidad actual varía un poco (simula ventas parciales)
      const vendido = Math.floor(Math.random() * Math.max(1, cantidad * 0.3))
      const cantidadActual = cantidad - vendido

      // Fecha de fabricación: entre 3 y 18 meses antes del vencimiento
      const diasFabrica = Math.floor(Math.random() * 540 + 90)
      const fechaFab = sumarDias(fechaVenc, -diasFabrica)

      // Código de lote: L-{PERFIL}-{CUM_SIMPLE}-{LOTE#}
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

      totalLotes++

      // Log cada 30 lotes
      if (totalLotes % 30 === 0) {
        console.log(`  ⏳ ${totalLotes} lotes preparados...`)
      }
    }

    totalProductos++
  }

  // ── 5. Insertar lotes en la DB ────────────────────────
  console.log(`\n💾 Insertando ${lotesToCreate.length} lotes en la base de datos...`)

  // Insertar en lotes de 50 para mejor performance
  const BATCH = 50
  for (let i = 0; i < lotesToCreate.length; i += BATCH) {
    const batch = lotesToCreate.slice(i, i + BATCH)
    await prisma.lote.createMany({ data: batch })
  }
  console.log(`  ✅ ${lotesToCreate.length} lotes insertados correctamente`)

  // ── 6. Recalcular costo promedio de cada producto ─────
  console.log('\n💰 Recalculando costos promedio...')
  let prodsActualizados = 0

  for (const producto of productos) {
    const lotes = await prisma.lote.findMany({
      where: { productoId: producto.id, cantidadActual: { gt: 0 } },
      select: { cantidadActual: true, precioCompra: true },
    })

    const totalCantidad = lotes.reduce((s, l) => s + l.cantidadActual, 0)
    const totalCosto = lotes.reduce((s, l) => s + l.cantidadActual * Number(l.precioCompra), 0)
    const promedio = totalCantidad > 0
      ? Math.round(totalCosto / totalCantidad)
      : Math.round(Math.random() * 5000 + 500)

    await prisma.producto.update({
      where: { id: producto.id },
      data: { precioPromedio: promedio },
    })
    prodsActualizados++

    if (prodsActualizados % 20 === 0) {
      console.log(`  ⏳ ${prodsActualizados} productos actualizados...`)
    }
  }
  console.log(`  ✅ ${prodsActualizados} productos con costo promedio actualizado`)

  // ── 7. Resumen Final ──────────────────────────────────
  console.log('')
  console.log('═══════════════════════════════════════════════')
  console.log('  GENERACIÓN COMPLETADA')
  console.log('═══════════════════════════════════════════════')
  console.log(`  📊 Productos procesados:    ${totalProductos}`)
  console.log(`  📦 Lotes creados:           ${totalLotes}`)
  console.log(`  ❌ Errores:                  ${totalErrores}`)
  console.log(`  🏪 Sucursales utilizadas:   ${sucursales.map(s => s.nombre).join(', ')}`)
  console.log(`  🏭 Proveedores utilizados:  ${proveedores.map(p => p.nombre).join(', ')}`)
  console.log('')
  console.log('  💡 Los lotes incluyen fechas de vencimiento')
  console.log('     distribuidas en corto, mediano y largo plazo')
  console.log('     para simular un inventario farmacéutico real.')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('🔌 Conexión cerrada.')
  })
