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
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen       80;
    server_name  _;
    root         /usr/share/nginx/html;
    index        index.html;

    # Gzip dinámico
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/html;
    gzip_min_length 256;
    gzip_vary on;

    # Seguridad headers básicos
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA + SSG: intenta archivo .html (pre-renderizado), luego directorio, luego SPA fallback
    location / {
        try_files $uri.html $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Assets compilados con hashes → cache largo
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Archivos pre-renderizados estáticos (caché moderado)
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Proxy inverso al backend
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
EOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
