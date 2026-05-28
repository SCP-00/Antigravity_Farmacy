// ══════════════════════════════════════════════════════════
//  Swagger — Documentación interactiva de la API
//  Endpoint: GET /api/v1/docs
// ══════════════════════════════════════════════════════════
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'
import { env } from './env'
import { logger } from '../utils/logger'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Farmacy API',
      version: '1.0.0',
      description: `API REST del Sistema de Gestión Farmacéutica Farmacy.
        
## Features
- Gestión de inventario FEFO (First Expired, First Out)
- Punto de venta (POS) con escáner de códigos
- Pasarelas de pago: Wompi, Stripe, MercadoPago, Efectivo
- Chatbot FarmaBot con verificación de interacciones medicamentosas
- Notificaciones push y tiempo real (SSE + WebSocket)
- Programa de fidelidad con puntos
- Cumplimiento INVIMA (CUM, Registro sanitario, muestras médicas)
- Auditoría y trazabilidad de cambios`,
      contact: {
        name: 'Farmacy',
        url: 'https://farmacy.co',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT de empleado (admin panel)',
        },
        bearerCliente: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT de cliente (tienda B2C)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Mensaje de error' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth Admin', description: 'Autenticación de empleados (panel admin)' },
      { name: 'Auth Cliente', description: 'Autenticación de clientes (tienda B2C)' },
      { name: 'Productos', description: 'Catálogo de productos INVIMA' },
      { name: 'Categorías', description: 'Categorías de productos' },
      { name: 'Sucursales', description: 'Sucursales físicas' },
      { name: 'Inventario', description: 'Lotes, movimientos y alertas FEFO' },
      { name: 'Ventas', description: 'Registro y consulta de ventas' },
      { name: 'Caja', description: 'Apertura/cierre de caja POS' },
      { name: 'Compras', description: 'Órdenes de compra y recepción' },
      { name: 'Proveedores', description: 'Gestión de proveedores' },
      { name: 'Clientes', description: 'Gestión de clientes (admin)' },
      { name: 'Empleados', description: 'Gestión de empleados' },
      { name: 'Reportes', description: 'Reportes y exportación CSV' },
      { name: 'Pagos', description: 'Pasarelas de pago (Wompi, Stripe, MP, Efectivo)' },
      { name: 'Chatbot', description: 'FarmaBot — asistente virtual' },
      { name: 'Auditoría', description: 'Logs de actividad e historial de cambios' },
      { name: 'Push', description: 'Notificaciones push Web Push API' },
    ],
  },
  apis: [
    './src/modules/**/*.routes.ts',
    './src/app.ts',
  ],
}

export function setupSwagger(app: Express): void {
  const swaggerPrefix = `${env.API_PREFIX}/docs`

  try {
    const swaggerSpec = swaggerJsdoc(options)

    app.use(swaggerPrefix, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Farmacy API Docs',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        displayRequestDuration: true,
      },
    }))

    // Endpoint JSON para herramientas externas
    app.get(`${env.API_PREFIX}/docs.json`, (_req, res) => {
      res.json(swaggerSpec)
    })

    logger.info(`[Swagger] Documentación API → http://localhost:${env.PORT}${swaggerPrefix}`)
  } catch (err) {
    logger.warn(`[Swagger] Error al generar documentación: ${(err as Error).message}`)
  }
}

// ── Nota para desarrolladores ─────────────────────────────
// Para documentar un endpoint, agregar comentarios JSDoc
// antes del handler. Ejemplo:
//
// /**
//  * @openapi
//  * /auth/login:
//  *   post:
//  *     tags: [Auth Admin]
//  *     summary: Iniciar sesión como empleado
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               email: { type: string }
//  *               password: { type: string }
//  *     responses:
//  *       200:
//  *         description: Login exitoso
//  */
