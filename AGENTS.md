# FARMACY — AGENTS.md

Guía rápida para desarrolladores IA y humanos que trabajan en este proyecto.

## Quick start (Windows)
1. `setup.bat` — Instala deps, genera Prisma Client, hace db push, corre seeds
2. `.\run.ps1` — Inicia Docker (Postgres + Redis), backend (nodemon :3000), frontend (Vite 6 :5173)
   - Ejecutar directamente desde PowerShell
3. Alternativa manual: `docker compose -f docker-compose.dev.yml up -d` + `cd backend && pnpm run dev` + `cd frontend && pnpm run dev`

## Services + ports
| Service | Port | Container |
|---|---|---|
| PostgreSQL 15 | 5432 | `farmacy_postgres_dev` |
| Redis 7 | 6379 | `farmacy_redis_dev` |
| pgAdmin | 5050 | `farmacy_pgadmin` (admin@farmacy.co / admin) |
| Backend (Express) | 3000 | Corre en host via nodemon |
| Frontend (Vite) | 5173 | Proxy `/api` → 127.0.0.1:3000 |

## Prisma + database (Colombian INVIMA/CUM Integration)
- Schema: `database/prisma/schema.prisma`
- Todos los scripts usan `--schema=../database/prisma/schema.prisma`
- **17 modelos:** Sucursal, Empleado, Categoria, Producto (35+ campos INVIMA), Lote, Proveedor, OrdenCompra, Venta, PagoTransaccion, etc.
- Producto tiene `cum` (unique), `registroInvima`, `principioActivo`, `atc`, `esMuestraMedica`, `alergenos`, `advertencias`
- Muestras médicas (`esMuestraMedica: true`) bloqueadas en ruta `/buscar`
- Seed: `pnpm run db:seed` desde `backend/`

## Pasarelas de pago
| Pasarela | Sandbox Keys | Estado |
|---|---|---|
| Wompi | `pub_test_*`, `prv_test_*`, `test_integrity_*` | ✅ Sandbox configurado |
| Stripe | `pk_test_*`, `sk_test_*`, `whsec_*` | ✅ Test keys |
| MercadoPago | `TEST-*` access token + public key | ✅ Sandbox configurado |
| Efectivo | — | ✅ Sin pasarela |

## Credenciales de desarrollo (seeds)
| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@farmacy.co | Admin@1234 |
| Farmacéuta | farmaceuta@farmacy.co | Farm@1234 |
| Auxiliar | auxiliar@farmacy.co | Aux@1234 |
| Cliente demo | cliente@ejemplo.co | Cliente@1234 |

## Variables de entorno esenciales
- `DATABASE_URL` — PostgreSQL (requerida)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_CLIENTE_SECRET` — mínimo 32 caracteres cada una
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth social (opcional)
- `WOMPI_*` — Wompi (opcional para sandbox)
- `STRIPE_*` — Stripe (opcional)
- `MERCADOPAGO_*` — MercadoPago (opcional)

## Tech stack
- **Runtime:** Node.js v24.15.0 + pnpm v11.2.2
- **Backend:** Express 4 + TypeScript 6.0 + Prisma 5.22
- **Frontend:** React 19 + TypeScript 6.0 + Vite 6.4 + Tailwind CSS 4
- **Build:** @tailwindcss/vite plugin (reemplaza postcss + autoprefixer)
- **Testing:** Vitest v3 (510 tests, 95.35% cobertura)

## Script entrypoints
- Backend: `backend/src/server.ts` (conecta DB antes de HTTP)
- Frontend: `frontend/src/main.tsx` (React 18 + QueryClient)
- Tests: Vitest v3 en `backend/` + `frontend/` (27 archivos, 462 tests, 83.7% cobertura)
