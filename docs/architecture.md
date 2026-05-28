# Architecture overview

## Monorepo layout
- \backend/: Express + TypeScript API, Prisma ORM, auth, POS, inventory, payments. Capas separadas de schemas y services.
- \frontend/: React + Vite + Tailwind UI for B2C store and admin console.
- database/: Prisma schema and seeds.
- Root scripts: setup.bat, \run.ps1, docker-compose.dev.yml.

## Entry points
- Backend: \backend/src/server.ts
- Frontend: \frontend/src/main.tsx

## Estándar Regulatorio Colombiano (INVIMA / CUM / ATC)
- **CUM como SKU real:** La farmacia gestiona su stock mediante el CUM exacto (expedientecum + "-" + consecutivocum) asegurando un control riguroso de cada presentación comercial independiente.
- **Seguridad en Alérgenos y Excipientes:** El modelo posee los campos "alergenos" y "advertencias" en la tabla "productos" para advertir sobre trazas o excipientes sensibles (ej. Lactosa, Tartrazina) en la visualización del público B2C.
- **Muestras Médicas Protegidas:** Se define la columna "esMuestraMedica". El backend de la tienda rechaza y excluye estos productos de cualquier consulta pública comercial para evitar la comercialización ilegal de muestras.

## UX (User Experience) Improvements - B2C & POS
Para asegurar la fiabilidad y rapidez requerida por el negocio, se han planificado componentes de optimización de interfaz en el frontend:
- **POS Keyboard Interactivity:** Atajos rápidos con manejadores globales de eventos de teclado (Keydowns) para agilizar el registro y cobro en cajas físicas (F2 cobro, F4 reset).
- **Drug-Interaction Alerts:** Un motor de advertencia visual en el POS que compare los principios activos agregados al carrito, alertando al farmacéuta si existe una interacción riesgosa antes de facturar.
- **B2C Health Profiles:** Una sección en la cuenta del cliente para auto-bloquear o alertar la compra de medicamentos que contengan alérgenos definidos por el usuario (ej. Lactosa).

> **📍 Mapa completo de rutas:** [docs/api-routes.md](api-routes.md) — 72 endpoints back + 40+ páginas front, con RBAC y métodos HTTP.
> 🏗️ **Diagrama de arquitectura:** [docs/architecture-diagram.md](architecture-diagram.md) — Mermaid con frontend↔backend↔DB↔servicios externos

## Backend module catalog (verified)
| Module | Route prefix | Endpoints | File | Auth |
|---|---|---|---|---|
| auth | /api/v1/auth | 4 | `auth.routes.ts` | 3 token, 1 public |
| auth-cliente | /api/v1/clientes/auth | 12 | `authCliente.routes.ts` | 6 token, 6 public |
| auth-cliente perfil | /api/v1/clientes/auth | 2 | `authCliente.perfil.routes.ts` | token cliente |
| categorias | /api/v1/categorias | 3 | `categorias.routes.ts` | 1 public |
| sucursales | /api/v1/sucursales | 3 | `sucursales.routes.ts` | 1 public |
| productos | /api/v1/productos | 5 | `productos.routes.ts` | 2 public |
| lotes | /api/v1/lotes | 2 | `lotes.routes.ts` | token |
| inventario | /api/v1/inventario | 4 | `inventario.routes.ts` | token |
| ventas | /api/v1/ventas | 4 | `ventas.routes.ts` | token |
| caja | /api/v1/caja | 4 | `caja.routes.ts` | token |
| clientes (admin) | /api/v1/clientes | 3 | `clientes.admin.routes.ts` | token |
| empleados | /api/v1/empleados | 4 | `empleados.routes.ts` | token ADMIN |
| proveedores | /api/v1/proveedores | 4 | `proveedores.routes.ts` | token |
| compras | /api/v1/compras | 4 | `compras.routes.ts` | token |
| reportes | /api/v1/reportes | 5 (1 CSV) | `reportes.routes.ts` | token ADMIN |
| chatbot | /api/v1/chatbot | 4 | `chatbot.routes.ts` | public |
| pagos | /api/v1/pagos | 7 | `pagos.routes.ts` | 3 public webhook |
| imagenes | /api/v1/imagenes | 2 | `imagenes.routes.ts` | token |

