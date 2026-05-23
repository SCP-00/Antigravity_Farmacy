# Architecture overview

## Monorepo layout
- ackend/: Express + TypeScript API, Prisma ORM, auth, POS, inventory, payments. Capas separadas de schemas y services.
- rontend/: React + Vite + Tailwind UI for B2C store and admin console.
- database/: Prisma schema and seeds.
- Root scripts: setup.bat, un.bat, docker-compose.dev.yml.

## Entry points
- Backend: ackend/src/server.ts
- Frontend: rontend/src/main.tsx

## Backend module catalog (verified)
| Module | Route prefix | File | Status |
|---|---|---|---|
| auth | /api/v1/auth | ackend/src/modules/auth/auth.routes.ts | active |
| auth-cliente | /api/v1/clientes/auth | ackend/src/modules/auth-cliente/authCliente.routes.ts | active |
| auth-cliente perfil | /api/v1/clientes/auth | ackend/src/modules/auth-cliente/authCliente.perfil.routes.ts | active |
| categorias | /api/v1/categorias | ackend/src/modules/categorias/categorias.routes.ts | active |
| sucursales | /api/v1/sucursales | ackend/src/modules/sucursales/sucursales.routes.ts | active |
| productos | /api/v1/productos | ackend/src/modules/productos/productos.routes.ts | active |
| lotes | /api/v1/lotes | ackend/src/modules/lotes/lotes.routes.ts | active |
| inventario | /api/v1/inventario | ackend/src/modules/inventario/inventario.routes.ts | active |
| ventas | /api/v1/ventas | ackend/src/modules/ventas/ventas.routes.ts | active |
| caja | /api/v1/caja | ackend/src/modules/caja/caja.routes.ts | active |
| clientes (admin) | /api/v1/clientes | ackend/src/modules/clientes/clientes.admin.routes.ts | active |
| empleados | /api/v1/empleados | ackend/src/modules/empleados/empleados.routes.ts | active |
| proveedores | /api/v1/proveedores | ackend/src/modules/proveedores/proveedores.routes.ts | active |
| compras | /api/v1/compras | ackend/src/modules/compras/compras.routes.ts | active |
| reportes | /api/v1/reportes | ackend/src/modules/reportes/reportes.routes.ts | active |
| chatbot | /api/v1/chatbot | ackend/src/modules/chatbot/chatbot.routes.ts | active |
| pagos | /api/v1/pagos | ackend/src/modules/pagos/pagos.routes.ts | active |
| imagenes | /api/v1/imagenes | ackend/src/modules/imagenes/imagenes.routes.ts | active |

## Frontend pages and route map (verified)
- Registered in rontend/src/app.tsx: all pages used by public, auth, cliente and admin routes.
- rontend/src/pages/_shared.tsx: helper for placeholder pages (active utility).
- *All orphan and duplicate placeholder pages were removed during Phase 0.*

## Source of truth for env
- Source of truth: root .env.
- ackend/.env is treated as a compatibility fallback for scripts and developer tooling.
