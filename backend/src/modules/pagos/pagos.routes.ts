// ══════════════════════════════════════════════════════════
//  MÓDULO PAGOS
//  POST /api/v1/pagos/wompi/crear
//  POST /api/v1/pagos/wompi/webhook
//  POST /api/v1/pagos/stripe/crear-intent
//  POST /api/v1/pagos/stripe/webhook
//  POST /api/v1/pagos/mercadopago/crear
//  POST /api/v1/pagos/mercadopago/webhook
//  POST /api/v1/pagos/efectivo/registrar   (solo empleados)
// ══════════════════════════════════════════════════════════
import { Router, Request, Response, raw } from 'express'
import Stripe from 'stripe'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import crypto from 'crypto'
import { prisma } from '../../config/database'
import { responder } from '../../utils/respuesta.utils'
import { autenticar, autenticarCliente, limitarWebhook, verificarIpPermitida } from '../../middlewares/index'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'

// ── Construir middleware de IP allowlist para webhooks ────
const webhookIpAllowlist = env.WEBHOOK_IP_ALLOWLIST
  ? env.WEBHOOK_IP_ALLOWLIST.split(',').map(s => s.trim()).filter(Boolean)
  : []
const verificarIpWebhook = verificarIpPermitida(webhookIpAllowlist)

// ── Anti-replay: caché en memoria de nonces/timestamps ────
const webhookNonces = new Set<string>()
const WEBHOOK_NONCE_TTL_MS = 5 * 60 * 1000 // 5 minutos

function limpiarNoncesViejos() {
  if (webhookNonces.size > 10000) webhookNonces.clear()
}
setInterval(limpiarNoncesViejos, 60_000)

// ── Idempotencia: caché de ids procesados ─────────────────
const idempotenciaCache = new Map<string, { estado: string; timestamp: number }>()
const IDEMPOTENCIA_TTL_MS = 24 * 60 * 60 * 1000 // 24h

function verificarIdempotencia(id: string): boolean {
  const existing = idempotenciaCache.get(id)
  if (existing && (Date.now() - existing.timestamp) < IDEMPOTENCIA_TTL_MS) {
    return true // ya procesado
  }
  idempotenciaCache.set(id, { estado: 'PROCESANDO', timestamp: Date.now() })
  return false
}

// Cleanup periódico de idempotenciaCache (cada 5 minutos)
function limpiarIdempotencia() {
  const now = Date.now()
  for (const [key, val] of idempotenciaCache) {
    if (now - val.timestamp > IDEMPOTENCIA_TTL_MS) idempotenciaCache.delete(key)
  }
}
setInterval(limpiarIdempotencia, 300_000)

// ── Anti-replay: validar timestamp del webhook ────────────
function validarTimestampWebhook(timestamp?: string | number, maxAgeMs = 300_000): boolean {
  if (!timestamp) return false
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  if (isNaN(ts)) return false
  const edad = Date.now() - (ts * 1000)
  return edad >= 0 && edad <= maxAgeMs
}

// ── Nonce: evitar replay attacks ──────────────────────────
function validarNonce(nonce?: string): boolean {
  if (!nonce || nonce.length < 8) return false
  if (webhookNonces.has(nonce)) return false
  webhookNonces.add(nonce)
  return true
}

export const pagosRouter: Router = Router()

// Clientes de pasarelas (opcionales según .env)
const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
  : null

const mpClient = env.MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN })
  : null

