import cron from 'node-cron'
import { prisma } from '../config/database'
import { sendEmail, emailTemplates } from '../config/mailer'
import { logger } from '../utils/logger'

// Cada día a las 7:00 AM hora Colombia
const CRON_HORARIO = '0 7 * * *'

export function iniciarJobAlertas(): void {
  cron.schedule(
    CRON_HORARIO,
    async () => {
      logger.info('[Job Alertas] Iniciando verificación diaria de inventario...')
      await verificarVencimientos()
      await verificarStockMinimo()
    },
    { timezone: 'America/Bogota' }
  )

  logger.info('[Job Alertas] Programado — todos los días a las 7:00 AM')
}

// ── Verifica lotes próximos a vencer ──────────────────────
async function verificarVencimientos(): Promise<void> {
  const hoy       = new Date()
  const en30Dias  = new Date(hoy)
  en30Dias.setDate(hoy.getDate() + 30)

  try {
    const lotes = await prisma.lote.findMany({
      where: {
        cantidadActual: { gt: 0 },
        fechaVencimiento: {
          gte: hoy,
          lte: en30Dias,
        },
      },
      include: {
        producto:  { select: { nombre: true, concentracion: true } },
        sucursal:  { select: { nombre: true } },
      },
    })

    if (lotes.length === 0) {
      logger.info('[Job Alertas] Sin lotes próximos a vencer')
      return
    }

    // Crear alertas en la BD
    for (const lote of lotes) {
      const diasRestantes = Math.ceil(
        (lote.fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
      )

      await prisma.alertaInventario.upsert({
        where: { id: lote.id },
        update: { leida: false },
        create: {
          loteId: lote.id,
          tipo: 'PROXIMO_VENCER',
          mensaje: `${lote.producto.nombre} ${lote.producto.concentracion ?? ''} — Lote ${lote.codigoLote} vence en ${diasRestantes} días (${lote.sucursal.nombre})`,
        },
      }).catch(() => {})
    }

    logger.warn(`[Job Alertas] ${lotes.length} lotes próximos a vencer detectados`)

    // Notificar al administrador por email
    const admins = await prisma.empleado.findMany({
      where: { rol: 'ADMINISTRADOR', activo: true },
      select: { email: true, nombre: true },
    })

    const resumen = lotes
      .map(l => {
        const dias = Math.ceil(
          (l.fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
        )
        return `• ${l.producto.nombre} ${l.producto.concentracion ?? ''} — Lote ${l.codigoLote} — Vence en ${dias} días — ${l.sucursal.nombre}`
      })
      .join('\n')

    for (const admin of admins) {
      sendEmail({
        to: admin.email,
        subject: `⚠️ Farmacy: ${lotes.length} lotes próximos a vencer`,
        html: `<pre style="font-family:sans-serif;padding:20px">${resumen}</pre>`,
      })
    }

  } catch (err) {
    logger.error('[Job Alertas] Error verificando vencimientos:', err)
  }
}

// ── Verifica stock mínimo ─────────────────────────────────
async function verificarStockMinimo(): Promise<void> {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      include: {
        lotes: {
          where: {
            cantidadActual: { gt: 0 },
            fechaVencimiento: { gt: new Date() },
          },
          select: { cantidadActual: true, sucursalId: true },
          include: { sucursal: { select: { nombre: true } } },
        },
      },
    })

    const criticos = productos.filter(p => {
      const stock = p.lotes.reduce((s, l) => s + l.cantidadActual, 0)
      return stock <= p.stockMinimo
    })

    if (criticos.length === 0) {
      logger.info('[Job Alertas] Sin productos en stock crítico')
      return
    }

    for (const prod of criticos) {
      const stock = prod.lotes.reduce((s, l) => s + l.cantidadActual, 0)
      await prisma.alertaInventario.create({
        data: {
          tipo: 'STOCK_MINIMO',
          mensaje: `${prod.nombre} ${prod.concentracion ?? ''} — Stock actual: ${stock} (mínimo: ${prod.stockMinimo})`,
        },
      }).catch(() => {})
    }

    logger.warn(`[Job Alertas] ${criticos.length} productos en stock crítico`)

  } catch (err) {
    logger.error('[Job Alertas] Error verificando stock mínimo:', err)
  }
}
