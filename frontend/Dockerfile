# ══════════════════════════════════════════════════════════
#  FARMACY — Frontend Dockerfile (multi-stage)
#  Build: Vite → Pre-render (SSG) → Serve: Nginx alpine
# ══════════════════════════════════════════════════════════

# ── Stage 1: Builder ─────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Cache de dependencias (incluyendo Playwright)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Playwright: instalar Chromium con todas las dependencias del sistema
RUN pnpm exec playwright install --with-deps chromium

# Código fuente
COPY tsconfig.json vite.config.ts index.html ./
COPY public/ ./public/
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY sw.ts ./

# Build de producción
ARG VITE_API_URL
ARG VITE_APP_NAME
ARG VITE_CDN_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_CDN_URL=$VITE_CDN_URL

# Build de Vite + pre-renderizado SSG con Playwright
RUN pnpm run build && node scripts/prerender.mjs

# ── Stage 2: Nginx ───────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Health check + gzip_static module
RUN apk add --no-cache curl

# Copiar build con pre-renderizado
COPY --from=builder /app/dist /usr/share/nginx/html

# Config Nginx optimizada para SPA + SSG pre-renderizado
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
