# Architecture overview

## Monorepo layout
- `backend/`: Express + TypeScript API, Prisma ORM, auth, POS, inventory, payments.
- `frontend/`: React + Vite + Tailwind UI for B2C store and admin console.
- `database/`: Prisma schema and seeds.
- Root scripts: `setup.bat`, `run.bat`, `docker-compose.dev.yml`.

## Entry points
- Backend: `backend/src/server.ts`
- Frontend: `frontend/src/main.tsx`

## Backend module catalog (verified)
| Module | Route prefix | File | Status |
|---|---|---|---|
| auth | `/api/v1/auth` | `backend/src/modules/auth/auth.routes.ts` | active |
| auth-cliente | `/api/v1/clientes/auth` | `backend/src/modules/auth-cliente/authCliente.routes.ts` | active |
| auth-cliente perfil | `/api/v1/clientes/auth` | `backend/src/modules/auth-cliente/authCliente.perfil.routes.ts` | active |
| categorias | `/api/v1/categorias` | `backend/src/modules/categorias/categorias.routes.ts` | active |
| sucursales | `/api/v1/sucursales` | exported from `backend/src/modules/inventario/inventario.routes.ts` | active (bundled) |
| productos | `/api/v1/productos` | `backend/src/modules/productos/productos.routes.ts` | active |
| lotes | `/api/v1/lotes` | exported from `backend/src/modules/inventario/inventario.routes.ts` | active (bundled) |
| inventario | `/api/v1/inventario` | exported from `backend/src/modules/inventario/inventario.routes.ts` | active (bundled) |
| ventas | `/api/v1/ventas` | `backend/src/modules/ventas/ventas.routes.ts` | active |
| caja | `/api/v1/caja` | `backend/src/modules/caja/caja.routes.ts` | active |
| clientes (admin) | `/api/v1/clientes` | exported from `backend/src/modules/inventario/inventario.routes.ts` | active (bundled) |
| empleados | `/api/v1/empleados` | exported from `backend/src/modules/inventario/inventario.routes.ts` | active (bundled) |
| proveedores | `/api/v1/proveedores` | exported from `backend/src/modules/inventario/inventario.routes.ts` | active (bundled) |
| compras | `/api/v1/compras` | exported from `backend/src/modules/inventario/inventario.routes.ts` | active (bundled) |
| reportes | `/api/v1/reportes` | exported from `backend/src/modules/inventario/inventario.routes.ts` | active (bundled) |
| chatbot | `/api/v1/chatbot` | `backend/src/modules/chatbot/chatbot.routes.ts` | active |
| pagos | `/api/v1/pagos` | `backend/src/modules/pagos/pagos.routes.ts` | active |
| imagenes | `/api/v1/imagenes` | `backend/src/modules/imagenes/imagenes.routes.ts` | active |

## Frontend pages and route map (verified)
- Registered in `frontend/src/app.tsx`: all pages used by public, auth, cliente and admin routes.
- `frontend/src/pages/_shared.tsx`: helper for placeholder pages (active utility).

### Frontend duplicates / orphans detected
- `frontend/src/pages/tienda/DetalleProducto.tsx`: duplicate of `ProductoDetalle.tsx` naming-wise and not imported in router.
- `frontend/src/pages/tienda/CarritoCompleto.tsx`: not imported in router.
- `frontend/src/pages/tienda/CheckoutCompleto.tsx`: not imported in router.
- `frontend/src/pages/tienda/CatalogoCompleto.tsx`: not imported in router.
- `frontend/src/pages/tienda/NoEncontradoPlaceholder.tsx`: not imported in router.
- `frontend/src/pages/admin/caja/InvoicePreview.tsx`: utility component not directly routed.

### Stub coverage detected
- Multiple routed pages still use `createPlaceholderPage` (`frontend/src/pages/_shared.tsx`).
- Core store routes (`Inicio`, `Catalogo`, `ProductoDetalle`, `Carrito`, `Checkout`) and admin POS (`PuntoVenta`) have concrete implementations.

## Config normalization (Phase 0)
- Official local backend port aligned to `3000`:
  - `.env.example` now uses `PORT=3000` and `VITE_API_URL=http://localhost:3000/api/v1`.
  - `frontend/vite.config.ts` proxy target remains `http://127.0.0.1:3000`.
  - `backend/.env` and root `.env` already used `PORT=3000`.
- `run.bat` now copies root `.env` to `backend/.env` when missing.

## Source of truth for env
- Source of truth: root `.env`.
- Reason: backend loads env explicitly from root in `backend/src/config/env.ts` via `dotenv.config({ path: '../../../.env' })`.
- `backend/.env` is treated as compatibility fallback for scripts and developer tooling.

## OAuth and payments env vars
- Verified consistent names between `backend/src/config/env.ts`, `backend/src/config/passport.ts`, and `backend/src/modules/pagos/pagos.routes.ts`:
  - OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL`.
  - Wompi: `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_BASE_URL`.
  - Stripe: `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
  - MercadoPago: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`.

## Pending explicit approval before deletions
- Remove unused frontend files listed in "duplicates / orphans detected".
- Split `backend/src/modules/inventario/inventario.routes.ts` into bounded modules (lotes, inventario, compras, proveedores, etc.).
