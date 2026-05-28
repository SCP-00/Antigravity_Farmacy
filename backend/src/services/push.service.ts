// ══════════════════════════════════════════════════════════
//  push.service.ts — Notificaciones Push (Web Push API)
//  VAPID: Voluntarily Application Server Identification
// ══════════════════════════════════════════════════════════
import webpush, { PushSubscription as WebPushSubscription } from 'web-push'
import { env } from '../config/env'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'

// ── Inicializar VAPID ────────────────────────────────────
export function initVapid(): void {
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      `mailto:${env.VAPID_EMAIL}`,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    )
    logger.info('[Push] VAPID configurado desde variables de entorno')
  } else {
    logger.warn('[Push] VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY no configurados. Push deshabilitado.')
  }
}

/** Verificar si push está habilitado */
export function isPushEnabled(): boolean {
  return !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY)
}

/** Obtener clave pública VAPID para el frontend */
export function getVapidPublicKey(): string | null {
  return env.VAPID_PUBLIC_KEY || null
}

// ── Suscripciones en BD ──────────────────────────────────

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/** Guardar suscripción de un empleado */
export async function guardarSuscripcion(
  empleadoId: string,
  subscription: PushSubscriptionData,
  userAgent?: string,
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: {
      empleadoId_endpoint: {
        empleadoId,
        endpoint: subscription.endpoint,
      },
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent || null,
    },
    create: {
      empleadoId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent || null,
    },
  })
  logger.debug(`[Push] Suscripción guardada para empleado ${empleadoId}`)
}

/** Eliminar suscripción de un empleado */
export async function eliminarSuscripcion(
  empleadoId: string,
  endpoint: string,
): Promise<void> {
  await prisma.pushSubscription.deleteMany({
    where: { empleadoId, endpoint },
  })
  logger.debug(`[Push] Suscripción eliminada para empleado ${empleadoId}`)
}

/** Eliminar todas las suscripciones de un empleado */
export async function eliminarTodasSuscripciones(empleadoId: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({
    where: { empleadoId },
  })
  logger.debug(`[Push] Todas las suscripciones eliminadas para empleado ${empleadoId}`)
}

// ── Envío de notificaciones ──────────────────────────────

export interface PushNotificacion {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, unknown>
  tag?: string
  actions?: Array<{ action: string; title: string }>
}

/** Enviar push a todos los administradores */
export async function enviarAAdministradores(notificacion: PushNotificacion): Promise<void> {
  if (!isPushEnabled()) return

  const suscripciones = await prisma.pushSubscription.findMany({
    where: {
      empleado: {
        rol: 'ADMINISTRADOR',
        activo: true,
      },
    },
  })

  if (suscripciones.length === 0) return

  const payload = JSON.stringify(notificacion)
  const results = await Promise.allSettled(
    suscripciones.map((sub: { endpoint: string; p256dh: string; auth: string; id: string }) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        } as WebPushSubscription,
        payload,
      ).catch(async (err: any) => {
        // Si el endpoint ya no es válido (410 Gone), eliminar
        if (err.statusCode === 410 || err.statusCode === 404) {
          logger.warn(`[Push] Endpoint inválido, eliminando: ${sub.endpoint.slice(0, 50)}...`)
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
        throw err
      }),
    ),
  )

  const sent = results.filter((r: PromiseSettledResult<any>) => r.status === 'fulfilled').length
  const failed = results.filter((r: PromiseSettledResult<any>) => r.status === 'rejected').length
  if (failed > 0) {
    logger.warn(`[Push] Enviadas: ${sent}, fallaron: ${failed}`)
  }
}

/** Enviar push a empleados de una sucursal específica */
export async function enviarASucursal(
  sucursalId: number,
  notificacion: PushNotificacion,
): Promise<void> {
  if (!isPushEnabled()) return

  const suscripciones = await prisma.pushSubscription.findMany({
    where: {
      empleado: {
        sucursalId,
        activo: true,
      },
    },
  })

  if (suscripciones.length === 0) return

  const payload = JSON.stringify(notificacion)
  await Promise.allSettled(
    suscripciones.map((sub: { endpoint: string; p256dh: string; auth: string; id: string }) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } } as WebPushSubscription,
        payload,
      ).catch(async (err: any) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      }),
    ),
  )
}

/** Enviar notificación de alerta de inventario */
export async function enviarAlertaInventario(
  tipo: string,
  mensaje: string,
  productoNombre?: string,
): Promise<void> {
  const notificacion: PushNotificacion = {
    title: `🚨 ${productoNombre || 'Alerta de inventario'}`,
    body: mensaje,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    tag: `inventario-${tipo}-${Date.now()}`,
    data: {
      url: '/admin/inventario/alertas',
      tipo,
      fecha: new Date().toISOString(),
    },
  }

  await enviarAAdministradores(notificacion)
}
