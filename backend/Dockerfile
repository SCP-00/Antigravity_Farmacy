# ══════════════════════════════════════════════════════════
#  FARMACY — Backend Dockerfile (multi-stage)
#  Build context: raíz del monorepo (../ desde backend/)
#  Build: tsc + Prisma Generate → Run: solo prod deps
# ══════════════════════════════════════════════════════════

# ── Stage 1: Builder ─────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Cache de dependencias (backend)
COPY backend/package.json backend/pnpm-lock.yaml ./backend/
COPY pnpm-lock.yaml ./
RUN cd backend && pnpm install --frozen-lockfile

# Schema Prisma (fuera del context backend/, necesita context raíz)
COPY database/prisma ./database/prisma
RUN cd backend && npx prisma generate --schema=../database/prisma/schema.prisma
RUN cd backend && node scripts/prisma-postgenerate.js

# Código fuente
COPY backend/tsconfig.json backend/src/ backend/scripts/ ./backend/
RUN cd backend && pnpm run build

# ── Stage 2: Runtime ─────────────────────────────────────
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production

# Solo producción
COPY backend/package.json backend/pnpm-lock.yaml ./backend/
COPY pnpm-lock.yaml ./
RUN cd backend && pnpm install --frozen-lockfile --prod

# Copiar build + Prisma Client generado
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
COPY --from=builder /app/database/prisma ./database/prisma

# Generar Prisma Client una vez (necesario para el schema en producción)
RUN cd backend && npx prisma generate --schema=../database/prisma/schema.prisma

EXPOSE 3000

CMD ["node", "backend/dist/server.js"]