## Services (dominio)
- \backend/src/services/inventario.service.ts: Lógica FEFO (First Expired, First Out) y cálculo de costo promedio.
- \backend/src/services/ventas.service.ts: Registro de ventas con integración FEFO y puntos de fidelidad.

## Validaciones Zod
- \backend/src/schemas/inventario.schema.ts: Schemas para creación de lotes y ajustes de inventario.
- \backend/src/schemas/productos.schema.ts: Schemas para creación/actualización de productos.
- Todos exportados centralizadamente desde \backend/src/schemas/index.ts.

## Jobs (CRON)
- \backend/src/jobs/alertas.ts: Verificación diaria (7:00 AM) de lotes próximos a vencer con umbrales escalonados (30/15/0 días) y stock crítico. Crea alertas en BD, notifica admins por email.

## Infraestructura de Tiempo Real

El sistema de tiempo real elimina el polling HTTP reemplazándolo por tres canales de comunicación asíncrona orquestados por un EventBus central:

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  Módulos     │────▶│    EventBus       │────▶│   SSE Manager    │──▶ Dashboard (admin)
│  (ventas,    │     │  (EventEmitter)   │     └──────────────────┘
│   caja,      │     │                   │     ┌──────────────────┐
│   inventario)│────▶│  9 eventos        │────▶│  WS Manager      │──▶ POS (caja, stock)
└──────────────┘     │  de dominio       │     └──────────────────┘
                     │                   │     ┌──────────────────┐
                     │                   │────▶│   BullMQ Workers  │──▶ CSV Export
                     └───────────────────┘     └──────────────────┘
```

### Orden de inicialización en server.ts

1. PostgreSQL (connectDB)
2. Redis (connectRedis)
3. Express app (createApp)
4. SSE Manager (sseManager.init) — escucha EventBus, no necesita server HTTP
5. Job alertas (iniciarJobAlertas)
6. HTTP Server (app.listen)
7. WebSocket Manager (wsManager.init) — necesita el server HTTP
8. BullMQ Workers (iniciarWorkers) — después de WS

**Shutdown (SIGTERM/SIGINT):** WS → SSE → Workers → HTTP → DB

---

### 1. EventBus (`backend/src/services/eventbus.service.ts`)

Singleton basado en `EventEmitter` de Node.js. Es el middleware de mensajería entre los módulos del backend y los canales de salida (SSE, WebSocket, Queue).

| Método | Descripción |
|---|---|
| `emit(tipo, data)` | Emite un evento de dominio con payload tipado `PayloadEvento { tipo, data, timestamp }` |
| `on(tipo, listener)` | Se suscribe a un evento; retorna función unsubscribe |
| `once(tipo, listener)` | Suscripción única (auto-removida tras emitir) |
| `removeAll(tipo)` | Remueve todos los listeners de un tipo |
| `stats()` | Estadísticas de listeners activos por tipo de evento |

**Límite de listeners:** 30 (default de EventEmitter es 10)

---

### 2. SSE Service (`backend/src/services/sse.service.ts`)

Distribuye eventos del EventBus a clientes conectados vía **Server-Sent Events**. Usado por el **Dashboard en vivo** del panel admin.

| Método | Descripción |
|---|---|
| `init()` | Se suscribe a todos los eventos del EventBus + inicia heartbeat cada 15s |
| `agregar(id, res, filtros?)` | Registra un nuevo cliente SSE con filtro opcional por tipo de evento |
| `enviar(clienteId, evento, data)` | Envía un evento a un cliente específico |
| `destroy()` | Detiene heartbeat, unsubscribe de EventBus, cierra todas las conexiones |
| `stats()` | Retorna `{ clientesConectados, clientesIds }` |

**Endpoint:** `GET /reportes/stream` (autenticación ADMIN / FARMACEUTA)
**Query params opcionales:** `?eventos=dashboard:kpis-update,inventario:alerta`
**Heartbeat:** Cada 15s (`:heartbeat`) para mantener conexión viva
**Reconexión sugerida:** 3s (`retry: 3000`)

**Headers de respuesta:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache, no-transform`
- `Connection: keep-alive`
- `X-Accel-Buffering: no` (Nginx compat)

**Ruta Express:** `backend/src/modules/reportes/reportes.sse.ts`

---

### 3. WebSocket Manager (`backend/src/services/websocket.service.ts`)

WebSocket nativo (librería `ws`) sobre el mismo server HTTP. Usado por el **POS en vivo** (eventos de caja, stock crítico, ventas concurrentes).

