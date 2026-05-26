# Phase 0 checklist

Goal: establish an accurate, minimal module map, remove dead paths, and normalize local config.

**Estado: ✅ Completada** — Todos los items fueron ejecutados y verificados.

## Inventory
- [x] List backend modules under `backend/src/modules/` and mark status (active, stub, duplicate).
- [x] List frontend pages under `frontend/src/pages/` and mark status.
- [x] Identify routes registered in `backend/src/app.ts` and map to module files.
- [x] Identify frontend routes in `frontend/src/app.tsx` and map to pages/components.

## Consolidation targets
- [x] Detect duplicated domain logic (inventario, productos, ventas, caja, compras).
- [x] Identify dead/unused endpoints or routes and confirm before removal.

Notes:
- ~~`backend/src/modules/inventario/inventario.routes.ts` centralizes multiple domains~~ → **RESUELTO en Fase 1**: El mega-router fue dividido en 8 submódulos independientes (lotes, inventario, proveedores, compras, clientes, empleados, sucursales, reportes).
- Unused frontend files identified and documented in `docs/architecture.md`; deletion intentionally deferred until explicit approval.

## Config normalization
- [x] Align ports between `.env.example`, `backend/.env`, `frontend/vite.config.ts`, and `run.bat`.
- [x] Confirm which `.env` is the source of truth (root vs `backend/.env`) and document it.
- [x] Validate OAuth and payment env var names are consistent across backend code and docs.

## Deliverables
- [x] Update `docs/architecture.md` with verified module map.
- [x] Record decisions in `docs/adr/` if any refactors are approved.

---

**Post-Phase-0:** El proyecto completó 9 fases adicionales (ver `plan.md`).
Ver `docs/worklog.md` para el historial completo de cambios.
