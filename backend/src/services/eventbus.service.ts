// ══════════════════════════════════════════════════════════
//  eventbus.service.ts — EventBus para eventos de dominio
//  Patrón: EventEmitter síncrono + cola de distribución a
//  SSE y WebSocket.
// ══════════════════════════════════════════════════════════
import { EventEmitter } from 'events'
import { logger } from '../utils/logger'

// ── Tipos de eventos del dominio ──────────────────────────
export const Eventos = {
  // Dashboard / KPIs
  DASHBOARD_KPIS_UPDATE:   'dashboard:kpis-update',
  INVENTARIO_ALERTA:       'inventario:alerta',
  
  // Caja / POS
  CAJA_ABIERTA:            'caja:abierta',
  CAJA_CERRADA:            'caja:cerrada',
  VENTA_REGISTRADA:        'venta:registrada',
  
  // Inventario
  STOCK_CRITICO:           'inventario:stock-critico',
  STOCK_AJUSTADO:          'inventario:stock-ajustado',
  
  // Jobs
  JOB_COMPLETADO:          'job:completado',
  JOB_ERROR:               'job:error',
} as const

export type EventoDominio = (typeof Eventos)[keyof typeof Eventos]

export interface PayloadEvento {
  tipo: EventoDominio
  data: Record<string, unknown>
  timestamp: Date
}

// ── EventBus (singleton) ──────────────────────────────────
class EventBus {
  private emitter = new EventEmitter()
  // Límite de listeners para evitar memory leaks (default 10, subimos a 30)
  private static MAX_LISTENERS = 30

  constructor() {
    this.emitter.setMaxListeners(EventBus.MAX_LISTENERS)
  }

  /** Emitir un evento de dominio */
  emit(tipo: EventoDominio, data: Record<string, unknown>): void {
    const payload: PayloadEvento = { tipo, data, timestamp: new Date() }
    logger.debug(`[EventBus] 📡 ${tipo}`, { data: Object.keys(data) })
    this.emitter.emit(tipo, payload)
  }

  /** Suscribirse a un tipo de evento */
  on(tipo: EventoDominio, listener: (payload: PayloadEvento) => void): () => void {
    this.emitter.on(tipo, listener)
    return () => { this.emitter.off(tipo, listener) }
  }

  /** Suscripción única (auto-removida tras primer evento) */
  once(tipo: EventoDominio, listener: (payload: PayloadEvento) => void): void {
    this.emitter.once(tipo, listener)
  }

  /** Remover todos los listeners de un tipo */
  removeAll(tipo: EventoDominio): void {
    this.emitter.removeAllListeners(tipo)
  }

  /** Estadísticas de listeners activos */
  stats(): Record<string, number> {
    const eventos = Object.values(Eventos)
    const stats: Record<string, number> = {}
    for (const e of eventos) {
      const count = this.emitter.listenerCount(e)
      if (count > 0) stats[e] = count
    }
    return stats
  }
}

export const eventBus = new EventBus()
