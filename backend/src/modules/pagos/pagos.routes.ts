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
import { autenticar, autenticarCliente } from '../../middlewares/index'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'

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

pagosRouter.post('/wompi/webhook', async (req: Request, res: Response) => {
  const evento = req.body
  const firma  = req.headers['x-event-checksum'] as string

  if (env.WOMPI_EVENTS_SECRET && firma) {
    const expected = crypto
      .createHmac('sha256', env.WOMPI_EVENTS_SECRET)
      .update(JSON.stringify(evento.data))
      .digest('hex')
    if (firma !== expected) return res.status(401).json({ error: 'Firma inválida' })
  }

  try {
    const tx = evento.data?.transaction
    if (!tx) return res.sendStatus(200)

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

pagosRouter.post('/stripe/webhook', async (req: Request, res: Response) => {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) return res.sendStatus(200)

  let evento: Stripe.Event
  try {
    evento = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'] as string, env.STRIPE_WEBHOOK_SECRET)
  } catch { return res.status(400).json({ error: 'Webhook signature inválida' }) }

  try {
    if (evento.type === 'payment_intent.succeeded') {
      const pi = evento.data.object as Stripe.PaymentIntent
      await prisma.pagoTransaccion.updateMany({ where: { referenciaExterna: pi.id }, data: { estado: 'APROBADO', respuestaPasarela: pi as any } })
      if (pi.metadata?.pedidoId) {
        await prisma.pedidoOnline.update({ where: { id: pi.metadata.pedidoId }, data: { estado: 'PAGO_CONFIRMADO' } })
      }
    }
    if (evento.type === 'payment_intent.payment_failed') {
      const pi = evento.data.object as Stripe.PaymentIntent
      await prisma.pagoTransaccion.updateMany({ where: { referenciaExterna: pi.id }, data: { estado: 'RECHAZADO', respuestaPasarela: pi as any } })
    }
    return res.sendStatus(200)
  } catch { return res.sendStatus(500) }
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

pagosRouter.post('/mercadopago/webhook', async (req: Request, res: Response) => {
  const { type, data } = req.body
  if (type === 'payment' && data?.id) {
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, { headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` } })
      const pago: any     = await response.json()
      const estadoMap: Record<string, string> = { approved: 'APROBADO', rejected: 'RECHAZADO', refunded: 'REEMBOLSADO' }
      const estadoPago  = estadoMap[pago.status] ?? 'PENDIENTE'
      const pedidoId    = pago.external_reference

      if (pedidoId) {
        await prisma.pagoTransaccion.updateMany({ where: { pedidoOnlineId: pedidoId }, data: { estado: estadoPago, respuestaPasarela: pago as any } })
        if (estadoPago === 'APROBADO') {
          await prisma.pedidoOnline.update({ where: { id: pedidoId }, data: { estado: 'PAGO_CONFIRMADO' } })
        }
      }
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
