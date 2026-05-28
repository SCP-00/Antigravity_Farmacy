// ══════════════════════════════════════════════════════════
//  FARMACY Backend — app.ts
//  Conecta todos los módulos reales, separados por dominio
// ══════════════════════════════════════════════════════════
import express, { Express, raw } from 'express'
import { Request, Response } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import passport from 'passport'
import { env } from './config/env'
import { configurePassport } from './config/passport'
import { manejarErrores, limitarPeticiones, loggerHttp } from './middlewares/index'
import { logger } from './utils/logger'

// ── Módulos ─────────────────────────────────────────────
import { authRouter } from './modules/auth/auth.routes'
import { authClienteRouter } from './modules/auth-cliente/authCliente.routes'
import { authClientePerfilRouter } from './modules/auth-cliente/authCliente.perfil.routes'
import { productosRouter } from './modules/productos/productos.routes'
import { categoriasRouter } from './modules/categorias/categorias.routes'
import { ventasRouter } from './modules/ventas/ventas.routes'
import { cajaRouter } from './modules/caja/caja.routes'
import { chatbotRouter } from './modules/chatbot/chatbot.routes'
import { pagosRouter } from './modules/pagos/pagos.routes'
import { imagenesRouter } from './modules/imagenes/imagenes.routes'

// ── Módulos separados en la refactorización ──────────────
import { lotesRouter } from './modules/lotes/lotes.routes'
import { inventarioRouter } from './modules/inventario/inventario.routes'
import { proveedoresRouter } from './modules/proveedores/proveedores.routes'
import { comprasRouter } from './modules/compras/compras.routes'
import { clientesAdminRouter } from './modules/clientes/clientes.admin.routes'
import { empleadosRouter } from './modules/empleados/empleados.routes'
import { sucursalesRouter } from './modules/sucursales/sucursales.routes'
import { reportesRouter } from './modules/reportes/reportes.routes'
import { sseRouter } from './modules/reportes/reportes.sse'
import { auditoriaRouter } from './modules/auditoria/auditoria.routes'

export function createApp(): Express {
  const app = express()
  const prefix = env.API_PREFIX   // '/api/v1'

  // ── Inicialización de Passport OAuth ──────────────────
  configurePassport()
  app.use(passport.initialize())

  // ── Seguridad y parsing ───────────────────────────────
  // crossOriginEmbedderPolicy: false — necesario para cargar recursos cross-origin
  // (imágenes, scripts de CDN) en la SPA de Vite que se sirve desde distinto origen.
  if (env.CSP_ENABLED === 'true') {
    app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://*.cloudinary.com', 'https://checkout.wompi.co', 'https://js.stripe.com', 'https://www.mercadopago.com.co'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://*.cloudinary.com', 'https://res.cloudinary.com', 'https://checkout.wompi.co', 'https://q.stripe.com'],
          connectSrc: ["'self'", 'https://sandbox.wompi.co', 'https://api.wompi.co', 'https://api.mercadopago.com', 'https://api.stripe.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          frameSrc: ["'self'", 'https://checkout.wompi.co', 'https://js.stripe.com', 'https://www.mercadopago.com.co'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }))
  } else {
    app.use(helmet({ crossOriginEmbedderPolicy: false }))
  }

  // CORS: en producción usar CORS_ORIGINS (separado por comas), en desarrollo localhost
  const corsOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']

  if (env.NODE_ENV === 'production' && !env.CORS_ORIGINS) {
    logger.warn('[CORS] CORS_ORIGINS no configurado. La API solo aceptara origenes de desarrollo.')
  }

  app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    maxAge: 86400,
  }))

  // Stripe webhook necesita raw body ANTES de express.json() para verificación HMAC
  app.use(`${prefix}/pagos/stripe/webhook`, raw({ type: 'application/json' }))

  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(loggerHttp)
  app.use(limitarPeticiones)

  // ── Health check ──────────────────────────────────────
  app.get(`${prefix}/health`, (_req: Request, res: Response) => {
    res.json({
      ok: true,
      app: env.FARMACIA_NOMBRE,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    })
  })

  // ── Rutas públicas / autenticación ───────────────────
  app.use(`${prefix}/auth`, authRouter)
  app.use(`${prefix}/clientes/auth`, authClienteRouter)
  app.use(`${prefix}/clientes/auth`, authClientePerfilRouter)
  app.use(`${prefix}/categorias`, categoriasRouter)
  app.use(`${prefix}/sucursales`, sucursalesRouter)
  app.use(`${prefix}/chatbot`, chatbotRouter)
  app.use(`${prefix}/imagenes`, imagenesRouter)

  // ── Productos: GET /buscar público, resto protegido ──
  app.use(`${prefix}/productos`, productosRouter)

  // ── Rutas protegidas (requieren Bearer token) ─────────
  app.use(`${prefix}/lotes`, lotesRouter)
  app.use(`${prefix}/inventario`, inventarioRouter)
  app.use(`${prefix}/ventas`, ventasRouter)
  app.use(`${prefix}/caja`, cajaRouter)
  app.use(`${prefix}/clientes`, clientesAdminRouter)
  app.use(`${prefix}/empleados`, empleadosRouter)
  app.use(`${prefix}/proveedores`, proveedoresRouter)
  app.use(`${prefix}/compras`, comprasRouter)
  app.use(`${prefix}/reportes`, reportesRouter)
  app.use(`${prefix}/reportes`, sseRouter)  // SSE endpoint
  app.use(`${prefix}/auditoria`, auditoriaRouter)
  app.use(`${prefix}/pagos`, pagosRouter)

  // ── 404 y manejador global de errores ─────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ ok: false, error: 'Ruta no encontrada' })
  }
)
  app.use(manejarErrores)

  return app
}