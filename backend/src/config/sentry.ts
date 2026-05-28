// ══════════════════════════════════════════════════════════
//  Sentry — Error tracking para producción
//  Se activa solo si SENTRY_DSN está configurado
// ══════════════════════════════════════════════════════════
import * as Sentry from '@sentry/node'
import { env } from './env'
import { logger } from '../utils/logger'

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    logger.info('[Sentry] SENTRY_DSN no configurado — error tracking desactivado')
    return
  }

  Sentry.init({
    dsn,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0.0,
    enabled: env.NODE_ENV !== 'test',
    integrations: [
      // Captura errores no manejados en Express
      Sentry.expressIntegration(),
    ],
  })

  logger.info('[Sentry] Error tracking activado')
}

// Exportar Sentry para uso directo en handlers
export { Sentry }
