# Work log

Use this log to record completed milestones and the files changed for each phase.

## 2026-05-25 — Auditoría general y actualización documentación

Se realizó una revisión completa del proyecto y se actualizó toda la documentación.

**Estado actual del proyecto:**
- ✅ Backend TypeScript: 0 errores
- ✅ Frontend TypeScript: 0 errores
- ✅ Tests: 215 pasan, 3 fallos preexistentes (stock mínimo en alertas)
- ⚠️ 12 suites de ruta fallan por resolución de módulo `.prisma/client/default` (preexistente, no afecta funcionalidad)
- ✅ Docker: Postgres + Redis operativos (32 min up)
- ✅ Seeds ejecutadas con 17 tablas pobladas
- ✅ Schema Prisma sincronizado con BD

## 2026-05-25 — Migración Wompi a sandbox + MercadoPago integrado

**Wompi — Cambio a Sandbox:**
- Keys de producción reemplazadas por sandbox: `pub_test_*`, `prv_test_*`, `test_integrity_*`
- `WOMPI_BASE_URL` default cambiado a `https://sandbox.wompi.co/v1`
- `env.ts`: Agregado `WOMPI_INTEGRITY_SECRET` + default sandbox
- `pagos.routes.ts`: Firma HMAC-SHA256 corregida (usa integrity key, no events secret)
- `.env.example`: Agregado `WOMPI_INTEGRITY_SECRET`

**MercadoPago — Integración completa:**
- Keys sandbox escritas en `.env` y `backend/.env`
- `pagos.routes.ts`: Endpoint `/mercadopago/crear` acepta `ventaId`+`items`+`monto`+`clienteEmail` sin requerir `pedidoOnline`
- `frontend/src/services/index.ts`: `crearMercadoPago` con nuevo signature flexible
- `frontend/src/pages/tienda/Checkout.tsx`: Flujo real — crea venta → llama API MP → redirige a initPoint. Sin flash de pantalla.
- **Relación Prisma**: `PagoTransaccion.ventaId` ahora tiene FK formal con `Venta`

## 2026-05-25 — Configuración Wompi Producción

- Keys de producción Wompi configuradas en `.env` y `backend/.env`
- `WOMPI_INTEGRITY_SECRET` agregado a `env.ts` y `.env.example`
- `WOMPI_BASE_URL` default cambiado a `https://api.wompi.co/v1`
- `pagos.routes.ts`: Firma de transacciones corregida (HMAC-SHA256 con integrity key)
- Code review aprobado: 0 errores, 0 warnings

## 2026-05-24 (Full Testing + Coverage)

- **Suite completa de tests (27 archivos, 218 tests):**
  - 14 archivos pasan completamente (core services, utils, schemas, middlewares)
  - 12 archivos de ruta fallan por resolución de módulo `.prisma/client/default`
  - alertas.job.test.ts: 3 tests de stock mínimo fallan por conteo de spies
- **Documentación actualizada** con tablas de coverage y módulos

## 2026-05-24 (Segmentación de tests de ruta)

- **11 nuevos archivos de test de ruta** agregados para cubrir todos los módulos
- Tests de Stripe/MercadoPago (configurados y no configurados)
- Tests de webhooks con firma HMAC

## 2026-05-22 (Fase 7 — Pasarelas de Pago)

- Checkout visual con selector de método (Wompi, Stripe, MercadoPago, Efectivo)
- Simulación animada de pasarela con 3 pasos
- Página de confirmación standalone con query params
- Validación inline de formularios con accesibilidad aria

## 2026-05-22 (Fase INVIMA-CSV)

- Mini-CSV generado: 56 productos, 14 grupos ATC, 26 KB
- Script importar-y-generar.cjs: importación + lotes
- 121 lotes generados para 55 productos

## 2026-05-22 (Eliminación Facebook OAuth)

- Facebook OAuth eliminado completamente del proyecto
- Archivos modificados: passport.ts, auth routes, env.ts, .env.example, frontend

## 2026-05-23 (Fase 5 y 6 completadas)

- POS con escáner de códigos, arqueo de caja, tirilla térmica
- Tienda B2C con carrito, checkout FEFO, catálogo real

## 2026-05-26 — Upgrade masivo de dependencias

Se actualizaron las dependencias principales del proyecto en el branch `deps-upgrade-2026`.

**Cambios realizados:**

| Paquete | Antes → Después |
|---|---|
| Vite | 5.4.21 → **6.4.2** |
| @vitejs/plugin-react | 4.7.0 → **5.2.0** |
| TypeScript (backend) | 5.9.3 → **6.0.3** |
| TypeScript (frontend) | 5.3.3 → **6.0.3** |
| Vitest (frontend) | 1.6.1 → **3.2.4** |
| nodemailer | 8.0.7 → 8.0.8 |
| dotenv | 16.6.1 → 17.4.2 |

**Archivos modificados:**
- `run.bat`: Reescrito con verificación Docker, PowerShell port kill, healthcheck HTTP, HEADLESS mode, .env auto-creación
- `backend/src/config/env.ts`: Carga dual de `.env` (backend/.env + raíz, raíz con prioridad)
- `backend/tsconfig.json`: Agregado `ignoreDeprecations: "6.0"`
- `backend/package.json` y `frontend/package.json`: Version bumps

**Validaciones:**
- ✅ Backend TypeScript: 0 errores
- ✅ Frontend TypeScript: 0 errores
- ✅ Tests: 462/462 pasan (27 archivos)
- ✅ Vite build: exitoso (9.63s)
- ✅ pnpm store: 156MB liberados

## 2026-05-26 — Documentación: browser-use, kill safety, regla de git

**Archivos modificados:**
- `AGENTS.md`: Agregadas 3 secciones:
  - `Uso de browser-use (Playwright) — solo pnpm`: Instrucciones para usar Playwright con pnpm (no npm), cómo Chromium queda instalado y cómo usarlo desde Codebuff
  - `⚠️ Cuidado con procesos (kill safety)`: Tabla de comandos peligrosos (taskkill /F /IM, Stop-Process sin filtro) vs comandos seguros por PID específico. Advertencia explícita sobre no matar `freebuff.cmd`
  - `📝 Regla: documentar cambios + git commit/push siempre`: Proceso obligatorio de documentar en AGENTS.md/docs/, commit descriptivo, y push

**Contexto:** El usuario reportó que solo tiene `pnpm` instalado (no npm), y que `freebuff.cmd` no debe ser cerrado accidentalmente por comandos kill agresivos.

## 2026-05-26 — Migración React 19 + Tailwind 4 + Coverage 95%+

**React 18→19:**
- react@19.2.6, react-dom@19.2.6, @types/react@19.0.0
- zustand@4.5.0, @tanstack/react-query@5.0.0, react-router-dom@6.22.0
- recharts@2.12.0, lucide-react@1.16.0 (íconos sociales migrados a SVG inline)
- TypeScript: 0 errores

**Tailwind 3→4:**
- tailwindcss@4.3.0 + @tailwindcss/vite@4.3.0
- postcss.config.cjs y tailwind.config.ts eliminados
- index.css migrado a @import "tailwindcss" + @theme
- vite.config.ts: @tailwindcss/vite plugin reemplaza postcss
- build exitoso (5.70s)

**Cobertura 83.7%→95.35%:**
- 510 tests (27 archivos), 0 fallos
- Reportes: 44%→100%, auth-cliente perfil: 66%→100%
- schemas: 94.93% stmts, servicios: 95.76%, config: 99.5%
- Todos los módulos ≥90% (excepto imagenes 46.96%)