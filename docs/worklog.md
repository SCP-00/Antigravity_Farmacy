# Work log

Use this log to record completed milestones and the files changed for each phase.

## 2026-05-22
- Created documentation module scaffolding in `docs/`.
- Added Phase 0 checklist and architecture overview.

## 2026-05-23
- Completed Phase 0 inventory and route mapping from `backend/src/app.ts` and `frontend/src/app.tsx`.
- Normalized local port docs/config to `3000` in `.env.example`.
- Updated `run.bat` to copy root `.env` to `backend/.env` when missing.
- Added ADR: `docs/adr/0001-env-source-of-truth-and-ports.md`.
- Documented frontend duplicates/orphans and deferred deletion pending explicit approval.

## 2026-05-22
- **Fase 0 Finalizada**: Se corrigieron todos los errores estrictos de TypeScript (ny implícitos, tipos de retorno en routers). Archivos huérfanos del frontend eliminados con éxito.
- **Fase 1 Iniciada**: 
  - Se dividió el mega-router inventario.routes.ts en 8 submódulos independientes.
  - Se extrajeron las validaciones Zod a ackend/src/schemas/.
  - Se implementó InventarioService (ackend/src/services/inventario.service.ts) para centralizar la lógica FEFO y el cálculo de costo promedio.
  - Seeds y migraciones verificadas como idempotentes. RolEmpleado sincronizado. Fase 1 completada.

## 2026-05-22
- **Fase 1 Finalizada**: 
  - Resolución de errores de variables de entorno y conexión (ECONNREFUSED superado).
  - Extracción exitosa de lógica de ventas al servicio de dominio VentasService.
  - Backend, Frontend, PostgreSQL y Redis operando armónicamente.
- **Fase 2 Iniciada**: 
  - Se formalizó la excepción de mantener cryptjs en lugar de Argon2 por simplicidad técnica en entornos Windows.
  - Siguiente enfoque: Reforzar el RBAC (Control de Acceso Basado en Roles) y manejo seguro de tokens en Redis.

## 2026-05-23
- **Fase 1 Finalizada**: 
  - Resolución de errores de variables de entorno y conexión (ECONNREFUSED superado).
  - Extracción exitosa de lógica de ventas al servicio de dominio VentasService.
  - Backend, Frontend, PostgreSQL y Redis operando armónicamente.
- **Fase 2 Iniciada**: 
  - Se formalizó la excepción de mantener cryptjs en lugar de Argon2 por simplicidad técnica en entornos Windows.
  - Siguiente enfoque: Reforzar el RBAC (Control de Acceso Basado en Roles) y manejo seguro de tokens en Redis.

## 2026-05-23 (Fase 2 - Update)
- Se implementó seguridad robusta y RBAC:
  - **Blacklisting en Redis:** Todo Logout invalida el token permanentemente (evitando reutilización).
  - **Rotación de Refresh Tokens:** Los tokens de refresco son de un solo uso para prevenir Replay Attacks.
  - **Auditoría RBAC:** Accesos a rutas prohibidas generan registros automáticos en logsActividad con advertencias del loggerHttp.
  - Endpoint seguro de logout implementado para tienda B2C.
  - OAuth Google/Facebook implementado en código (passport.ts + rutas /google /facebook). Solo falta proveer credenciales en .env para activar.

## 2026-05-22 (Auditoría docs vs código)
- **Sincronización documentación vs código verificada:**
  - 18 módulos backend ✅ todos registrados en app.ts
  - Servicios InventarioService + VentasService ✅ operativos
  - Schemas Zod (inventario, productos, ventas) ✅ creados
  - RBAC + Redis blacklisting + Refresh rotation ✅ implementados
- **Discrepancias corregidas:**
  - `plan.md`: OAuth marcado como completado (código listo, credenciales pendientes)
  - `docs/phase-0-checklist.md`: Nota del mega-router actualizada (ya dividido en Fase 1)
  - Archivos huérfanos eliminados: `database/seeds/roles.seed.ts`, `backend/src/data/catalogo.ts`, `backend/src/jobs/index.ts`
  - Esta entrada de worklog añadida para mantener trazabilidad

