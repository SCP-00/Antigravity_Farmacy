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
