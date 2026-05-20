// ══════════════════════════════════════════════════════════
//  FARMACY Backend — app.ts  (versión corregida)
//  Conecta todos los módulos reales, sin datos mock
// ══════════════════════════════════════════════════════════
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { env } from './config/env'
import { manejarErrores, limitarPeticiones, loggerHttp } from './middlewares/index'

// ── Módulos con implementación propia ─────────────────────
import { authRouter }        from './modules/auth/auth.routes'
import { authClienteRouter } from './modules/auth-cliente/authCliente.routes'
import { authClientePerfilRouter } from './modules/auth-cliente/authCliente.perfil.routes'
import { productosRouter }   from './modules/productos/productos.routes'
import { categoriasRouter }  from './modules/categorias/categorias.routes'
import { ventasRouter }      from './modules/ventas/ventas.routes'
import { cajaRouter }        from './modules/caja/caja.routes'
import { chatbotRouter }     from './modules/chatbot/chatbot.routes'
import { pagosRouter }       from './modules/pagos/pagos.routes'
import { imagenesRouter }    from './modules/imagenes/imagenes.routes'

// ── Módulos centralizados en inventario.routes.ts ─────────
// (lotesRouter, inventarioRouter, proveedoresRouter, comprasRouter,
//  clientesAdminRouter, empleadosRouter, sucursalesRouter, reportesRouter)
import {
  lotesRouter,
  inventarioRouter,
  proveedoresRouter,
  comprasRouter,
  clientesAdminRouter,
  empleadosRouter,
  sucursalesRouter,
  reportesRouter,
} from './modules/inventario/inventario.routes'

export function createApp() {
  const app = express()
  const prefix = env.API_PREFIX   // '/api/v1'

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
  app.get(`${prefix}/health`, (_req, res) => {
    res.json({
      ok: true,
      app: env.FARMACIA_NOMBRE,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    })
  })

  // ── Rutas públicas / autenticación ───────────────────
  app.use(`${prefix}/auth`,          authRouter)          // POST /login /refresh /me /logout
  app.use(`${prefix}/clientes/auth`, authClienteRouter)   // POST /registro /login /me ...
  app.use(`${prefix}/clientes/auth`, authClientePerfilRouter) // GET/PATCH /me, GET /favoritos
  app.use(`${prefix}/categorias`,    categoriasRouter)    // GET / (público) POST PATCH (admin)
  app.use(`${prefix}/sucursales`,    sucursalesRouter)    // GET / (público) POST PATCH (admin)
  app.use(`${prefix}/chatbot`,       chatbotRouter)       // POST / GET /horario
  app.use(`${prefix}/imagenes`,      imagenesRouter)      // POST /subir (Cloudinary)

  // ── Productos: GET /buscar público, resto protegido ──
  app.use(`${prefix}/productos`,     productosRouter)

  // ── Rutas protegidas (requieren Bearer token) ─────────
  app.use(`${prefix}/lotes`,         lotesRouter)         // CRUD lotes
  app.use(`${prefix}/inventario`,    inventarioRouter)    // ajustes, movimientos, alertas
  app.use(`${prefix}/ventas`,        ventasRouter)        // POS + dashboard
  app.use(`${prefix}/caja`,          cajaRouter)          // apertura, cierre, historial
  app.use(`${prefix}/clientes`,      clientesAdminRouter) // panel admin de clientes
  app.use(`${prefix}/empleados`,     empleadosRouter)     // CRUD empleados
  app.use(`${prefix}/proveedores`,   proveedoresRouter)   // CRUD proveedores
  app.use(`${prefix}/compras`,       comprasRouter)       // órdenes de compra
  app.use(`${prefix}/reportes`,      reportesRouter)      // ventas, inventario
  app.use(`${prefix}/pagos`,         pagosRouter)         // Wompi / Stripe / MercadoPago

  // ── 404 y manejador global de errores ─────────────────
  app.use((_req, res) => {
    res.status(404).json({ ok: false, error: 'Ruta no encontrada' })
  })
  app.use(manejarErrores)

  return app
}
