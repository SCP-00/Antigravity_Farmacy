# Architecture overview

## Monorepo layout
- \backend/: Express + TypeScript API, Prisma ORM, auth, POS, inventory, payments. Capas separadas de schemas y services.
- \frontend/: React + Vite + Tailwind UI for B2C store and admin console.
- database/: Prisma schema and seeds.
- Root scripts: setup.bat, \run.bat, docker-compose.dev.yml.

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

## Backend module catalog (verified)
| Module | Route prefix | File | Status |
|---|---|---|---|
| auth | /api/v1/auth | `backend/src/modules/auth/auth.routes.ts` | active |
| auth-cliente | /api/v1/clientes/auth | `backend/src/modules/auth-cliente/authCliente.routes.ts` | active |
| auth-cliente perfil | /api/v1/clientes/auth | `backend/src/modules/auth-cliente/authCliente.perfil.routes.ts` | active |
| categorias | /api/v1/categorias | `backend/src/modules/categorias/categorias.routes.ts` | active |
| sucursales | /api/v1/sucursales | `backend/src/modules/sucursales/sucursales.routes.ts` | active |
| productos | /api/v1/productos | `backend/src/modules/productos/productos.routes.ts` | active |
| lotes | /api/v1/lotes | `backend/src/modules/lotes/lotes.routes.ts` | active |
| inventario | /api/v1/inventario | `backend/src/modules/inventario/inventario.routes.ts` | active |
| ventas | /api/v1/ventas | `backend/src/modules/ventas/ventas.routes.ts` | active |
| caja | /api/v1/caja | `backend/src/modules/caja/caja.routes.ts` | active |
| clientes (admin) | /api/v1/clientes | `backend/src/modules/clientes/clientes.admin.routes.ts` | active |
| empleados | /api/v1/empleados | `backend/src/modules/empleados/empleados.routes.ts` | active |
| proveedores | /api/v1/proveedores | `backend/src/modules/proveedores/proveedores.routes.ts` | active |
| compras | /api/v1/compras | `backend/src/modules/compras/compras.routes.ts` | active |
| reportes | /api/v1/reportes | `backend/src/modules/reportes/reportes.routes.ts` | active |
| chatbot | /api/v1/chatbot | `backend/src/modules/chatbot/chatbot.routes.ts` | active |
| pagos | /api/v1/pagos | `backend/src/modules/pagos/pagos.routes.ts` | active |
| imagenes | /api/v1/imagenes | `backend/src/modules/imagenes/imagenes.routes.ts` | active |

## Services (dominio)
- \backend/src/services/inventario.service.ts: Lógica FEFO (First Expired, First Out) y cálculo de costo promedio.
- \backend/src/services/ventas.service.ts: Registro de ventas con integración FEFO y puntos de fidelidad.

## Validaciones Zod
- \backend/src/schemas/inventario.schema.ts: Schemas para creación de lotes y ajustes de inventario.
- \backend/src/schemas/productos.schema.ts: Schemas para creación/actualización de productos.
- Todos exportados centralizadamente desde \backend/src/schemas/index.ts.

## Jobs (CRON)
- \backend/src/jobs/alertas.ts: Verificación diaria (7:00 AM) de lotes próximos a vencer con umbrales escalonados (30/15/0 días) y stock crítico. Crea alertas en BD, notifica admins por email.

## Testing
- **Framework:** Vitest v3 + supertest para tests de integración
- **27 archivos de test** (218 tests: 215 pasan, 3 fallos preexistentes en alertas)
- **14 suites pasan completamente**, 12 fallan por resolución de módulo `.prisma/client/default`

### Tests que pasan (14 archivos, ~215 tests)

| Archivo | Tests | Descripción |
|---|---|---|
| `env.test.ts` | 6 | Defaults, validación, env personalizados |
| `database.test.ts` | 4 | connectDB, disconnectDB, error handling |
| `redis.test.ts` | 14 | Instancia, cache.get/set/del/delPattern |
| `mailer.test.ts` | 6 | Plantillas email, sendEmail |
| `passport.test.ts` | 3 | Google OAuth config/omitido |
| `jwt.utils.test.ts` | 10 | Generar/verificar tokens, refresh |
| `respuesta.utils.test.ts` | 19 | ok, creado, error, noEncontrado, lista, pagina |
| `logger.test.ts` | 5 | Logger config |
| `middlewares.test.ts` | 19 | autenticar, autorizar, validarCuerpo, manejarErrores |
| `schemas.test.ts` | 36 | Schemas inventario, productos, ventas |
| `inventario.service.test.ts` | 10 | FEFO, costo promedio |
| `ventas.service.test.ts` | 5 | Registro venta, puntos fidelidad |
| `interacciones.service.test.ts` | 30 | Interacciones medicamentosas, alérgenos |
| `chatbot.routes.test.ts` | 37 | Menú, keywords, flujo estados |
| `alertas.job.test.ts` | 14 (3 fail) | Alertas vencimiento + stock mínimo |

