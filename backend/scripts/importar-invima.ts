// ═══════════════════════════════════════════════════════════
//  Runner: Importación INVIMA
//  Ejecuta la importación de productos desde el mini-CSV.
//  Se ejecuta desde backend/ para que ts-node resuelva bien
//  las dependencias.
//
//  USO:
//    cd backend && npx ts-node scripts/importar-invima.ts
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import { createReadStream, existsSync } from 'fs'
import { parse } from 'csv-parse'
import path from 'path'

const prisma = new PrismaClient({ log: ['error'] })

// ── Configuración ─────────────────────────────────────────
const CSV_PATH = path.resolve(__dirname, '..', '..', 'database', 'seeds', 'INVIMA-MINI.csv')
const CATEGORIA_DEFAULT_ID = 1

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

const parseFecha = (f: string): Date | null => {
  if (!f || f.trim() === '') return null
  const d = new Date(f.trim())
  return isNaN(d.getTime()) ? null : d
}

const parseBool = (v: string): boolean => v?.trim().toLowerCase() === 'si'

const nullIfEmpty = (v: string): string | null => v?.trim() || null

const generarSlug = (nombre: string, cum: string): string =>
  nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + cum

let totalLeidos = 0
let totalInsertados = 0
let totalErrores = 0

async function main() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('  IMPORTACIÓN INVIMA — MINI CSV')
  console.log('═══════════════════════════════════════════════\n')

  if (!existsSync(CSV_PATH)) {
    console.error(`❌ No se encontró: ${CSV_PATH}`)
    process.exit(1)
  }

  const catCount = await prisma.categoria.count()
  if (catCount === 0) {
    console.error('❌ No hay categorías. Ejecuta: npm run db:seed')
    process.exit(1)
  }
  console.log(`✅ ${catCount} categorías disponibles\n`)

  console.log(`📂 Leyendo: ${CSV_PATH}\n`)

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
    totalLeidos++
    const record = row as unknown as CsvRecord

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
      totalInsertados++
    } catch (err: any) {
      totalErrores++
      if (totalErrores <= 5) {
        console.error(`  ⚠️  CUM ${record.expedientecum}-${record.consecutivocum}: ${err.message?.substring(0, 120)}`)
      }
    }

    if (totalLeidos % 20 === 0) {
      console.log(`  ⏳ ${totalLeidos} registros... (${totalInsertados} insertados)`)
    }
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log('  IMPORTACIÓN COMPLETADA')
  console.log('═══════════════════════════════════════════════')
  console.log(`  📊 Leídos:       ${totalLeidos}`)
  console.log(`  ✅ Insertados:   ${totalInsertados}`)
  console.log(`  ❌ Errores:      ${totalErrores}`)
  console.log('')
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); console.log('🔌 Conexión cerrada.') })