// ── WOMPI ─────────────────────────────────────────────────
pagosRouter.post('/wompi/crear', autenticarCliente, async (req: Request, res: Response) => {
  const { pedidoId, monto, moneda = 'COP' } = req.body

  if (!env.WOMPI_PRIVATE_KEY) {
    return responder.error(res, 'Wompi no configurado en este ambiente', 503)
  }

  try {
    const pedido = await prisma.pedidoOnline.findUnique({ where: { id: pedidoId } })
    if (!pedido) return responder.noEncontrado(res, 'Pedido')

    const referencia       = `FARMACY-${pedido.numero}-${Date.now()}`
    const montoEnCentavos  = Math.round(monto * 100)
    // La firma se genera con la llave de integridad (integrity_key) de Wompi
    const integrityKey     = env.WOMPI_INTEGRITY_SECRET || ''
    const firma            = integrityKey
      ? crypto
          .createHmac('sha256', integrityKey)
          .update(`${referencia}${montoEnCentavos}${moneda}${integrityKey}`)
          .digest('hex')
      : undefined

    await prisma.pagoTransaccion.upsert({
      where:  { pedidoOnlineId: pedidoId },
      update: { referenciaExterna: referencia, estado: 'PENDIENTE' },
      create: { pedidoOnlineId: pedidoId, pasarela: 'WOMPI', referenciaExterna: referencia, monto: pedido.total, moneda, estado: 'PENDIENTE' },
    })

    return responder.ok(res, {
      publicKey:     env.WOMPI_PUBLIC_KEY,
      currency:      moneda,
      amountInCents: montoEnCentavos,
      reference:     referencia,
      signature:     firma,
      redirectUrl:   `${env.FRONTEND_URL}/pago/confirmacion?pedido=${pedidoId}`,
      customerEmail: req.cliente!.email,
    }, 'Transacción Wompi iniciada')

  } catch (err) { return responder.serverError(res, err) }
})

pagosRouter.post('/wompi/webhook', verificarIpWebhook, limitarWebhook, async (req: Request, res: Response) => {
  const evento = req.body
  const firma  = req.headers['x-event-checksum'] as string
  const timestamp = req.headers['x-event-timestamp'] as string
  const nonce = req.headers['x-event-nonce'] as string

  // Anti-replay: validar timestamp (±5 min)
  if (timestamp && !validarTimestampWebhook(timestamp)) {
    logger.warn('[Wompi Webhook] Rechazado por timestamp inválido/expirado')
    return res.status(401).json({ error: 'Timestamp inválido o expirado' })
  }

  // Anti-replay: validar nonce único
  if (nonce && !validarNonce(nonce)) {
    logger.warn('[Wompi Webhook] Rechazado por nonce duplicado (posible replay)')
    return res.status(401).json({ error: 'Nonce duplicado' })
  }

  // Validar firma HMAC
  if (env.WOMPI_EVENTS_SECRET && firma) {
    const expected = crypto
      .createHmac('sha256', env.WOMPI_EVENTS_SECRET)
      .update(JSON.stringify(evento.data))
      .digest('hex')
    if (firma !== expected) {
      logger.warn('[Wompi Webhook] Firma HMAC inválida')
      return res.status(401).json({ error: 'Firma inválida' })
    }
  }

  try {
    const tx = evento.data?.transaction
    if (!tx) return res.sendStatus(200)

    // Idempotencia: verificar si ya procesamos esta transacción
    if (verificarIdempotencia(tx.id)) {
      logger.info(`[Wompi Webhook] Idempotencia: tx ${tx.id} ya procesada, omitiendo`)
      return res.sendStatus(200)
    }

    const estadoMap: Record<string, string> = { APPROVED: 'APROBADO', DECLINED: 'RECHAZADO', ERROR: 'RECHAZADO', VOIDED: 'REEMBOLSADO' }
    const estadoPago = estadoMap[tx.status] ?? 'PENDIENTE'

    await prisma.pagoTransaccion.updateMany({
      where: { referenciaExterna: tx.reference },
      data:  { estado: estadoPago, respuestaPasarela: evento },
    })

    if (estadoPago === 'APROBADO') {
      const pago = await prisma.pagoTransaccion.findFirst({ where: { referenciaExterna: tx.reference } })
      if (pago?.pedidoOnlineId) {
        await prisma.pedidoOnline.update({ where: { id: pago.pedidoOnlineId }, data: { estado: 'PAGO_CONFIRMADO' } })
      }
    }

    // Actualizar cache de idempotencia
    idempotenciaCache.set(tx.id, { estado: estadoPago, timestamp: Date.now() })

    logger.info(`[Wompi Webhook] ${tx.reference} → ${estadoPago}`)
    return res.sendStatus(200)
  } catch (err) { logger.error('[Wompi Webhook]', err); return res.sendStatus(500) }
})

