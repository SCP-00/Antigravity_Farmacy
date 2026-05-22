# AGENTS.md

## Quick start (Windows)
- Preferred local dev flow is `setup.bat` (installs deps + prisma generate/db push/seed) then `run.bat` (starts Docker dev services + frontend/backend).
- `run.bat` copies root `.env` into `backend/.env` if missing; keep edits in the root `.env` or `backend/.env` consistently.

## Services + ports
- Dev Docker stack is only Postgres/Redis/pgAdmin via `docker compose -f docker-compose.dev.yml up -d` (backend/frontend run on host).
- Backend dev server listens on `PORT` from `backend/.env` (default 3000); frontend Vite proxy points to `http://127.0.0.1:3000`.
- Frontend dev server is Vite on `http://localhost:5173`.

## Prisma + database
- Prisma schema lives at `database/prisma/schema.prisma`; all prisma scripts in `backend/package.json` use `--schema=../database/prisma/schema.prisma`.
- Seed command is `npm run db:seed` from `backend/` and runs `database/seeds/seed.ts` via ts-node.

## Script entrypoints
- Backend entrypoint is `backend/src/server.ts` (connects DB before HTTP).
- Frontend entrypoint is `frontend/src/main.tsx`.
