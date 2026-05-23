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