// ── STRIPE ────────────────────────────────────────────────
pagosRouter.post('/stripe/crear-intent', autenticarCliente, async (req: Request, res: Response) => {
  if (!stripe) return responder.error(res, 'Stripe no configurado', 503)
  const { pedidoId } = req.body

  try {
    const pedido = await prisma.pedidoOnline.findUnique({ where: { id: pedidoId } })
    if (!pedido) return responder.noEncontrado(res, 'Pedido')

    const pi = await stripe.paymentIntents.create({
      amount:   Math.round(Number(pedido.total) * 100),
      currency: 'cop',
      metadata: { pedidoId, numeroPedido: String(pedido.numero) },
    })

    await prisma.pagoTransaccion.upsert({
      where:  { pedidoOnlineId: pedidoId },
      update: { referenciaExterna: pi.id, estado: 'PENDIENTE' },
      create: { pedidoOnlineId: pedidoId, pasarela: 'STRIPE', referenciaExterna: pi.id, monto: pedido.total, moneda: 'COP', estado: 'PENDIENTE' },
    })

    return responder.ok(res, { clientSecret: pi.client_secret })
  } catch (err) { return responder.serverError(res, err) }
})

pagosRouter.post('/stripe/webhook', verificarIpWebhook, limitarWebhook, async (req: Request, res: Response) => {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) return res.sendStatus(200)

  let evento: Stripe.Event
  try {
    evento = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'] as string, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    logger.warn('[Stripe Webhook] Firma inválida')
    return res.status(400).json({ error: 'Webhook signature inválida' })
  }

  try {
    // Idempotencia: Stripe envía idempotency key en header
    const idempotencyKey = req.headers['idempotency-key'] as string
    if (idempotencyKey && verificarIdempotencia(idempotencyKey)) {
      logger.info(`[Stripe Webhook] Idempotencia: key ${idempotencyKey} ya procesada`)
      return res.sendStatus(200)
    }

    if (evento.type === 'payment_intent.succeeded') {
      const pi = evento.data.object as Stripe.PaymentIntent
      await prisma.pagoTransaccion.updateMany({ where: { referenciaExterna: pi.id }, data: { estado: 'APROBADO', respuestaPasarela: pi as any } })
      if (pi.metadata?.pedidoId) {
        await prisma.pedidoOnline.update({ where: { id: pi.metadata.pedidoId }, data: { estado: 'PAGO_CONFIRMADO' } })
      }
      if (idempotencyKey) idempotenciaCache.set(idempotencyKey, { estado: 'APROBADO', timestamp: Date.now() })
    }
    if (evento.type === 'payment_intent.payment_failed') {
      const pi = evento.data.object as Stripe.PaymentIntent
      await prisma.pagoTransaccion.updateMany({ where: { referenciaExterna: pi.id }, data: { estado: 'RECHAZADO', respuestaPasarela: pi as any } })
      if (idempotencyKey) idempotenciaCache.set(idempotencyKey, { estado: 'RECHAZADO', timestamp: Date.now() })
    }
    return res.sendStatus(200)
  } catch {
    logger.error('[Stripe Webhook] Error procesando evento')
    return res.sendStatus(500)
  }
})

// ── MERCADO PAGO ──────────────────────────────────────────
pagosRouter.post('/mercadopago/crear', autenticarCliente, async (req: Request, res: Response) => {
  if (!mpClient) return responder.error(res, 'MercadoPago no configurado', 503)
  const { pedidoId, ventaId, items, monto, clienteEmail } = req.body

  try {
    // Soporta tanto pedidoOnline como venta directa desde checkout
    let email = clienteEmail
    let total = monto ? Number(monto) : 0
    let referenciaExterna = ventaId || pedidoId || `FARMACY-CHECKOUT-${Date.now()}`

    if (pedidoId) {
      const pedido = await prisma.pedidoOnline.findUnique({ where: { id: pedidoId }, include: { cliente: { select: { email: true } } } })
      if (!pedido) return responder.noEncontrado(res, 'Pedido')
      email = pedido.cliente.email
      total = Number(pedido.total)
    }

    const preference = new Preference(mpClient)
    const response = await preference.create({
      body: {
        items:              items.map((i: any) => ({ title: i.nombre, quantity: i.cantidad, unit_price: i.precioUnitario, currency_id: 'COP' })),
        payer:              { email },
        external_reference: referenciaExterna,
        back_urls: {
          success: `${env.FRONTEND_URL}/pago/confirmacion?ref=${referenciaExterna}&estado=aprobado`,
          failure: `${env.FRONTEND_URL}/pago/confirmacion?ref=${referenciaExterna}&estado=rechazado`,
          pending: `${env.FRONTEND_URL}/pago/confirmacion?ref=${referenciaExterna}&estado=pendiente`,
        },
        auto_return: 'approved',
      },
    })

    // Guardar transacción si tenemos pedidoId o ventaId
    if (pedidoId) {
      await prisma.pagoTransaccion.upsert({
        where:  { pedidoOnlineId: pedidoId },
        update: { referenciaExterna: response.id!, estado: 'PENDIENTE' },
        create: { pedidoOnlineId: pedidoId, pasarela: 'MERCADOPAGO', referenciaExterna: response.id!, monto: total, moneda: 'COP', estado: 'PENDIENTE' },
      })
    }

    return responder.ok(res, { preferenceId: response.id, initPoint: response.init_point })
  } catch (err) { return responder.serverError(res, err) }
})