| Método | Descripción |
|---|---|
| `init(server)` | Crea WebSocketServer sobre el HTTP server existente, path `/ws` |
| `destroy()` | Cierra todas las conexiones y limpia |
| `stats()` | Retorna `{ clientesConectados, canales: { [canal]: count } }` |

#### Canales de suscripción

| Canal | Suscriptores por defecto | Eventos que recibe |
|---|---|---|
| `pos:caja` | Todos los roles autenticados | Apertura/cierre de caja en otras sesiones |
| `pos:ventas` | Todos los roles autenticados | Nueva venta registrada |
| `pos:stock` | Anónimos + autenticados | Stock crítico (< 10 unidades) |
| `admin:alertas` | Solo ADMINISTRADOR | Alertas de inventario |

Los clientes pueden cambiar sus canales dinámicamente enviando mensajes:
```json
{"type": "SUBSCRIBE", "channel": "admin:alertas"}
{"type": "UNSUBSCRIBE", "channel": "pos:ventas"}
```

**Autenticación:** JWT vía query param `?token=...` en la URL WS.
**Heartbeat:** Ping automático cada 30s.
**Payload máximo:** 100 KB.
**Formato de mensaje saliente:** `{ "event": string, "data": object, "timestamp": string }`

---

### 4. BullMQ Queue + Workers (`backend/src/jobs/queue.ts`)

Cola de jobs asíncronos sobre Redis para tareas pesadas fuera del request-response.

#### Colas definidas

| Cola | Worker | Retry | Backoff | Concurrencia | Rate limit |
|---|---|---|---|---|---|
| `csv-export` | ✅ Activo | 3 | 2s exponencial | 2 | 5/min |
| `emails` | ❌ Pendiente | 5 (definido) | 5s exponencial | — | — |

#### Configuración de retención
| Cola | `removeOnComplete` | `removeOnFail` |
|---|---|---|
| csv-export | 7 días | 30 días |
| emails | 1 día | 7 días |

#### CSV Export Worker

Procesa jobs `csv-export` generando archivos CSV de ventas/compras/inventario y persistiendo el resultado en Redis con expiración de 1 hora:

```
Job recibido → import dinámico de csv-export.job → exportarCSV() → redis.setex(`csv:${jobId}`, 3600, csv) → eventBus.emit(JOB_COMPLETADO)
```

**Resultado descargable:** `GET /reportes/csv/:jobId` (lee desde Redis — implementación pendiente)

**Eventos emitidos:**
- `JOB_COMPLETADO` con `{ tipo, jobId, key }`
- `JOB_ERROR` con `{ tipo, jobId, error }`

**Archivos:**
- `backend/src/jobs/queue.ts` — Definición de colas, workers, inicialización/detención
- `backend/src/jobs/csv-export.job.ts` — Lógica de exportación CSV (también exportable para uso síncrono directo)

---

### 5. Event Wiring — Contratos de Eventos

Los módulos de negocio emiten eventos al EventBus en puntos específicos del flujo:

#### Ventas (`backend/src/modules/ventas/ventas.routes.ts`)
```typescript
// POST /ventas — Crear venta (después de completar transacción)
eventBus.emit(Eventos.VENTA_REGISTRADA, { ventaId, numero, total, metodoPago })
```

#### Caja (`backend/src/modules/caja/caja.routes.ts`)
```typescript
// POST /caja/abrir — Abrir caja (después de crear sesión)
eventBus.emit(Eventos.CAJA_ABIERTA, { cajaId, empleadoId, montoInicial, abiertaEn })

// POST /caja/:id/cerrar — Cerrar caja (después de registrar cierre)
eventBus.emit(Eventos.CAJA_CERRADA, { cajaId, empleadoId, montoFinal, diferencia })
```

#### Inventario (`backend/src/modules/inventario/inventario.routes.ts`)
```typescript
// POST /inventario/ajuste — Ajustar stock
eventBus.emit(Eventos.STOCK_AJUSTADO, { productoId, loteId, cantidadAnterior, cantidadNueva, tipo })

// Si stock final <= 10, se emite además:
eventBus.emit(Eventos.STOCK_CRITICO, { productoId, nombre, stockActual })
```

---

### 6. Tabla completa de eventos del dominio

