// ══════════════════════════════════════════════════════════
//  push.routes.ts — Suscripciones Push (Web Push API)
//  POST   /push/subscribir        — Guardar suscripción
//  DELETE /push/subscribir        — Eliminar suscripción
//  GET    /push/vapid-public-key  — Clave pública VAPID
// ══════════════════════════════════════════════════════════
import { Router, Request, Response } from 'express'
import { autenticar } from '../../middlewares/index'
import { guardarSuscripcion, eliminarSuscripcion, eliminarTodasSuscripciones, getVapidPublicKey } from '../../services/push.service'
import { logger } from '../../utils/logger'

export const pushRouter: ReturnType<typeof Router> = Router()

// Todas las rutas requieren autenticación
pushRouter.use(autenticar)

// ── GET /vapid-public-key ─────────────────────────────────
pushRouter.get('/vapid-public-key', (_req: Request, res: Response) => {
  const key = getVapidPublicKey()
  if (!key) {
    return res.status(404).json({ ok: false, error: 'Push notifications not configured' })
  }
  res.json({ ok: true, data: { publicKey: key } })
})

// ── POST /subscribir ──────────────────────────────────────
interface SubscribeBody {
  subscription: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }
  userAgent?: string
}

pushRouter.post('/subscribir', async (req: Request, res: Response) => {
  try {
    const empleadoId = (req as any).usuario?.id
    if (!empleadoId) {
      return res.status(401).json({ ok: false, error: 'No autenticado' })
    }

    const { subscription, userAgent } = req.body as SubscribeBody

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ ok: false, error: 'Suscripción inválida: endpoint, p256dh y auth requeridos' })
    }

    await guardarSuscripcion(empleadoId, subscription, userAgent)
    res.json({ ok: true, message: 'Suscripción guardada' })
  } catch (err) {
    logger.error('[Push] Error al guardar suscripción:', err)
    res.status(500).json({ ok: false, error: 'Error al guardar suscripción' })
  }
})

// ── DELETE /subscribir ────────────────────────────────────
interface UnsubscribeBody {
  endpoint: string
}

pushRouter.delete('/subscribir', async (req: Request, res: Response) => {
  try {
    const empleadoId = (req as any).usuario?.id
    if (!empleadoId) {
      return res.status(401).json({ ok: false, error: 'No autenticado' })
    }

    const { endpoint } = req.body as UnsubscribeBody

    if (endpoint) {
      await eliminarSuscripcion(empleadoId, endpoint)
    } else {
      await eliminarTodasSuscripciones(empleadoId)
    }

    res.json({ ok: true, message: 'Suscripción(es) eliminada(s)' })
  } catch (err) {
    logger.error('[Push] Error al eliminar suscripción:', err)
    res.status(500).json({ ok: false, error: 'Error al eliminar suscripción' })
  }
})