pagosRouter.post('/mercadopago/webhook', verificarIpWebhook, limitarWebhook, async (req: Request, res: Response) => {
  const { type, data, action } = req.body

  // Validar firma HMAC (MercadoPago envía x-signature y x-request-id)
  const signature = req.headers['x-signature'] as string
  const requestId = req.headers['x-request-id'] as string

  if (requestId && verificarIdempotencia(requestId)) {
    logger.info(`[MercadoPago Webhook] Idempotencia: request ${requestId} ya procesado`)
    return res.sendStatus(200)
  }

  if (type === 'payment' && data?.id) {
    // Anti-replay: verificar si el payment id ya fue procesado
    const paymentId = String(data.id)
    if (verificarIdempotencia(`mp-${paymentId}`)) {
      logger.info(`[MercadoPago Webhook] Idempotencia: payment ${paymentId} ya procesado`)
      return res.sendStatus(200)
    }

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: {
          Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
          'X-Idempotency-Key': `wh-${paymentId}-${Date.now()}`,
        },
      })

      if (!response.ok) {
        logger.error(`[MercadoPago Webhook] Error fetching payment ${data.id}: ${response.status}`)
        return res.sendStatus(200)
      }

      const pago: any = await response.json()
      const estadoMap: Record<string, string> = { approved: 'APROBADO', rejected: 'RECHAZADO', refunded: 'REEMBOLSADO' }
      const estadoPago  = estadoMap[pago.status] ?? 'PENDIENTE'
      const pedidoId    = pago.external_reference

      if (pedidoId) {
        await prisma.pagoTransaccion.updateMany({ where: { pedidoOnlineId: pedidoId }, data: { estado: estadoPago, respuestaPasarela: pago as any } })
        if (estadoPago === 'APROBADO') {
          await prisma.pedidoOnline.update({ where: { id: pedidoId }, data: { estado: 'PAGO_CONFIRMADO' } })
        }
      }

      // Marcar como procesado
      if (requestId) idempotenciaCache.set(requestId, { estado: estadoPago, timestamp: Date.now() })
      idempotenciaCache.set(`mp-${paymentId}`, { estado: estadoPago, timestamp: Date.now() })

      logger.info(`[MercadoPago Webhook] Payment ${data.id} → ${estadoPago}`)
    } catch (err) { logger.error('[MercadoPago Webhook]', err) }
  }
  return res.sendStatus(200)
})

// ── EFECTIVO (POS) ────────────────────────────────────────
pagosRouter.post('/efectivo/registrar', autenticar, async (req: Request, res: Response) => {
  const { ventaId, monto } = req.body
  try {
    const venta = await prisma.venta.findUnique({ where: { id: ventaId } })
    if (!venta) return responder.noEncontrado(res, 'Venta')

    await prisma.pagoTransaccion.create({
      data: {
        ventaId,
        pasarela:          'EFECTIVO',
        referenciaExterna: `CASH-${ventaId}-${Date.now()}`,
        monto:             venta.total,
        moneda:            'COP',
        estado:            'APROBADO',
        respuestaPasarela: { metodo: 'EFECTIVO', montoRecibido: monto },
      },
    })
    return responder.creado(res, null, 'Pago en efectivo registrado')
  } catch (err) { return responder.serverError(res, err) }
})