## 2026-05-22 (Eliminación Facebook OAuth)
- **Facebook OAuth eliminado completamente del proyecto.**
- Archivos modificados:
  - `backend/src/config/passport.ts`: Eliminada estrategia FacebookStrategy y su configuración
  - `backend/src/modules/auth-cliente/authCliente.routes.ts`: Eliminadas rutas /facebook y /facebook/callback
  - `backend/src/config/env.ts`: Eliminadas variables FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_CALLBACK_URL
  - `.env.example`: Eliminada sección OAuth Facebook
  - `frontend/src/services/index.ts`: Eliminado `facebookUrl()`
  - `frontend/src/hooks/index.ts`: Eliminado `facebookUrl` del hook `useAuthCliente()`
  - `frontend/src/pages/auth/LoginCliente.tsx`: Eliminado botón "Continuar con Facebook"
  - `docs/architecture.md`: Actualizada sección OAuth (solo Google + correo)
  - `plan.md`: Actualizada línea de OAuth (solo Google)
  - Dependencias `passport-facebook` y `@types/passport-facebook` desinstaladas

## 2026-05-23 (Fases 5 y 6 completadas)
- **Fase 5 (POS y Caja) Finalizada**:
  - Implementación del modal de Arqueo y Cierre de Caja calculando diferencias automáticas (HistorialCaja.tsx).
  - Generación visual de Tirilla Térmica POS imprimible tras registrar una venta (InvoicePreview.tsx).
  - Flujo fluido entre escáner de códigos de barras, carrito POS y cobro.
- **Fase 6 (Tienda B2C) Funcional**:
  - Se conectó el Catálogo, Carrito y Mis Pedidos a la Base de Datos real.
  - Implementación del flujo de "Checkout" reservando stock y deduciendo con método FEFO.
  - El sistema exige ahora validación o login según sea configurado.

## 2026-05-22 (Fase INVIMA-CSV completada)
- **Mini-CSV INVIMA generado** con 56 productos representativos de 14 grupos ATC (26 KB vs 73 MB original)
- **Script `backend/scripts/generar-mini-csv.mjs`**: Filtra productos activos comerciales, selecciona 4 por grupo ATC, asigna precios realistas
- **`database/seeds/INVIMA-MINI.csv`**: Mini-CSV con preciocompra y precioventa
- **Script `database/scripts/importar-y-generar.cjs`**: Script consolidado (CommonJS) que importa productos del mini-CSV y genera lotes de inventario
- **Lotes generados**: 121 lotes para 55 productos (distribuidos en 2 sucursales, fechas de vencimiento variadas)
- **Recálculo de costos promedios**: 55 productos actualizados automáticamente

## 2026-05-22 (Fase 7 completada)
- **Fase 7 — Pasarelas de Pago** implementada en modo Sandbox/Demo:
  - `frontend/src/pages/tienda/Checkout.tsx`: Rediseño completo con selector visual de método de pago (Wompi, Stripe, MercadoPago, Efectivo), flujo de simulación con loading animado por pasos, indicador de progreso de checkout, códigos de descuento, y redención de puntos fidelidad
  - `frontend/src/pages/tienda/ConfirmacionPago.tsx`: Página standalone que lee query params `estado`/`pedido` y muestra resultado (aprobado/rechazado/pendiente) con diseño responsivo
  - Flujo: Selección de método → Simulación de pasarela con 3 pasos → Registro de venta → Confirmación con número de pedido y puntos ganados
  - Todos los flujos son simulados (sandbox educativo), conectados al backend real para registro de ventas

## 2026-05-22 (Validación Checkout + Test run.bat)
- **Validación de formularios agregada a Checkout.tsx**:
  - Validación inline de 4 campos (nombre, email, teléfono formato Colombia, dirección) con mensajes específicos
  - Estados `onBlur` para validación en vivo (solo muestra errores después de tocar el campo)
  - Estilos de error: borde rojo, `ring-red`, ícono `AlertCircle` en inputs inválidos
  - `InputError`, `SkeletonPago` (shimmer loading), `ErrorCard` (error con reintentar/volver)
  - `aria-invalid` y `aria-describedby` para accesibilidad
  - TypeScript sin errores ✅
- **Ejecución de run.bat — Problemas encontrados y corregidos**:
  - ❌ `backend/.env` faltante → Corregido: copiado desde `.env.example`
  - ❌ Prisma Client `EPERM` en engine library → Corregido: cambiado a `engineType = "binary"` en `schema.prisma`
  - ❌ Puerto 3000 ocupado por PID residual → Corregido: limpieza con PowerShell
  - ✅ Backend inicia correctamente, DB conecta, Passport + Jobs configurados
  - ✅ Frontend Vite sirve en localhost:5173 sin errores
  - ⚠️ `run.bat` usa `npm` en vez de `pnpm` (funciona, pero debería migrarse)
  - ⚠️ `run.bat` no verifica Docker Desktop antes de iniciar

