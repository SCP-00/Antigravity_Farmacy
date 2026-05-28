// ══════════════════════════════════════════════════════════
//  reportes.sse.ts — Ruta SSE para dashboard en vivo
//  GET /reportes/stream — Cliente se conecta y recibe
//  eventos del EventBus vía SSE.
// ══════════════════════════════════════════════════════════
import { Router, type Request, type Response } from 'express'
import { sseManager } from '../../services/sse.service'
import { autenticar, autorizar } from '../../middlewares/index'
import { Eventos } from '../../services/eventbus.service'

export const sseRouter: Router = Router()

// ── GET /stream — Conexión SSE ────────────────────────────
// El cliente puede especificar filtros de eventos opcionales
// via query param `eventos` (separados por coma).
//
// Ejemplo: GET /reportes/stream?eventos=dashboard:kpis-update,inventario:alerta
sseRouter.get('/stream', autenticar, autorizar('ADMINISTRADOR', 'FARMACEUTA'),
  (req: Request, res: Response) => {
    const eventosQuery = req.query.eventos as string | undefined
    const filtros = eventosQuery
      ? eventosQuery.split(',').filter(e => Object.values(Eventos).includes(e as any)) as any[]
      : undefined

    const clientId = `sse_${req.empleado!.id}_${Date.now()}`
    sseManager.agregar(clientId, res, filtros)
  }
)
