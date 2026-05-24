// ═══════════════════════════════════════════════════════════
//  Importación INVIMA → Productos (Prisma)
//  Lee el archivo INVIMA-MINI.csv (subconjunto académico) y
//  upserta cada registro como un Producto en la base de datos.
//
//  USO:
//    cd backend && npx ts-node ../database/scripts/importar-invima.ts
//
//  ⚠️  Primero asegúrate de que existan categorías en la DB.
//  ⚠️  El CSV debe estar en database/seeds/INVIMA-MINI.csv
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import { createReadStream, existsSync } from 'fs'
import { parse } from 'csv-parse'
import path from 'path'

const prisma = new PrismaClient({
  log: ['error'],
})

// ── Configuración ─────────────────────────────────────────
// Usa el mini-CSV académico en lugar del archivo masivo de 73MB
const CSV_PATH = path.resolve(__dirname, '..', '..', 'database', 'seeds', 'INVIMA-MINI.csv')
const BATCH_SIZE = 500
const CATEGORIA_DEFAULT_ID = 1 // ID de categoría por defecto (ej: Antialérgicos)

// ── Mapeo de columnas del CSV ─────────────────────────────
// Basado en el encabezado real de INVIMA.csv:
// expediente,producto,titular,registrosanitario,fechaexpedicion,fechavencimiento,
// estadoregistro,expedientecum,consecutivocum,cantidadcum,descripcioncomercial,
// estadocum,fechaactivo,fechainactivo,muestramedica,unidad,atc,descripcionatc,
// viaadministracion,concentracion,principioactivo,unidadmedida,cantidad,
// unidadreferencia,formafarmaceutica,nombrerol,tiporol,modalidad,IUM

interface CsvRecord {
  expediente: string
  producto: string
  titular: string
  registrosanitario: string
  fechaexpedicion: string
  fechavencimiento: string
  estadoregistro: string
  expedientecum: string
  consecutivocum: string
  cantidadcum: string
  descripcioncomercial: string
  estadocum: string
  fechaactivo: string
  fechainactivo: string
  muestramedica: string
  unidad: string
  atc: string
  descripcionatc: string
  viaadministracion: string
  concentracion: string
  principioactivo: string
  unidadmedida: string
  cantidad: string
  unidadreferencia: string
  formafarmaceutica: string
  nombrerol: string
  tiporol: string
  modalidad: string
  IUM: string
  preciocompra: string
  precioventa: string
}

// ── Helpers ───────────────────────────────────────────────
const parseFecha = (f: string): Date | null => {
  if (!f || f.trim() === '') return null
  const d = new Date(f.trim())
  return isNaN(d.getTime()) ? null : d
}

const parseBool = (v: string): boolean => {
  return v?.trim().toLowerCase() === 'si'
}

const nullIfEmpty = (v: string): string | null => {
  return v?.trim() || null
}

const generarSlug = (nombre: string, cum: string): string => {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + cum
}

// ── Contadores ────────────────────────────────────────────
let totalLeidos = 0
let totalUpserted = 0
let totalErrores = 0
let batchBuffer: any[] = []

// ── Función principal ─────────────────────────────────────
async function main() {
  console.log('')
  console.log('═══════════════════════════════════════════════')
  console.log('  IMPORTACIÓN MASIVA INVIMA')
  console.log('═══════════════════════════════════════════════')
  console.log('')

  if (!existsSync(CSV_PATH)) {
    console.error(`❌ No se encontró el archivo: ${CSV_PATH}`)
    console.error('   Asegúrate de que INVIMA.csv esté en la raíz del proyecto.')
    process.exit(1)
  }

  // Verificar categorías existentes
  const categoriaCount = await prisma.categoria.count()
  if (categoriaCount === 0) {
    console.error('❌ No hay categorías en la base de datos.')
    console.error('   Ejecuta primero los seeds: cd backend && npm run db:seed')
    console.error('   Luego asigna la categoría deseada editando CATEGORIA_DEFAULT_ID en este script.')
    process.exit(1)
  }
  console.log(`✅ Categorías encontradas: ${categoriaCount} (usando ID ${CATEGORIA_DEFAULT_ID})`)
  console.log('')

  console.log(`📂 Leyendo: ${CSV_PATH}`)
  console.log('')

  // ── Parseador con soporte BOM ────────────────────────────
  const parser = createReadStream(CSV_PATH, { encoding: 'utf-8' }).pipe(
    parse({
      // Maneja BOM (Byte Order Mark) que añade Excel/Windows al CSV
      columns: (headers: string[]) =>
        headers.map(h => h.replace(/^\ufeff/, '').trim()),
      delimiter: ',',
      quote: '"',
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    })
  )

  // ── Procesar cada fila ──────────────────────────────────
  for await (const row of parser) {
    totalLeidos++

    try {
      const record = row as unknown as CsvRecord

      // Construir CUM: expedientecum + "-" + consecutivocum
      const cum = `${record.expedientecum || '0'}-${record.consecutivocum || '0'}`

      // Determinar requiereRx basado en modalidad o si es control especial
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
        precioPromedio: Math.round((parseFloat(record.preciocompra) || 0) * 1.10), // 10% sobre compra para cubrir costos operativos
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

      batchBuffer.push(productoData)

      // Procesar en lotes
      if (batchBuffer.length >= BATCH_SIZE) {
        await procesarLote()
      }

      // Log cada 10,000 registros
      if (totalLeidos % 10000 === 0) {
        const pct = ((totalLeidos / 158665) * 100).toFixed(1)
        console.log(`  ⏳ ${totalLeidos.toLocaleString()} registros leídos (${pct}%) — ${totalUpserted} insertados`)
      }
    } catch (rowErr) {
      totalErrores++
      if (totalErrores <= 10) {
        console.error(`  ⚠️  Error en fila ${totalLeidos}:`, (rowErr as Error).message)
      }
    }
  }

  // Procesar el lote restante
  if (batchBuffer.length > 0) {
    await procesarLote()
  }

  // ── Resumen Final ───────────────────────────────────────
  console.log('')
  console.log('═══════════════════════════════════════════════')
  console.log('  IMPORTACIÓN COMPLETADA')
  console.log('═══════════════════════════════════════════════')
  console.log(`  📊 Total leídos:     ${totalLeidos.toLocaleString()}`)
  console.log(`  ✅ Total insertados:  ${totalUpserted.toLocaleString()}`)
  console.log(`  ❌ Total errores:     ${totalErrores}`)
  console.log('')
  console.log('  ⚠️  NOTA:')
  console.log('     - Los precios se importaron del mini-CSV (INVIMA-MINI.csv)')
  console.log('     - categoriaId por defecto (configurable en el script)')
  console.log('     - Sin lotes asociados (debes crearlos manualmente)')
  console.log('')
}

async function procesarLote() {
  if (batchBuffer.length === 0) return

  const lote = [...batchBuffer]
  batchBuffer = []

  for (const producto of lote) {
    try {
      await prisma.producto.upsert({
        where: { cum: producto.cum },
        update: producto,
        create: producto,
      })
      totalUpserted++
    } catch (err: any) {
      totalErrores++
      if (totalErrores <= 10) {
        console.error(`  ⚠️  Error al upsertar CUM ${producto.cum}:`, err.message?.substring(0, 100))
      }
    }
  }
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
