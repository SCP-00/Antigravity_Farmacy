# Phase 0 checklist

Goal: establish an accurate, minimal module map, remove dead paths, and normalize local config.

## Inventory
- [ ] List backend modules under `backend/src/modules/` and mark status (active, stub, duplicate).
- [ ] List frontend pages under `frontend/src/pages/` and mark status.
- [ ] Identify routes registered in `backend/src/app.ts` and map to module files.
- [ ] Identify frontend routes in `frontend/src/app.tsx` and map to pages/components.

## Consolidation targets
- [ ] Detect duplicated domain logic (inventario, productos, ventas, caja, compras).
- [ ] Identify dead/unused endpoints or routes and confirm before removal.

## Config normalization
- [ ] Align ports between `.env.example`, `backend/.env`, `frontend/vite.config.ts`, and `run.bat`.
- [ ] Confirm which `.env` is the source of truth (root vs `backend/.env`) and document it.
- [ ] Validate OAuth and payment env var names are consistent across backend code and docs.

## Deliverables
- [ ] Update `docs/architecture.md` with verified module map.
- [ ] Record decisions in `docs/adr/` if any refactors are approved.
