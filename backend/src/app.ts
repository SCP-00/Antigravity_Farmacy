// ══════════════════════════════════════════════════════════
//  FARMACY Backend — app.ts
//  Conecta todos los módulos reales, separados por dominio
// ══════════════════════════════════════════════════════════
import express, { Express } from 'express'
import { Request, Response } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import passport from 'passport'
import { env } from './config/env'
import { configurePassport } from './config/passport'
import { manejarErrores, limitarPeticiones, loggerHttp } from './middlewares/index'

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

export function createApp(): Express {
  const app = express()
  const prefix = env.API_PREFIX   // '/api/v1'

  // ── Inicialización de Passport OAuth ──────────────────
  configurePassport()
  app.use(passport.initialize())

  // ── Seguridad y parsing ───────────────────────────────
  app.use(helmet({ crossOriginEmbedderPolicy: false }))
  app.use(cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }))
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
  app.use(`${prefix}/pagos`, pagosRouter)

  // ── 404 y manejador global de errores ─────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ ok: false, error: 'Ruta no encontrada' })
  }
)
  app.use(manejarErrores)

  return app
}