| Constante | Valor string | Emisor | Consumidores | Payload |
|---|---|---|---|---|
| `DASHBOARD_KPIS_UPDATE` | `dashboard:kpis-update` | — *(reservado)* | SSE → Dashboard | `{ kpis... }` |
| `INVENTARIO_ALERTA` | `inventario:alerta` | — *(reservado)* | SSE + WS → Dashboard, POS | `{ alertaId, tipo, mensaje }` |
| `CAJA_ABIERTA` | `caja:abierta` | `caja.routes.ts` | WS → POS (canal `pos:caja`) | `{ cajaId, empleadoId, montoInicial, abiertaEn }` |
| `CAJA_CERRADA` | `caja:cerrada` | `caja.routes.ts` | WS → POS (canal `pos:caja`) | `{ cajaId, empleadoId, montoFinal, diferencia }` |
| `VENTA_REGISTRADA` | `venta:registrada` | `ventas.routes.ts` | WS → POS (canal `pos:ventas`) | `{ ventaId, numero, total, metodoPago }` |
| `STOCK_CRITICO` | `inventario:stock-critico` | `inventario.routes.ts` | WS → POS (canal `pos:stock`) | `{ productoId, nombre, stockActual }` |
| `STOCK_AJUSTADO` | `inventario:stock-ajustado` | `inventario.routes.ts` | WS (canal `pos:stock`) | `{ productoId, loteId, cantidadAnterior, cantidadNueva, tipo }` |
| `JOB_COMPLETADO` | `job:completado` | `csv-export.job.ts` | EventBus (logging) | `{ tipo, jobId, key }` |
| `JOB_ERROR` | `job:error` | `csv-export.job.ts` | EventBus (logging) | `{ tipo, jobId, error }` |

---

### 7. Frontend — Hooks (`frontend/src/hooks/useRealtime.ts`)

| Hook | Protocolo | Uso | Reconexión |
|---|---|---|---|
| `useSSE(options)` | Fetch + ReadableStream (SSE) | Dashboard en vivo | Backoff exponencial 1s→30s, max 20 intentos |
| `useWS(options)` | WebSocket nativo | POS en vivo | Backoff exponencial 1s→30s, max 20 intentos |

#### `useSSE(options)`

Usa `fetch()` con header `Authorization` en lugar de `EventSource` nativo (no soporta headers personalizados). Retorna `{ conectado, ultimoEvento }`.

| Option | Tipo | Default | Descripción |
|---|---|---|---|
| `eventos` | `string[]` | `undefined` | Filtro opcional de eventos a recibir (query param `?eventos=...`) |
| `onEvent` | `(event: SSEEvent) => void` | — | Callback por cada evento recibido |
| `onConnected` | `() => void` | — | Callback al conectar o reconectar exitosamente |
| `enabled` | `boolean` | `true` | Si `false`, no intenta conectar |

**Payload SSEEvent:** `{ tipo: string, data: Record<string, unknown>, timestamp: string }`

#### `useWS(options)`

Retorna `{ conectado, ultimoEvento, enviar }`.

| Option | Tipo | Default | Descripción |
|---|---|---|---|
| `onEvent` | `(event: WSEvent) => void` | — | Callback por cada mensaje WS recibido |
| `onConnected` | `() => void` | — | Callback al conectar |
| `enabled` | `boolean` | `true` | Si `false`, no intenta conectar |

| Método `enviar` | Descripción |
|---|---|
| `enviar('SUBSCRIBE', 'admin:alertas')` | Suscribirse a un canal |
| `enviar('UNSUBSCRIBE', 'pos:ventas')` | Desuscribirse de un canal |
| `enviar('PING')` | Heartbeat manual |

**Payload WSEvent:** `{ event: string, data: Record<string, unknown>, timestamp: string }`

**URL de conexión:** Se deriva automáticamente de `VITE_API_URL` convirtiendo `http://` → `ws://`.

**Exportado desde:** `frontend/src/hooks/index.ts`

---

### 8. Conexión Redis para BullMQ

BullMQ necesita conexiones Redis dedicadas. El módulo `queue.ts` parsea `REDIS_URL` (formato `redis://[[usuario][:password]@][host][:port]`) usando `new URL()`:

```typescript
const url = new URL(process.env.REDIS_URL)
return {
  host: url.hostname || 'localhost',
  port: Number(url.port) || 6379,
  password: url.password || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
}
```

Fallback a `localhost:6379` si `REDIS_URL` no está configurada o tiene formato inválido.

