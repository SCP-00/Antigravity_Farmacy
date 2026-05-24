# AGENTS.md

## Quick start (Windows)
- Preferred local dev flow is "setup.bat" (installs deps + prisma generate/db push/seed) then "run.bat" (starts Docker dev services + frontend/backend).
- "run.bat" copies root ".env" into "backend/.env" if missing; keep edits in the root ".env" or "backend/.env" consistently.

## Services + ports
- Dev Docker stack is only Postgres/Redis/pgAdmin via "docker compose -f docker-compose.dev.yml up -d" (backend/frontend run on host).
- Backend dev server listens on "PORT" from "backend/.env" (default 3000); frontend Vite proxy points to "http://127.0.0.1:3000".
- Frontend dev server is Vite on "http://localhost:5173".

## Prisma + database (Colombian INVIMA/CUM Integration)
- Prisma schema lives at "database/prisma/schema.prisma"; all prisma scripts in "backend/package.json" use "--schema=../database/prisma/schema.prisma".
- The product table enforces strict regulatory properties: "cum" (unique SKU identifier), "registroInvima", "principioActivo", "atc" code, and safety warning fields "alergenos" and "advertencias".
- Medical samples ("esMuestraMedica: true") are systematically blocked in public-facing B2C API routing "/buscar".
- Seed command is "pnpm run db:seed" from "backend/" and runs "database/seeds/seed.ts" via ts-node, populating real datasets including Procaps Alercet syrup commercial and sample units.

## Script entrypoints
- Backend entrypoint is "backend/src/server.ts" (connects DB before HTTP).
- Frontend entrypoint is "frontend/src/main.tsx".
