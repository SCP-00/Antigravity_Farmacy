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