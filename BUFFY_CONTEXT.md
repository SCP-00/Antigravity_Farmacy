# 🧬 BUFFY_CONTEXT.md — FARMACY

> **Documento maestro de contexto.** Cualquier nueva sesión de Buffy debe leer este archivo primero antes de tocar el proyecto.  
> Generado: 29 de mayo, 2026 — Último commit: `ff5c5e1`

---

## 📋 Índice

1. [Resumen del proyecto](#1-resumen-del-proyecto)
2. [Tech stack completo](#2-tech-stack-completo)
3. [Quick start (desarrollo local)](#3-quick-start-desarrollo-local)
4. [Estructura del proyecto](#4-estructura-del-proyecto)
5. [Base de datos (Prisma + PostgreSQL)](#5-base-de-datos-prisma--postgresql)
6. [Backend — API REST](#6-backend--api-rest)
7. [Frontend — React + Tailwind](#7-frontend--react--tailwind)
8. [Autenticación y RBAC](#8-autenticación-y-rbac)
9. [Pasarelas de pago](#9-pasarelas-de-pago)
10. [Tiempo real (SSE + WebSocket + Push)](#10-tiempo-real-sse--websocket--push)
11. [Servicios y jobs](#11-servicios-y-jobs)
12. [Testing](#12-testing)
13. [Docker producción](#13-docker-producción)
14. [Variables de entorno](#14-variables-de-entorno)
15. [⚠️ Gotchas importantes](#️-gotchas-importantes)
16. [Roadmap y estado actual](#16-roadmap-y-estado-actual)
17. [Referencia rápida de comandos](#17-referencia-rápida-de-comandos)

---

## 1. Resumen del proyecto

**Farmacy** es un sistema de gestión farmacéutica completo con:
- **Tienda B2C** (catálogo de medicamentos, carrito, checkout, pagos)
- **POS** (Punto de Venta con FEFO, alertas de interacciones, devoluciones)
- **Panel admin** con 3 roles: ADMINISTRADOR / FARMACEUTA / AUXILIAR
- **Datos INVIMA/CUM** (57 productos, 8 categorías, registros sanitarios)
- **4 pasarelas de pago** (Wompi, Stripe, MercadoPago, Efectivo)
- **Tiempo real** (SSE + WebSocket + Push notifications)
- **Chatbot FarmaBot** con detección de interacciones medicamentosas
- **Dark mode** premium (paleta gris carbón inspirada en VS Code/Slack)
- **PWA** instalable con service worker offline
- **SEO** con meta tags, sitemap, robots.txt, prerender para crawlers

---

## 2. Tech stack completo

| Capa | Tecnología | Versión |
|---|---|---|
| **Runtime** | Node.js | v24.15.0 |
| **Package manager** | pnpm | v11.2.2 |
| **Backend** | Express | 4.x |
| **Backend TS** | TypeScript | 6.0 |
| **ORM** | Prisma | 5.22 |
| **Frontend** | React | 19.x |
| **Frontend TS** | TypeScript | 6.0 |
| **Bundler** | Vite | 6.4 |
| **CSS** | Tailwind CSS | 4.x (vía @tailwindcss/vite) |
| **Testing** | Vitest | 3.x |
| **DB** | PostgreSQL 15 | Docker |
| **Cache** | Redis 7 | Docker |
| **Auth** | JWT + Passport (Google OAuth) | — |
| **Colas** | BullMQ | Redis-based |
| **Tiempo real** | SSE + WebSocket (ws) | — |
| **Push** | Web Push API (VAPID) | — |
| **Payments** | Wompi / Stripe / MercadoPago | Sandbox |
| **Chatbot** | FarmaBot (custom) | — |
| **Proxy prod** | Caddy (SSL automático) | — |

---

## 3. Quick start (desarrollo local)

```powershell
# 1. Instalar todo + generar Prisma Client + poblar DB
.\setup.bat

# 2. Iniciar Docker (Postgres + Redis) + backend + frontend
.\run.ps1
```

**Servicios:**

| Servicio | URL | Puerto |
|---|---|---|
| Frontend (Vite) | http://localhost:5173 | 5173 |
| Backend (Express) | http://localhost:3000/api/v1 | 3000 |
| Swagger API Docs | http://localhost:3000/api/v1/docs | 3000 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |
| pgAdmin | http://localhost:5050 | 5050 |

**Credenciales desarrollo:**

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@farmacy.co | Admin@1234 |
| Farmacéuta | farmaceuta@farmacy.co | Farm@1234 |
| Auxiliar | auxiliar@farmacy.co | Aux@1234 |
| Cliente demo | cliente@ejemplo.co | Cliente@1234 |

---

## 4. Estructura del proyecto

```
Antigravity_Farmacy/
├── BUFFY_CONTEXT.md          ← Este archivo
├── AGENTS.md                 ← Guía rápida para desarrolladores IA
├── plan.md                   ← Roadmap 13+ fases
├── README.md                 ← Documentación principal
│
├── backend/                  ← API REST (Express + TypeScript + Prisma)
│   ├── src/
│   │   ├── app.ts                ← Configuración Express (middlewares, rutas, CORS)
│   │   ├── server.ts             ← Entrypoint (conecta DB, Redis, inicia workers)
│   │   ├── config/
│   │   │   ├── database.ts       ← PrismaClient singleton
│   │   │   ├── env.ts            ← Zod schema de variables de entorno
│   │   │   ├── redis.ts          ← IORedis singleton
│   │   │   ├── passport.ts       ← Passport (Google OAuth, JWT strategies)
│   │   │   ├── mailer.ts         ← Nodemailer (Gmail SMTP)
│   │   │   └── swagger.ts        ← Documentación interactiva
│   │   ├── modules/              ← 19 módulos (ver sección 6)
│   │   ├── services/             ← Servicios compartidos
│   │   ├── middlewares/          ← Rate limiting, auth, validación
│   │   ├── schemas/              ← Zod schemas (productos, ventas, inventario)
│   │   ├── utils/                ← JWT, logger, respuesta estandarizada
│   │   ├── jobs/                 ← BullMQ workers + job definitions
│   │   └── __tests__/            ← 28 archivos de test
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 ← React SPA (Vite + Tailwind 4)
│   ├── src/
│   │   ├── main.tsx              ← Entrypoint React
│   │   ├── app.tsx               ← Router (React Router v7)
│   │   ├── index.css             ← Tailwind 4 + dark mode + utilidades
│   │   ├── config/
│   │   │   ├── api.ts            ← Axios instance con interceptors
│   │   │   └── constants.ts      ← Constantes (API_PREFIX, etc.)
│   │   ├── components/
│   │   │   ├── layout/           ← AdminLayout, PublicLayout, AuthLayout, ProtectedRoute
│   │   │   ├── shared/           ← PageShell, ThemeToggle
│   │   │   └── tienda/           ← Header, Footer, ProductCard, CarritoDrawer, ChatbotWidget
│   │   ├── pages/
│   │   │   ├── tienda/           ← 15 páginas B2C
│   │   │   ├── admin/            ← 20+ páginas admin (caja, inventario, etc.)
│   │   │   └── auth/             ← 7 páginas de autenticación
│   │   ├── store/                ← Zustand stores (authStore, carritoStore, uiStore)
│   │   ├── types/                ← TypeScript types (producto.types.ts)
│   │   ├── hooks/                ← Custom hooks (useScanner)
│   │   ├── services/             ← API service wrappers
│   │   └── utils/                ← fuzzySearch
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── database/                 ← Prisma schema + seeds + SQL queries
│   ├── prisma/schema.prisma     ← 17 modelos (ver sección 5)
│   ├── seeds/                   ← seed.ts con 57 productos, lotes, usuarios
│   ├── queries/                 ← SQL queries útiles (stock crítico, etc.)
│   └── setup.sql                ← Script SQL inicial
│
├── docker-compose.yml           ← Producción (Caddy + apps + DB + Redis)
├── docker-compose.dev.yml       ← Desarrollo (Postgres + Redis + pgAdmin)
├── docker-compose.prod.yml      ← Producción extendida
├── Caddyfile                    ← Reverse proxy + SSL automático
├── backend/Dockerfile           ← Backend multi-stage
├── frontend/Dockerfile          ← Frontend Nginx multi-stage
├── frontend/nginx.conf          ← Nginx SPA config
├── setup.bat                    ← Setup inicial (Windows)
└── run.ps1                      ← Dev runner (PowerShell)
```

---

## 5. Base de datos (Prisma + PostgreSQL)

**18 modelos** en `database/prisma/schema.prisma`:

| Modelo | Descripción | Campos clave |
|---|---|---|
| **Sucursal** | Sucursales físicas | codigo (unique), nombre, ciudad, horarios |
| **Empleado** | Empleados (3 roles) | email (unique), password, rol (enum), sucursalId |
| **Categoria** | Categorías de productos | slug (unique), nombre, icono, orden |
| **Producto** | Productos con datos INVIMA | cum (unique), nombre, precioVenta, registroInvima, 30+ campos |
| **Lote** | Lotes de inventario (FEFO) | codigoLote (unique), productoId, cantidadActual, fechaVencimiento |
| **Proveedor** | Proveedores | nit (unique), nombre, ciudad |
| **OrdenCompra** | Órdenes de compra | numeroOrden (unique), total, estado (enum) |
| **OrdenCompraDetalle** | Detalle de órdenes | productoId, cantidad, precioUnitario |
| **Venta** | Ventas POS + B2C | consecutivo (unique), total, estado (enum), empleadoId, clienteId |
| **VentaDetalle** | Detalle de ventas | productoId, loteId, cantidad, precioUnitario |
| **Caja** | Apertura/cierre de caja | sucursalId, empleadoId, montoInicial, estado |
| **Cliente** | Clientes B2C | email (unique), puntosAcumulados, emailVerificado |
| **PagoTransaccion** | Transacciones de pago | referencia (unique), pasarela, monto, estado |
| **MovimientoInventario** | Movimientos de stock | tipo (enum: ENTRADA, SALIDA, AJUSTE), cantidad, motivo |
| **Auditoria** | Logs de auditoría | entidad, entidadId, accion, detalle (JSON) |
| **ChatHistorial** | Historial de chatbot | sessionId, mensaje, respuesta, metadatos (JSON) |
| **Favorito** | Favoritos de clientes | clienteId, productoId (composite unique) |
| **PushSubscription** | Push notifications | endpoint, p256dh, auth, empleadoId |

**Enums:** `RolEmpleado` (ADMINISTRADOR, FARMACEUTA, AUXILIAR), `EstadoVenta`, `EstadoOrdenCompra`, `EstadoPago`, `PasarelaPago`, `TipoMovimiento`, `EstadoCaja`

**Seed data:** 57 productos INVIMA, 26 lotes, 2 sucursales, 3 empleados, 1 cliente, 8 categorías, 2 proveedores

---

## 6. Backend — API REST

### 6.1 Módulos (19)

| Módulo | Archivo | Descripción |
|---|---|---|
| **Auth Admin** | `auth/auth.routes.ts` | Login/logout empleados, JWT access/refresh, refresh rotation |
| **Auth Cliente** | `auth-cliente/authCliente.routes.ts` | Registro, login, verificación email, recuperar password, ventas B2C |
| **Auth Cliente Perfil** | `auth-cliente/authCliente.perfil.routes.ts` | Perfil, direcciones, métodos de pago |
| **Caja** | `caja/caja.routes.ts` | Apertura/cierre, ventas POS, devoluciones |
| **Categorías** | `categorias/categorias.routes.ts` | CRUD categorías con iconos |
| **Chatbot** | `chatbot/chatbot.routes.ts` | FarmaBot — preguntas, interacciones medicamentosas |
| **Clientes** | `clientes/clientes.admin.routes.ts` | CRUD clientes (admin), puntos fidelidad |
| **Compras** | `compras/compras.routes.ts` | Órdenes de compra, recepción, historial |
| **Empleados** | `empleados/empleados.routes.ts` | CRUD empleados, roles, sucursal |
| **Imágenes** | `imagenes/imagenes.routes.ts` | Upload/servir imágenes de productos |
| **Inventario** | `inventario/inventario.routes.ts` | Stock, movimientos, alertas FEFO |
| **Lotes** | `lotes/lotes.routes.ts` | CRUD lotes, control vencimientos |
| **Pagos** | `pagos/pagos.routes.ts` | Transacciones, historial |
| **Pagos Pasarelas** | `pagos/pagos.routes.ts` (mismo) | Wompi, Stripe, MercadoPago, Efectivo |
| **Productos** | `productos/productos.routes.ts` | Catálogo, búsqueda, CRUD, muestras médicas |
| **Proveedores** | `proveedores/proveedores.routes.ts` | CRUD proveedores |
| **Push** | `push/push.routes.ts` | Suscribir/desuscribir dispositivos, enviar |
| **Reportes** | `reportes/reportes.routes.ts` | Dashboard KPIs, ventas, inventario, export CSV |
| **Sucursales** | `sucursales/sucursales.routes.ts` | CRUD sucursales |

### 6.2 Servicios compartidos

| Servicio | Archivo | Descripción |
|---|---|---|
| **InventarioService** | `services/inventario.service.ts` | Validar/descontar stock FEFO, costo promedio ponderado |
| **VentasService** | `services/ventas.service.ts` | Crear venta con transacción, validar stock |
| **InteraccionesService** | `services/interacciones.service.ts` | Detectar interacciones medicamentosas entre principios activos |
| **SSEService** | `services/sse.service.ts` | Server-Sent Events para dashboard en tiempo real |
| **WebSocketService** | `services/websocket.service.ts` | WebSocket para POS tiempo real |
| **EventBus** | `services/eventbus.service.ts` | EventEmitter de dominio para comunicación interna |
| **PrerenderService** | `services/prerender.service.ts` | Middleware que sirve HTML pre-renderizado a crawlers |
| **PushService** | `services/push.service.ts` | Web Push API con VAPID |
| **Queue** | `jobs/queue.ts` | BullMQ workers (csv-export, emails) |

### 6.3 Middlewares

| Middleware | Descripción |
|---|---|
| **authenticate** | Verifica JWT de empleado (Bearer token) |
| **authenticateCliente** | Verifica JWT de cliente (Bearer token) |
| **authorize(...roles)** | Autoriza por rol: ADMINISTRADOR, FARMACEUTA, AUXILIAR |
| **authorizeCliente** | Verifica que el token pertenezca al cliente del recurso |
| **rateLimit** | Rate limiting granular por ruta |
| **validate(schema)** | Validación Zod de request body/params/query |
| **errorHandler** | Manejo global de errores |

### 6.4 Endpoints clave

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | — | Healthcheck |
| POST | `/auth/login` | — | Login empleado |
| POST | `/auth/refresh` | — | Refresh token |
| POST | `/auth-cliente/registro` | — | Registro cliente |
| POST | `/auth-cliente/login` | — | Login cliente |
| GET | `/productos/buscar` | — | Catálogo público (filtros, paginación) |
| GET | `/productos/:slug` | — | Detalle producto |
| GET | `/categorias` | — | Lista categorías |
| POST | `/caja/apertura` | Admin/Farm | Abrir caja |
| POST | `/caja/venta-rapida` | Admin/Farm | Registrar venta POS |
| POST | `/caja/venta-online` | Admin/Farm | Venta online con datos cliente |
| POST | `/caja/devolucion` | Admin/Farm | Devolución (max 15 días) |
| GET | `/ventas/dashboard` | Admin/Farm | KPIs en tiempo real |
| POST | `/pagos/wompi/webhook` | — | Webhook Wompi |
| POST | `/pagos/stripe/webhook` | — | Webhook Stripe |
| POST | `/chatbot/mensaje` | — | Chat con FarmaBot |
| GET | `/reportes/stream` | Admin/Farm | SSE streaming |
| WS | `/ws` | Admin/Farm | WebSocket |

### 6.5 Response format

Todas las respuestas usan `responder.utils.ts`:

```typescript
// Éxito
{ ok: true, data: { ... } }

// Error
{ ok: false, error: "mensaje" }

// Con paginación
{ ok: true, data: [...], total: 57, pagina: 1, totalPaginas: 3 }
```

---

## 7. Frontend — React + Tailwind

### 7.1 Páginas — Tienda B2C (15)

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `Inicio.tsx` | Landing con hero, categorías, productos destacados |
| `/productos` | `Catalogo.tsx` | Grid con filtros, búsqueda, toggle dark mode |
| `/productos/:slug` | `ProductoDetalle.tsx` | Detalle, lotes disponibles, precio, agregar carrito |
| `/carrito` | `Carrito.tsx` | Carrito completo, cantidades, subtotal |
| `/checkout` | `Checkout.tsx` | Datos envío, método pago, resumen |
| `/confirmacion/:ref` | `ConfirmacionPago.tsx` | Resultado pago |
| `/favoritos` | `Favoritos.tsx` | Lista de favoritos |
| `/mi-cuenta` | `MiCuenta.tsx` | Perfil, direcciones, métodos pago |
| `/mis-pedidos` | `MisPedidos.tsx` | Historial de pedidos |
| `/quienes-somos` | `QuienesSomos.tsx` | Página institucional |
| `/sucursales` | `Sucursales.tsx` | Mapa + lista sucursales |
| `/contacto` | `Contacto.tsx` | Formulario de contacto |
| `/privacidad` | `PoliticaPrivacidad.tsx` | Política de privacidad |
| `/terminos` | `TerminosCondiciones.tsx` | Términos y condiciones |
| `*` | `NoEncontrado.tsx` | 404 |

### 7.2 Páginas — Admin (20+)

| Ruta | Componente | Módulo | Roles |
|---|---|---|---|
| `/admin` | `Dashboard.tsx` | Dashboard | Todos |
| `/admin/caja/punto-venta` | `PuntoVenta.tsx` | POS | Admin, Farm |
| `/admin/caja/historial` | `HistorialCaja.tsx` | Caja | Admin, Farm |
| `/admin/caja/devoluciones` | `Devoluciones.tsx` | Devoluciones | Admin, Farm |
| `/admin/caja/ticket/:id` | `InvoicePreview.tsx` | Ticket | Admin, Farm |
| `/admin/inventario/productos` | `ListaProductos.tsx` | Inventario | Todos |
| `/admin/inventario/productos/:id` | `DetalleProductoAdmin.tsx` | Productos | Todos |
| `/admin/inventario/lotes` | `GestionLotes.tsx` | Lotes | Todos |
| `/admin/inventario/movimientos` | `Movimientos.tsx` | Movimientos | Todos |
| `/admin/inventario/alertas` | `AlertasInventario.tsx` | Alertas | Todos |
| `/admin/compras/ordenes` | `OrdenesCompra.tsx` | Compras | Todos |
| `/admin/compras/nueva` | `NuevaOrden.tsx` | Compras | Admin |
| `/admin/compras/recepcion` | `RecepcionMercancia.tsx` | Compras | Admin |
| `/admin/clientes` | `ListaClientes.tsx` | Clientes | Admin, Farm |
| `/admin/clientes/:id` | `DetalleCliente.tsx` | Clientes | Admin, Farm |
| `/admin/fidelidad` | `ProgramaFidelidad.tsx` | Fidelidad | Admin, Farm |
| `/admin/empleados` | `ListaEmpleados.tsx` | Empleados | Admin |
| `/admin/empleados/:id` | `DetalleEmpleado.tsx` | Empleados | Admin |
| `/admin/proveedores` | `ListaProveedores.tsx` | Proveedores | Admin |
| `/admin/proveedores/:id` | `DetalleProveedor.tsx` | Proveedores | Admin |
| `/admin/reportes/ventas` | `ReporteVentas.tsx` | Reportes | Admin, Farm |
| `/admin/reportes/inventario` | `ReporteInventario.tsx` | Reportes | Admin |
| `/admin/reportes/compras` | `ReporteCompras.tsx` | Reportes | Admin |
| `/admin/reportes/clientes` | `ReporteClientes.tsx` | Reportes | Admin, Farm |
| `/admin/configuracion/general` | `ConfigGeneral.tsx` | Config | Admin |
| `/admin/configuracion/seguridad` | `ConfigSeguridad.tsx` | Config | Admin |
| `/admin/configuracion/sucursales` | `ConfigSucursales.tsx` | Config | Admin |
| `/admin/configuracion/usuarios` | `ConfigUsuarios.tsx` | Config | Admin |

### 7.3 Páginas — Auth (7)

| Ruta | Componente |
|---|---|
| `/login-admin` | `LoginAdmin.tsx` |
| `/login` | `LoginCliente.tsx` |
| `/registro` | `RegistroCliente.tsx` |
| `/auth/callback` | `AuthCallback.tsx` (Google OAuth) |
| `/recuperar-password` | `RecuperarPassword.tsx` |
| `/reset-password` | `ResetPassword.tsx` |
| `/verificar-email` | `VerificarEmail.tsx` |

### 7.4 Stores (Zustand)

- **authStore**: Token JWT, usuario, roles, login/logout, refresh automático, Google OAuth
- **carritoStore**: Items, cantidades, subtotal, agregar/quitar, persistencia localStorage
- **uiStore**: Dark mode toggle, sidebar, notificaciones, modal

### 7.5 Dark mode

Paleta profesional en `index.css` inspirada en VS Code y Slack:

```css
--dark-bg: #1e1e1e;              /* Fondo base — VS Code */
--dark-surface: #252526;          /* Superficies — VS Code secondary */
--dark-surface-elevated: #2d2d2d; /* Cards elevadas */
--dark-border: rgba(255,255,255,0.10);
--dark-text: #d4d4d4;            /* 11.8:1 contraste */
--dark-text-secondary: #a0a0a0;  /* 5.87:1 contraste */
--dark-text-muted: #868686;      /* 4.58:1 WCAG AA */
--dark-accent: #569cd6;          /* VS Code blue */
--dark-hover: rgba(255,255,255,0.07);
```

**Componentes con dark mode completo:**
- AdminLayout.tsx, PublicLayout.tsx
- CarritoDrawer.tsx, ProductCard.tsx
- Dashboard.tsx, PuntoVenta.tsx
- ListaProductos.tsx, ListaClientes.tsx
- Header.tsx, Footer.tsx, ChatbotWidget.tsx
- Tablas, formularios, badges, skeletons

---

## 8. Autenticación y RBAC

### 8.1 Flujo JWT (empleados)

1. `POST /auth/login` → `{ accessToken (15min), refreshToken (7d) }`
2. Access token en header: `Authorization: Bearer <token>`
3. Refresh automático vía `POST /auth/refresh` → nuevo access token
4. Refresh rotation: cada refresh invalida el anterior
5. Logout: blacklist del refresh token en Redis

### 8.2 Flujo JWT (clientes)

1. `POST /auth-cliente/login` o `POST /auth-cliente/registro` → tokens
2. Misma mecánica que empleados pero con `JWT_CLIENTE_SECRET`
3. Google OAuth disponible vía Passport

### 8.3 Roles y permisos

| Recurso | ADMINISTRADOR | FARMACEUTA | AUXILIAR |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ |
| POS / Caja | ✅ | ✅ | ❌ |
| Devoluciones | ✅ | ✅ | ❌ |
| Clientes | ✅ | ✅ | ❌ |
| Inventario | ✅ | ✅ | ✅ |
| Lotes | ✅ | ✅ | ✅ |
| Compras | ✅ | ✅ | ✅ |
| Proveedores | ✅ | ✅ | ✅ |
| Productos | ✅ | ✅ | ✅ |
| Empleados | ✅ | ❌ | ❌ |
| Reportes | ✅ | ✅ | ❌ |
| Configuración | ✅ | ❌ | ❌ |
| Auditoría | ✅ | ❌ | ❌ |

---

## 9. Pasarelas de pago

| Pasarela | Sandbox Keys | Webhook | Estado |
|---|---|---|---|
| **Wompi** | `pub_test_*`, `prv_test_*`, `test_integrity_*` | `POST /pagos/wompi/webhook` | ✅ Sandbox |
| **Stripe** | `pk_test_*`, `sk_test_*`, `whsec_*` | `POST /pagos/stripe/webhook` | ✅ Test keys |
| **MercadoPago** | `TEST-*` access token + public key | `POST /pagos/mercadopago/webhook` | ✅ Sandbox |
| **Efectivo** | — | — | ✅ Sin pasarela |

El usuario selecciona la pasarela en checkout. Las transacciones se registran en `PagoTransaccion` con referencia única y estado.

---

## 10. Tiempo real (SSE + WebSocket + Push)

### SSE (Server-Sent Events)
- **Ruta:** `GET /reportes/stream` (auth requerido)
- **Eventos:** dashboard KPIs, alertas stock crítico, ventas nuevas
- **9 eventos** escuchados desde EventBus

### WebSocket
- **Ruta:** `ws://localhost:3000/ws` (auth requerido)
- **Propósito:** POS tiempo real — notificar nuevas ventas a todas las cajas
- **Mensajes:** `{ tipo: 'VENTA_REGISTRADA', data: {...} }`

### Push (Web Push API)
- **VAPID:** Configurable vía `.env` (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
- **Propósito:** Notificaciones a empleados (alertas inventario, stock crítico)
- **Suscripciones:** Persistidas en `PushSubscription` por empleado

### EventBus (interno)
- **Patrón:** EventEmitter de dominio
- **Eventos:** DASHBOARD_KPIS_UPDATE, VENTA_REGISTRADA, STOCK_CRITICO, CAJA_ABIERTA/CERRADA, JOB_COMPLETADO/ERROR

---

## 11. Servicios y jobs

### 11.1 Job Alertas
- **Archivo:** `backend/src/jobs/alertas.ts`
- **Schedule:** Diario a las 7:00 AM
- **Funcionalidad:** Verifica lotes próximos a vencer (30 días), productos con stock crítico, envía alertas push

### 11.2 BullMQ Queues
| Cola | Workers | Propósito |
|---|---|---|
| `csv-export` | 2 concurrentes, 5/min | Exportar reportes a CSV |
| `emails` | Default | Envío de emails (futuro) |

### 11.3 Chatbot FarmaBot
- **Ruta:** `POST /chatbot/mensaje`
- **Funcionalidad:** Responde preguntas sobre medicamentos, verifica interacciones entre principios activos usando `InteraccionesService`
- **Historial:** Persistido en `ChatHistorial` por sesión

### 11.4 Prerender (SEO)
- **Middleware** en backend que detecta crawlers por User-Agent
- **Soporte:** Googlebot, Bing, Facebook, Twitter, LinkedIn, GPTBot, ClaudeBot, etc.
- **Rutas prerenderizables:** `/`, `/productos`, `/quienes-somos`, `/contacto`, `/sucursales`, `/productos/<slug>`

---

## 12. Testing

### Backend (28 archivos, 536 tests, 95.35% cobertura)
- **Runner:** Vitest v3
- **DB:** Prisma (no mock — usa base de datos real en tests de integración)
- **Config:** `backend/vitest.config.ts`

| Archivo | Tests |
|---|---|
| `app.test.ts` | Configuración Express, healthcheck |
| `auth.routes.test.ts` | Login, refresh, logout empleados |
| `auth-cliente.routes.test.ts` | Registro, login, verificación clientes |
| `ventas.routes.test.ts` | CRUD ventas, devoluciones |
| `inventario.service.test.ts` | FEFO, stock, movimientos |
| `interacciones.service.test.ts` | Detección interacciones medicamentosas |
| `productos.routes.test.ts` | Catálogo, búsqueda, filtros |
| `caja-clientes.routes.test.ts` | Apertura/cierre caja, ventas POS |
| `pagos.routes.test.ts` | Transacciones, webhooks |
| `pagos-pasarelas.routes.test.ts` | Wompi, Stripe, MercadoPago |
| `lotes-inventario-proveedores.routes.test.ts` | Lotes, inventario, proveedores |
| `categorias-sucursales.routes.test.ts` | Categorías, sucursales |
| `empleados-compras.routes.test.ts` | Empleados, compras, recepción |
| `reportes-imagenes.routes.test.ts` | Reportes, upload imágenes |
| `chatbot.routes.test.ts` | FarmaBot |
| `schemas.test.ts` | Validación Zod |
| `middlewares.test.ts` | Rate limiting, auth |
| `jwt.utils.test.ts` | Token generation, refresh rotation |
| `respuesta.utils.test.ts` | Response format |
| `logger.test.ts` | Logging |
| `env.test.ts` | Validación entorno |
| `database.test.ts` | Conexión DB |
| `redis.test.ts` | Conexión Redis |
| `mailer.test.ts` | Nodemailer |
| `passport.test.ts` | Passport strategies |
| `ventas.service.test.ts` | VentasService |
| `alertas.job.test.ts` | Job de alertas |
| `security.test.ts` | Pentest automatizado (109 tests) |

### Frontend (sin tests aún — pendiente)

---

## 13. Docker producción

### docker-compose.yml (producción)
```yaml
servicios:
  - postgres: 512MB RAM, 1.0 CPU, volumen persistente, healthcheck
  - redis: 256MB RAM, 0.5 CPU, healthcheck
  - backend: 512MB RAM, 0.5 CPU, multi-stage build, healtcheck:
    - GET /api/v1/health → 200
  - frontend: 128MB RAM, multi-stage build, Nginx, solo puerto interno
  - caddy: 128MB RAM, 0.25 CPU, puertos 80/443, SSL automático
  - backup-sidecar: pg_dump cada 24h, rotación 30 días
```

### Redes
- `app-network`: Todos los servicios comparten esta red interna
- Solo Caddy expone puertos (80/443)

### Caddy reverse proxy
- SSL automático vía Let's Encrypt
- Frontend: `farmacia.midominio.com`
- API: `farmacia.midominio.com/api/*`
- Swagger: `farmacia.midominio.com/api/v1/docs`
- WebSocket: soportado

### Despliegue
Guía completa: `docs/deploy-guide.md` (814 líneas, 15 secciones)

---

## 14. Variables de entorno

Archivo: `.env.example`

```env
# ════════════════════════════════════════════
#  REQUERIDAS
# ════════════════════════════════════════════
DATABASE_URL=postgresql://farmacy:farmacy123@localhost:5432/farmacy_dev
JWT_SECRET=                    # mínimo 32 caracteres
JWT_REFRESH_SECRET=            # mínimo 32 caracteres
JWT_CLIENTE_SECRET=            # mínimo 32 caracteres
PORT=3000

# ════════════════════════════════════════════
#  OPCIONALES — Funcionalidades premium
# ════════════════════════════════════════════
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Redis (opcional — app funciona sin caché)
REDIS_URL=redis://localhost:6379

# Email (Gmail SMTP)
EMAIL_USER=
EMAIL_PASS=

# VAPID (Push notifications)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=notificaciones@farmacy.co

# Wompi (sandbox)
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_INTEGRITY_KEY=test_integrity_...
WOMPI_WEBHOOK_SECRET=

# Stripe (test)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_PUBLIC_KEY=TEST-...

# Frontend URL (para CORS y links en emails)
FRONTEND_URL=http://localhost:5173

# IPs permitidas para webhooks (vacío = todas)
WEBHOOK_ALLOWLIST=
```

---

## 15. ⚠️ Gotchas importantes

### 15.1 MSYS Path Translation (Git Bash en Windows)

Cuando el backend se ejecuta desde **Git Bash**, las rutas que empiezan con `/` son traducidas automáticamente a rutas Windows:
```
/api/v1 → C:/Program Files/Git/api/v1
```

**Síntomas:** Healthcheck funciona (200), pero todas las demás rutas devuelven 404.

**Solución:** El schema de `API_PREFIX` en `backend/src/config/env.ts` tiene un `.transform()` que detecta el patrón de unidad Windows (`C:/...`) y extrae la ruta original.

**Para ejecutar comandos desde Git Bash:**
```bash
MSYS2_ARG_CONV_EXCL="*" pnpm run dev
```

**Nota:** `run.ps1` usa PowerShell, por lo que no sufre de este bug.

### 15.2 Kill safety

NUNCA usar `taskkill /F /IM node.exe` — mata todos los procesos Node.js incluyendo freebuff.cmd.

**Forma segura:**
```powershell
# Matar solo el proceso en un puerto específico
$pid = (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id $pid -Force
```

### 15.3 pnpm only

Este proyecto NO usa npm. Solo pnpm está instalado y disponible. Siempre usar `pnpm`.

### 15.4 Prisma Client

- Schema: `database/prisma/schema.prisma`
- Generar client: `cd backend && npx prisma generate --schema=../database/prisma/schema.prisma`
- Post-generate: Un script copia Prisma Client a `backend/node_modules/.prisma/client`

### 15.5 Decimal de Prisma

`precioVenta` y otros campos `Decimal` en Prisma **no soportan aritmética directa** en TypeScript. Siempre convertir con `Number(producto.precioVenta)`.

### 15.6 Venta.empleadoId requerido

En ventas B2C online (auth-cliente), `empleadoId` es requerido. Se resuelve buscando el administrador más antiguo como empleado por defecto.

---

## 16. Roadmap y estado actual

**13 fases completadas** (ver `plan.md` para detalle completo):

| Fase | Estado |
|---|---|
| 1-5: Fundación, BD, Auth, Catálogo, Carrito | ✅ |
| 6: Checkout + Pagos | ✅ |
| 7: POS (Punto de Venta) | ✅ |
| 8: Admin avanzado (reportes, empleados) | ✅ |
| 9: Tiempo real (SSE, WS, Push) | ✅ |
| 10: Chatbot FarmaBot | ✅ |
| 11: SEO (prerender, sitemap, OG) | ✅ |
| 12: Docker producción (Caddy, backups) | ✅ |
| 13: Dark mode premium | ✅ |
| Pentest: 109 tests, 0 críticas | ✅ |
| Deploy guide: `docs/deploy-guide.md` | ✅ |

**Tests:** 536/536 pasando, 95.35% cobertura  
**TypeScript:** 0 errores frontend + backend

**¿Listo para producción?** Sí. Solo falta: VPS, `.env` con secrets reales, `docker compose up -d --build`.

---

## 17. Historial de trabajo

Ver `docs/worklog.md` para registro cronológico completo.

**Últimos commits:**

| Hash | Mensaje |
|---|---|
| `ff5c5e1` | fix: 3 errores TS en authCliente.routes.ts — backend compila y arranca |
| `7d6b609` | fix: dark mode rediseñado — paleta profesional gris carbón |
| `6699ebe` | docs: deploy guide completa + worklog |
| `47d187e` | feat: dark mode premium — paleta refinada + 7 componentes |
| `3b0c750` | chore: actualizar especificaciones de run.ps1 |

---

## 18. Referencia rápida de comandos

```bash
# Desarrollo
.\setup.bat                    # Setup completo
.\run.ps1                      # Iniciar todo (Docker + backend + frontend)

# Backend
cd backend && pnpm run dev     # Backend con nodemon
cd backend && pnpm run build   # Compilar TS → JS
cd backend && npx tsc --noEmit # Typecheck solo

# Frontend
cd frontend && pnpm run dev    # Vite dev server
cd frontend && npx tsc --noEmit

# Base de datos
cd backend && pnpm run db:push   # Sincronizar schema → DB
cd backend && pnpm run db:seed   # Poblar datos demo
cd backend && npx prisma generate --schema=../database/prisma/schema.prisma

# Testing
cd backend && pnpm test         # Todos los tests
cd backend && pnpm run test:coverage

# Docker
docker compose -f docker-compose.dev.yml up -d   # Dev (Postgres + Redis)
docker compose up -d                               # Producción
docker compose logs -f                              # Logs en vivo

# Git
git add -A && git commit -m "mensaje" && git push
```

---

> *Este documento fue generado para permitir que cualquier nueva sesión de Buffy retome el proyecto sin perder contexto.*  
> *Actualizar este archivo cada vez que se agreguen cambios significativos al proyecto.*