## Testing
- **Framework:** Vitest v3 (sync backend/frontend) + supertest para tests de integración
- **27 archivos de test** (510 tests — todos pasan ✅)
- **Cobertura global: 95.35%** statements, 84.03% branches, 94.87% functions
- **TypeScript 6.0:** 0 errores en backend y frontend
- **Coverage ≥90% en todos los módulos funcionales** (excepto imagenes — 46.96%)

### Cobertura por módulo

| Módulo | Statements | Branches | Functions |
|---|---|---|---|
| `app` | 100% | 100% | 100% |
| `caja` | 100% | 60% | 100% |
| `clientes (admin)` | 100% | 100% | 100% |
| `auth` | 100% | 79.16% | 100% |
| `auth-cliente perfil` | 100% | 100% | 100% |
| `compras` | 100% | 82.35% | 100% |
| `inventario` | 100% | 75% | 100% |
| `lotes` | 100% | 50% | 100% |
| `reportes` | 100% | 86.11% | 100% |
| `sucursales` | 100% | 85.71% | 100% |
| `utils` | 100% | 95% | 100% |
| `ventas` | 100% | 76.66% | 100% |
| `config` | 99.5% | 93.18% | 100% |
| `pagos` | 98.37% | 84.74% | 100% |
| `jobs` | 98.59% | 87.5% | 100% |
| `middlewares` | 97.84% | 88.23% | 100% |
| `productos` | 96.84% | 77.77% | 100% |
| `empleados` | 96.87% | 76.92% | 100% |
| `proveedores` | 96.55% | 69.23% | 100% |
| `categorias` | 95.83% | 90% | 100% |
| `servicios` | 95.76% | 86.74% | 100% |
| `auth-cliente` | 94.75% | 85% | 100% |
| `chatbot` | 94.33% | 84.55% | 100% |
| `schemas` | 94.93% | 0% | 0% |
| `imagenes` | 46.96% | 80% | 0% |

### Para ejecutar
```bash
cd backend && pnpm run test                  # 510 tests
cd backend && pnpm run test -- --coverage    # Con cobertura
```

## Pasarelas de Pago

### Wompi (Colombia)
- **Estado:** Configurado con sandbox
- **Endpoints:**
  - `POST /pagos/wompi/crear` — Crea transacción Wompi (redirect al checkout)
  - `POST /pagos/wompi/webhook` — Recibe eventos de Wompi
- **Firma HMAC:** Usa `WOMPI_INTEGRITY_SECRET` con formato `referencia + monto + moneda + integrityKey`
- **Configuración:** `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_BASE_URL`

### Stripe
- **Estado:** Configurado con test keys
- **Endpoints:**
  - `POST /pagos/stripe/crear-intent` — Crea PaymentIntent
  - `POST /pagos/stripe/webhook` — Raw body con verificación HMAC
- **Configuración:** `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### MercadoPago
- **Estado:** Configurado con sandbox
- **Endpoints:**
  - `POST /pagos/mercadopago/crear` — Crea preferencia (acepta `ventaId` o `pedidoId`)
  - `POST /pagos/mercadopago/webhook` — Recibe notificaciones de MP
- **Flujo frontend:** Crear venta → API MP → redirect a initPoint → webhook → actualizar estado
- **Configuración:** `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`

### Efectivo
- **Estado:** Implementado (registra venta sin pasarela)
- **Endpoints:** `POST /pagos/efectivo/confirmar`

## Scripts de Base de Datos
- `database/scripts/importar-y-generar.cjs`: Script consolidado (CommonJS) que importa productos desde `INVIMA-MINI.csv` y genera lotes de inventario con fechas de vencimiento. Batch upsert por CUM + recálculo de costos promedios.
- `backend/scripts/generar-mini-csv.mjs`: Genera subconjunto representativo (~56 productos) del CSV INVIMA original (~158K registros). Filtra activos + comerciales, selecciona 4 por grupo ATC.
- `database/seeds/INVIMA-MINI.csv`: Mini-CSV con 56 productos, 14 grupos ATC, 26 KB, con precios de compra/venta.

## Flujo de Importación
1. `cd backend && pnpm run db:seed` → Seeds base (sucursales, proveedores, categorías)
2. `cd backend && node ../database/scripts/importar-y-generar.cjs` → Importa productos del mini-CSV + genera ~120 lotes