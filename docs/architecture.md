# Architecture overview

## Monorepo layout
- `backend/`: Express + TypeScript API, Prisma ORM, auth, POS, inventory, payments.
- `frontend/`: React + Vite + Tailwind UI for B2C store and admin console.
- `database/`: Prisma schema and SQL/seed helpers.
- Root scripts: `setup.bat`, `run.bat`, `docker-compose.dev.yml`.

## Entry points
- Backend: `backend/src/server.ts`
- Frontend: `frontend/src/main.tsx`

## Backend modules (registered in `backend/src/app.ts`)
- `auth`: `backend/src/modules/auth/auth.routes.ts`
- `auth-cliente`: `backend/src/modules/auth-cliente/authCliente.routes.ts`
- `auth-cliente perfil`: `backend/src/modules/auth-cliente/authCliente.perfil.routes.ts`
- `categorias`: `backend/src/modules/categorias/categorias.routes.ts`
- `productos`: `backend/src/modules/productos/productos.routes.ts`
- `ventas`: `backend/src/modules/ventas/ventas.routes.ts`
- `caja`: `backend/src/modules/caja/caja.routes.ts`
- `chatbot`: `backend/src/modules/chatbot/chatbot.routes.ts`
- `pagos`: `backend/src/modules/pagos/pagos.routes.ts`
- `imagenes`: `backend/src/modules/imagenes/imagenes.routes.ts`
- `inventario bundle`: `backend/src/modules/inventario/inventario.routes.ts`
  - Exports: lotes, inventario, proveedores, compras, clientes admin, empleados, sucursales, reportes

## Frontend routes (registered in `frontend/src/app.tsx`)
- Public store: inicio, catalogo, producto detalle, carrito, sucursales, contacto, quienes somos, privacidad, terminos
- Auth: login cliente/admin, registro, recuperar/reset password, verificar email
- Customer protected: checkout, confirmacion pago, cuenta, pedidos, favoritos
- Admin: dashboard, caja/POS, inventario, compras, clientes, proveedores, empleados, reportes, configuracion

## Known config mismatches (Phase 0)
- Ports differ between `.env.example` (3001), `backend/.env` (3000), Vite proxy (3000), and `run.bat` output (3001).
- `frontend/tsconfig.json` excludes admin pages and some store pages; confirm if intentional.

## Runtime services
- PostgreSQL (dev via `docker-compose.dev.yml`)
- Redis (dev via `docker-compose.dev.yml`)

## Auth and payments
- Employees: JWT auth (RBAC in backend).
- Customers: JWT + optional OAuth (Google/Facebook).
- Payments: Wompi, Stripe, MercadoPago endpoints and webhooks.