| Módulo / Archivo | % Statements | % Branches | % Funciones |
|---------|:----------:|:---------:|:----------:|
| **Core** | | | |
| env.ts | 100% | 100% | 100% |
| redis.ts | 100% | 100% | 100% |
| mailer.ts | 100% | 100% | 100% |
| database.ts | 96.15% | 80% | 100% |
| passport.ts | 45.23% | 100% | 100% |
| **Middleware** | | | |
| middlewares/index.ts | 97.84% | 88% | 100% |
| **Jobs** | | | |
| alertas.ts | 98.59% | 90.69% | 100% |
| **Services** | | | |
| inventario.service.ts | 100% | 90.9% | 100% |
| ventas.service.ts | 93.15% | 81.25% | 100% |
| interacciones.service.ts | 95.32% | 87.5% | 100% |
| **Utils** | | | |
| jwt.utils.ts | 100% | 100% | 100% |
| respuesta.utils.ts | 100% | 100% | 100% |
| logger.ts | 100% | 0%* | 100% |
| **Schemas** | | | |
| inventario.schema.ts | 100% | 100% | 100% |
| productos.schema.ts | 100% | 100% | 100% |
| ventas.schema.ts | 100% | 100% | 100% |
| **Rutas — Cobertura ≥90%** | | | |
| app.ts | 100% | 100% | 100% |
| caja.routes.ts | 100% | 60% | 100% |
| clientes.admin.routes.ts | 100% | 100% | 100% |
| inventario.routes.ts | 100% | 75% | 100% |
| lotes.routes.ts | 100% | 50% | 100% |
| reportes.routes.ts | 100% | 87.5% | 100% |
| sucursales.routes.ts | 100% | 85.71% | 100% |
| pagos.routes.ts | 98.84% | 90% | 100% |
| empleados.routes.ts | 96.87% | 76.92% | 100% |
| productos.routes.ts | 96.84% | 77.77% | 100% |
| proveedores.routes.ts | 96.29% | 66.66% | 100% |
| categorias.routes.ts | 95.83% | 90% | 100% |
| **Rutas — Cobertura 80-89%** | | | |
| auth-cliente.routes.ts | 86.34% | 80.95% | 100% |
| compras.routes.ts | 81% | 75% | 100% |
| auth.routes.ts | 79.45% | 75% | 100% |
| **Rutas — Cobertura <80%** | | | |
| ventas.routes.ts | 89.23% | 74.07% | 100% |
| chatbot.routes.ts | 68.39% | 84.49% | 66.66% |
| auth-cliente.perfil.routes.ts | 59.67% | 50% | 100% |
| imagenes.routes.ts | 46.96% | 80% | 0% |

\* logger.ts branches 0% porque usa delegates de winston sin bifurcaciones propias

**Coverage general (última medición):** 71.03% statements, 83.14% branches, 82.71% functions
(Solo se midió coverage de los tests que corren — 12 suites fallan por resolución de Prisma)

### Archivos sin cobertura
- `server.ts`: entrypoint (conexión DB + HTTP start)
- `scripts/`: test-comprehensive.ts, test-e2e.ts
- `schemas/index.ts`: solo re-exporta

### Tests que fallan (12 archivos de ruta)
- **Causa:** `Error: Cannot find module '.prisma/client/default'`
- **Motivo:** Prisma Client se genera en directorio personalizado (`output = "../../backend/node_modules/.prisma/client"`) que Vitest no resuelve automáticamente
- **Workaround:** `cd backend && pnpm run db:generate` antes de ejecutar tests
- **Impacto:** Solo tests de integración — no afecta desarrollo ni producción

### Para ejecutar
```bash
cd backend && pnpm run test                  # Todos los tests
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