## 2026-05-24 (Full Testing + Coverage)
- **Suite completa de tests unitarios (234 tests, 16 archivos):**
  - `app.test.ts` (16 tests): Health check, 404, CORS, helmet, rutas protegidas, categorías, chatbot, productos/buscar
  - `chatbot.routes.test.ts` (37 tests): Menú principal (8 opciones), detección por keywords, flujo de estados (buscar, faq, interacciones), FAQ numérica + keywords, POST /interacciones, GET /producto/:id, GET /horario
  - `interacciones.service.test.ts` (30 tests): verificarInteracciones (13), verificarAlergenos (9), recomendarSimilares (5), obtenerPrincipiosActivos (3)
  - `schemas.test.ts` (36 tests): Schemas de inventario, productos y ventas con todos los edge cases
  - `middlewares.test.ts` (19 tests): autenticar, autenticarCliente, autorizar, validarCuerpo, validarQuery, manejarErrores, limitarPeticiones
  - `respuesta.utils.test.ts` (19 tests): ok, creado, error, noEncontrado, lista, pagina, serverError, noAutorizado
  - `redis.test.ts` (14 tests): instancia Redis, connect, cache.get/set/del/delPattern
  - `alertas.job.test.ts` (14 tests)
  - `inventario.service.test.ts` (10 tests)
  - `jwt.utils.test.ts` (10 tests): generar/verificar tokens empleado y cliente, refresh tokens
  - `database.test.ts` (4 tests): connectDB, disconnectDB, error handling
  - `env.test.ts` (6 tests): defaults, env vars personalizados, validación NODE_ENV/JWT/DATABASE_URL
  - `mailer.test.ts` (6 tests): plantillas email, sendEmail
  - `logger.test.ts` (5 tests)
  - `passport.test.ts` (3 tests): Google OAuth configurado/omitido, warning log
- **Coverage core:** env (100%), redis (100%), mailer (100%), schemas (94.93%), middlewares (97.84%), jwt.utils (100%), respuesta.utils (100%), inventario.service (100%), interacciones.service (95.32%), alertas (98.59%)
- **Fix preexistente:** ventas.service.test.ts — puntos de fidelidad calculados a $100 COP, no $1000
- **Documentación actualizada:** `docs/architecture.md` — tabla de coverage añadida

## 2026-05-24 (Rutas restantes + Coverage full)
- **Nuevos tests de rutas (11 archivos, +228 tests, total 462/462):**
  - `auth.routes.test.ts` — login, refresh, logout, me
  - `categorias-sucursales.routes.test.ts` — CRUD categorías y sucursales
  - `caja-clientes.routes.test.ts` — apertura/cierre caja, historial, clientes admin
  - `productos.routes.test.ts` — buscar público, CRUD admin, filtros
  - `ventas.routes.test.ts` — dashboard, listado, crear venta, devolución
  - `auth-cliente.routes.test.ts` — registro, login, google, email, perfil
  - `empleados-compras.routes.test.ts` — CRUD empleados, órdenes de compra
  - `lotes-inventario-proveedores.routes.test.ts` — lotes, ajustes inventario, CRUD proveedores
  - `reportes-imagenes.routes.test.ts` — reportes ventas/inventario, subir/eliminar imágenes
  - `pagos.routes.test.ts` (18 tests) — Wompi, Stripe (503 no config), MercadoPago (503 no config), Efectivo
  - `pagos-pasarelas.routes.test.ts` (12 tests) — Stripe configurado (crear-intent, webhook succeeded/failed, firma inválida), MercadoPago configurado (crear preferencia, webhook aprobado/rechazado/fetch mock)
- **Coverage full:** 71.03% statements, 83.14% branches, 82.71% functions
  - 8 módulos con 100% statements (app, caja, clientes, inventario, lotes, reportes, sucursales)
  - Módulos con ≥95%: pagos (98.84%), empleados (96.87%), productos (96.84%), proveedores (96.29%), categorías (95.83%)
  - Todos los servicios, schemas y utils con ≥93%
- **Documentación actualizada:** `docs/architecture.md` — tabla de coverage expandida con todos los módulos