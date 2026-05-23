# Architecture overview

## Monorepo layout
- \backend/: Express + TypeScript API, Prisma ORM, auth, POS, inventory, payments. Capas separadas de schemas y services.
- \frontend/: React + Vite + Tailwind UI for B2C store and admin console.
- database/: Prisma schema and seeds.
- Root scripts: setup.bat, \run.bat, docker-compose.dev.yml.

## Entry points
- Backend: \backend/src/server.ts
- Frontend: \frontend/src/main.tsx

## Backend module catalog (verified)
| Module | Route prefix | File | Status |
|---|---|---|---|
| auth | /api/v1/auth | \backend/src/modules/auth/auth.routes.ts | active |
| auth-cliente | /api/v1/clientes/auth | \backend/src/modules/auth-cliente/authCliente.routes.ts | active |
| auth-cliente perfil | /api/v1/clientes/auth | \backend/src/modules/auth-cliente/authCliente.perfil.routes.ts | active |
| categorias | /api/v1/categorias | \backend/src/modules/categorias/categorias.routes.ts | active |
| sucursales | /api/v1/sucursales | \backend/src/modules/sucursales/sucursales.routes.ts | active |
| productos | /api/v1/productos | \backend/src/modules/productos/productos.routes.ts | active |
| lotes | /api/v1/lotes | \backend/src/modules/lotes/lotes.routes.ts | active |
| inventario | /api/v1/inventario | \backend/src/modules/inventario/inventario.routes.ts | active |
| ventas | /api/v1/ventas | \backend/src/modules/ventas/ventas.routes.ts | active |
| caja | /api/v1/caja | \backend/src/modules/caja/caja.routes.ts | active |
| clientes (admin) | /api/v1/clientes | \backend/src/modules/clientes/clientes.admin.routes.ts | active |
| empleados | /api/v1/empleados | \backend/src/modules/empleados/empleados.routes.ts | active |
| proveedores | /api/v1/proveedores | \backend/src/modules/proveedores/proveedores.routes.ts | active |
| compras | /api/v1/compras | \backend/src/modules/compras/compras.routes.ts | active |
| reportes | /api/v1/reportes | \backend/src/modules/reportes/reportes.routes.ts | active |
| chatbot | /api/v1/chatbot | \backend/src/modules/chatbot/chatbot.routes.ts | active |
| pagos | /api/v1/pagos | \backend/src/modules/pagos/pagos.routes.ts | active |
| imagenes | /api/v1/imagenes | \backend/src/modules/imagenes/imagenes.routes.ts | active |

## Frontend pages and route map (verified)
- Registered in \frontend/src/app.tsx: all pages used by public, auth, cliente and admin routes.
- \frontend/src/pages/_shared.tsx: helper for placeholder pages (active utility).
- *All orphan and duplicate placeholder pages were removed during Phase 0.*

## Services (dominio)
- \backend/src/services/inventario.service.ts: Lógica FEFO (First Expired, First Out) y cálculo de costo promedio.
- \backend/src/services/ventas.service.ts: Registro de ventas con integración FEFO y puntos de fidelidad.

## Validaciones Zod
- \backend/src/schemas/inventario.schema.ts: Schemas para creación de lotes y ajustes de inventario.
- \backend/src/schemas/productos.schema.ts: Schemas para creación/actualización de productos.
- \backend/src/schemas/ventas.schema.ts: Schema para registro de ventas con items.
- Todos exportados centralizadamente desde \backend/src/schemas/index.ts.

## OAuth (implementado, requiere credenciales)
- **Google OAuth**: \backend/src/config/passport.ts configura estrategia Google; rutas en \backend/src/modules/auth-cliente/authCliente.routes.ts (/google, /google/callback).
- **Login por correo**: Registro tradicional con email + contraseña (bcrypt, verificación por email, recuperación de contraseña).
- Activación: Descomentar las variables en .env:
  - `GOOGLE_CLIENT_ID` — Client ID de Google Cloud Console
  - `GOOGLE_CLIENT_SECRET` — Client Secret de Google Cloud Console
  - `GOOGLE_CALLBACK_URL` — http://localhost:3000/api/v1/clientes/auth/google/callback

## Jobs (CRON)
- \backend/src/jobs/alertas.ts: Verificación diaria de lotes próximos a vencer (30/15/0 días) y stock crítico. Inactivo — requiere conexión en server.ts.

## Source of truth for env
- Source of truth: root .env.
- \backend/.env is treated as a compatibility fallback for scripts and developer tooling.
