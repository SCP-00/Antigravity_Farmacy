# 🚀 Guía de Despliegue — Farmacy en VPS

> **Documento:** `docs/deploy-guide.md`
> **Propósito:** Guía paso a paso para desplegar Farmacy en un VPS (Ubuntu/Debian) desde cero hasta tener la app corriendo con SSL automático.
> **Tiempo estimado:** 30–45 minutos (primera vez)

---

## 📋 Tabla de contenidos

1. [Requisitos del VPS](#1-requisitos-del-vps)
2. [Resumen de la arquitectura](#2-resumen-de-la-arquitectura)
3. [Paso 1 — Configurar el VPS](#3-paso-1--configurar-el-vps)
4. [Paso 2 — Instalar Docker + Docker Compose](#4-paso-2--instalar-docker--docker-compose)
5. [Paso 3 — Configurar dominio y DNS](#5-paso-3--configurar-dominio-y-dns)
6. [Paso 4 — Clonar el repositorio](#6-paso-4--clonar-el-repositorio)
7. [Paso 5 — Configurar variables de entorno](#7-paso-5--configurar-variables-de-entorno)
8. [Paso 6 — Configurar firewall](#8-paso-6--configurar-firewall)
9. [Paso 7 — Build y deploy](#9-paso-7--build-y-deploy)
10. [Paso 8 — Verificar el despliegue](#10-paso-8--verificar-el-despliegue)
11. [Paso 9 — Configurar backups](#11-paso-9--configurar-backups)
12. [Paso 10 — Post-deploy: monitoreo inicial](#12-paso-10--post-deploy-monitoreo-inicial)
13. [Resolución de problemas comunes](#13-resolución-de-problemas-comunes)
14. [Checklist rápido de deploy](#14-checklist-rápido-de-deploy)
15. [Mantenimiento y actualizaciones](#15-mantenimiento-y-actualizaciones)

---

## 1. Requisitos del VPS

### Mínimos recomendados

| Recurso | Mínimo | Recomendado |
|---|---|---|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 2 GB | 4 GB |
| **Disco** | 20 GB SSD | 40 GB SSD |
| **SO** | Ubuntu 22.04+ / Debian 12 | Ubuntu 24.04 LTS |
| **Docker** | 24+ | 27+ |
| **Docker Compose** | v2 | v2 |

### Requisitos de software en tu máquina local

| Herramienta | Propósito |
|---|---|
| **Git** | Clonar el repositorio |
| **SSH** | Conectarte al VPS |
| **Navegador** | Verificar el deploy |

### Dominio

- Necesitas un **dominio** (ej: `farmacia.misitio.com`) apuntando al IP de tu VPS
- **Caddy** (nuestro reverse proxy) obtendrá certificados SSL automáticos de Let's Encrypt
- Si no tienes dominio, puedes desplegar con `localhost` (sin SSL) para pruebas

---

## 2. Resumen de la arquitectura

```
                        ┌──────────────┐
                        │   Usuarios   │
                        │   (HTTPS)    │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │   Caddy      │ ← SSL automático (Let's Encrypt)
                        │  (puerto     │    Redirección HTTP → HTTPS
                        │   80 + 443)  │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │   Nginx      │ ← Sirve SPA + SSG pre-renderizado
                        │  (puerto 80) │    Proxy reverso /api/ → backend
                        └──────┬───────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────▼───────┐    ┌──────▼───────┐    ┌──────▼───────┐
   │   Backend    │    │  PostgreSQL  │    │    Redis     │
   │  (Express)   │    │    (15)      │    │     (7)      │
   │  puerto 3000 │    │  puerto 5432 │    │  puerto 6379 │
   └──────────────┘    └──────────────┘    └──────────────┘
```

**Flujo de una petición:**

1. Usuario → `https://tudominio.com` → **Caddy** (termina SSL)
2. Caddy → `http://frontend:80` → **Nginx** (sirve HTML estático)
3. Nginx: `/api/*` → `http://backend:3000` → **Express** (API)
4. Express → **PostgreSQL** (datos) + **Redis** (caché/sesiones/queues)

**Todos los servicios se comunican dentro de la red interna `farmacy_prod_network`.** Solo Caddy expone puertos al exterior (80 y 443).

---

## 3. Paso 1 — Configurar el VPS

Conéctate por SSH a tu VPS:

```bash
ssh root@<IP_DEL_VPS>
# o con usuario no-root:
ssh usuario@<IP_DEL_VPS>
```

### Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### Crear usuario no-root (recomendado)

```bash
adduser farmacy
usermod -aG sudo farmacy
su - farmacy
```

> **⚠️ Seguridad:** Nunca trabajes como `root` directamente. Usa un usuario con `sudo`.

---

## 4. Paso 2 — Instalar Docker + Docker Compose

### Docker

```bash
# Instalar dependencias
sudo apt install -y ca-certificates curl gnupg lsb-release

# Agregar repositorio oficial de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Agregar tu usuario al grupo docker (para no usar sudo)
sudo usermod -aG docker $USER

# Aplicar cambios de grupo (o cierra sesión y vuelve a entrar)
newgrp docker

# Verificar
docker --version
docker run hello-world
```

### Docker Compose

```bash
# Docker Compose v2 ya viene con Docker Engine 24+
# Verificar:
docker compose version
```

> **Nota:** Si tu VPS no tiene `docker compose` (v2), instala con:
> ```bash
> sudo apt install -y docker-compose-plugin
> ```

---

## 5. Paso 3 — Configurar dominio y DNS

Antes de desplegar, tu dominio debe apuntar al IP de tu VPS.

### En tu proveedor de DNS (Cloudflare, Namecheap, etc.)

| Tipo | Nombre | Valor | TTL |
|---|---|---|---|
| **A** | `@` | `IP_DEL_VPS` | 300 (automático) |
| **A** | `www` | `IP_DEL_VPS` | 300 (opcional) |
| **AAAA** | `@` | `IPv6_DEL_VPS` | 300 (opcional) |

### Verificar propagación

```bash
dig +short tudominio.com
# Debe mostrar: IP_DEL_VPS
```

> ⏱️ La propagación DNS puede tomar de 1 a 15 minutos. Puedes continuar mientras tanto.

---

## 6. Paso 4 — Clonar el repositorio

```bash
cd ~
git clone https://github.com/tu-usuario/farmacy.git
cd farmacy
```

> Si el repositorio es privado, configura una SSH key o usa un token de acceso:
> ```bash
> git clone https://TOKEN@github.com/tu-usuario/farmacy.git
> ```

---

## 7. Paso 5 — Configurar variables de entorno

### Crear archivo `.env` desde el template

```bash
# Copiar template de producción
# (No existe .env.production.example, usamos .env.example como base)
cp .env.example .env
nano .env
```

### Variables REQUERIDAS para producción

| Variable | Valor de ejemplo | Cómo generarlo |
|---|---|---|
| `NODE_ENV` | `production` | Fijo |
| `DATABASE_URL` | `postgresql://farmacy_user:XXXX@postgres:5432/farmacy_db` | Usa `postgres` como host (nombre del servicio Docker) |
| `REDIS_URL` | `redis://:XXXX@redis:6379` | Usa `redis` como host |
| `POSTGRES_PASSWORD` | — | `openssl rand -hex 32` |
| `REDIS_PASSWORD` | — | `openssl rand -hex 32` |
| `JWT_SECRET` | — | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | — | `openssl rand -base64 32` |
| `JWT_CLIENTE_SECRET` | — | `openssl rand -base64 32` |
| `SERVER_NAME` | `farmacia.misitio.com` | Tu dominio |
| `VITE_API_URL` | `https://farmacia.misitio.com/api/v1` | URL pública de tu API |
| `FRONTEND_URL` | `https://farmacia.misitio.com` | URL pública del frontend |

### Generar secrets seguros (recomendado)

Ejecuta estos comandos **en el VPS** para generar valores seguros:

```bash
# Generar todos los secrets
echo "POSTGRES_PASSWORD=$(openssl rand -hex 32)"
echo "REDIS_PASSWORD=$(openssl rand -hex 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "JWT_CLIENTE_SECRET=$(openssl rand -base64 32)"
```

Copia los valores y pégalos en `.env`.

### Template mínimo para producción

```env
# ── Entorno ──────────────────────────────────────────────
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1
LOG_LEVEL=info

# ── Base de datos ────────────────────────────────────────
POSTGRES_DB=farmacy_db
POSTGRES_USER=farmacy_user
POSTGRES_PASSWORD=<generado>
DATABASE_URL=postgresql://farmacy_user:${POSTGRES_PASSWORD}@postgres:5432/farmacy_db

# ── Redis ────────────────────────────────────────────────
REDIS_PASSWORD=<generado>
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# ── JWT ──────────────────────────────────────────────────
JWT_SECRET=<generado>
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=<generado>
JWT_REFRESH_EXPIRES_IN=7d
JWT_CLIENTE_SECRET=<generado>
JWT_CLIENTE_EXPIRES_IN=30d

# ── Frontend ─────────────────────────────────────────────
FRONTEND_URL=https://tudominio.com
VITE_API_URL=https://tudominio.com/api/v1
VITE_APP_NAME=Farmacy

# ── Caddy / Dominio ──────────────────────────────────────
SERVER_NAME=tudominio.com

# ── Google OAuth (opcional) ──────────────────────────────
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GOOGLE_CALLBACK_URL=https://tudominio.com/api/v1/clientes/auth/google/callback

# ── Pasarelas de pago (opcional) ─────────────────────────
# WOMPI_PUBLIC_KEY=...
# WOMPI_PRIVATE_KEY=...
# WOMPI_EVENTS_SECRET=...
# WOMPI_INTEGRITY_SECRET=...
# WOMPI_BASE_URL=https://sandbox.wompi.co/v1

# STRIPE_PUBLIC_KEY=...
# STRIPE_SECRET_KEY=...
# STRIPE_WEBHOOK_SECRET=...

# MERCADOPAGO_ACCESS_TOKEN=...
# MERCADOPAGO_PUBLIC_KEY=...

# ── Email / SMTP (opcional) ──────────────────────────────
# EMAIL_FROM=Farmacy <no-reply@tudominio.com>
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=...
# SMTP_PASS=...

# ── Cloudinary / Imágenes (opcional) ─────────────────────
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...

# ── Notificaciones Push (VAPID, opcional) ────────────────
# VAPID_PUBLIC_KEY=...
# VAPID_PRIVATE_KEY=...
# VAPID_EMAIL=...

# ── Rate limiting ────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_WEBHOOK_MAX=60
RATE_LIMIT_CREACION_MAX=30
RATE_LIMIT_BUSQUEDA_MAX=60

# ── Webhook IP allowlist (opcional) ──────────────────────
# WEBHOOK_IP_ALLOWLIST=3.18.12.63,13.235.14.237

# ── Chatbot ──────────────────────────────────────────────
HORARIO_INICIO=08:00
HORARIO_FIN=18:00
HORARIO_TIMEZONE=America/Bogota
HORARIO_DIAS=1,2,3,4,5
FARMACIA_NOMBRE=Farmacy

# ── CORS producción ──────────────────────────────────────
# CORS_ORIGINS=https://tudominio.com
```

### ⚠️ Seguridad: `.env` está en `.gitignore`

El archivo `.env` **NUNCA** debe comitearse. Está incluido en `.gitignore`. Si necesitas un template para producción, crea `.env.production.example` (sin valores reales).

---

## 8. Paso 6 — Configurar firewall

### Puerto 80 (HTTP) y 443 (HTTPS) deben estar abiertos

```bash
# Usando ufw (Uncomplicated Firewall)
sudo ufw allow OpenSSH      # Puerto 22 — SSH
sudo ufw allow 80/tcp        # HTTP
sudo ufw allow 443/tcp       # HTTPS
sudo ufw --force enable
sudo ufw status

# Si usas iptables directamente, equivalente:
# sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
# sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
# sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
# sudo iptables -A INPUT -j DROP
```

### En tu proveedor de Cloud (DigitalOcean, Vultr, AWS, etc.)

Además del firewall del sistema operativo, configura el **firewall del proveedor** (firewall de red) para permitir:

| Puerto | Protocolo | Propósito |
|---|---|---|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (redirección a HTTPS) |
| 443 | TCP | HTTPS (SSL) |
| 5432 | TCP | PostgreSQL **(NO abrir — solo interno)** |
| 6379 | TCP | Redis **(NO abrir — solo interno)** |

> **⚠️ CRÍTICO:** PostgreSQL (5432) y Redis (6379) **NO deben exponerse al exterior**. Solo los contenedores Docker tienen acceso a ellos.

---

## 9. Paso 7 — Build y deploy

### 9.1 Primer despliegue

```bash
# Desde la raíz del proyecto
cd ~/farmacy

# Asegurarse de que el .env está configurado
cat .env | grep -v "^#" | grep -v "^$" | head -20

# Build + deploy de todos los servicios
docker compose up -d --build
```

Este comando:
1. Construye la imagen del **backend** (TypeScript → Prisma Generate → compilación)
2. Construye la imagen del **frontend** (Vite build → pre-renderizado SSG con Playwright → Nginx)
3. Inicia **PostgreSQL** + **Redis** + **Caddy**
4. Espera a que PostgreSQL y Redis estén saludables antes de iniciar backend
5. Espera a que backend esté saludable antes de iniciar frontend

### 9.2 Verificar que todos los contenedores estén arriba

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Deberías ver algo como:

| NAMES | STATUS | PORTS |
|---|---|---|
| `farmacy_caddy` | Up X minutes | 0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp |
| `farmacy_frontend` | Up X minutes | 80/tcp |
| `farmacy_backend` | Up X minutes | 3000/tcp |
| `farmacy_redis` | Up X minutes | 6379/tcp |
| `farmacy_postgres` | Up X minutes (healthy) | 5432/tcp |

### 9.3 Ver logs

```bash
# Ver logs de todos los servicios
docker compose logs --tail=50

# Ver un servicio específico
docker compose logs backend --tail=50
docker compose logs caddy --tail=20
```

### 9.4 Si algo sale mal

```bash
# Detener todo
docker compose down

# Revisar errores de build
docker compose build --no-cache 2>&1 | tail -50

# Ver logs detallados de un servicio
docker compose logs backend --tail=100
```

---

## 10. Paso 8 — Verificar el despliegue

### 10.1 Healthcheck del backend

```bash
curl -s https://tudominio.com/api/v1/health | jq .
```

Respuesta esperada:

```json
{
  "ok": true,
  "app": "Farmacy",
  "version": "1.0.0",
  "timestamp": "2026-05-28T20:00:00.000Z"
}
```

### 10.2 Frontend

Abre `https://tudominio.com` en tu navegador. Deberías ver:
- ✅ Landing page de Farmacy
- ✅ Sin errores de consola (F12 → Console)
- ✅ SSL válido (candado verde)

### 10.3 API pública

```bash
# Categorías
curl -s https://tudominio.com/api/v1/categorias | jq '.data | length'
# → 8 (o más si agregaste)

# Productos (búsqueda pública)
curl -s "https://tudominio.com/api/v1/productos/buscar?limite=3" | jq '.data | length'
# → 3

# Sucursales
curl -s https://tudominio.com/api/v1/sucursales | jq '.data | length'
# → 2
```

### 10.4 Login admin

```bash
# Login como administrador
curl -s -X POST https://tudominio.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@farmacy.co","password":"Admin@1234"}' | jq '.token'
# → Debe devolver un token JWT
```

> ⚠️ Recuerda **cambiar las contraseñas por defecto** después del primer login.

### 10.5 WebSocket (POS en vivo)

```bash
# Verificar que el WebSocket endpoint responde (handshake)
curl -s -o /dev/null -w "%{http_code}" \
  -H "Upgrade: websocket" -H "Connection: Upgrade" \
  https://tudominio.com/ws
# → 101 (Switching Protocols) o 400 (si no es WS válido, es esperado)
```

### 10.6 Certificado SSL

```bash
# Verificar expiración del certificado
echo | openssl s_client -servername tudominio.com -connect tudominio.com:443 2>/dev/null | \
  openssl x509 -noout -dates
# → notBefore=... / notAfter=...
```

---

## 11. Paso 9 — Configurar backups

### 11.1 Activar backup automático (24h)

El servicio `db-backup` está **comentado por defecto** en `docker-compose.yml`. Actívalo:

```bash
cd ~/farmacy

# 1. Editar docker-compose.yml
nano docker-compose.yml
# 2. Descomentar el bloque entero de `db-backup:` (líneas ~90-140)
#    y el volumen `farmacy_backup_data:` al final del archivo
```

Descomentar significa quitar los `# ` al inicio de cada línea. Debe verse:

```yaml
  db-backup:
    image: postgres:15-alpine
    container_name: farmacy_db_backup
    restart: unless-stopped
    # ... resto del bloque
```

Luego recrear el servicio:

```bash
docker compose up -d db-backup
```

### 11.2 Verificar que funciona

```bash
# Esperar 30 segundos (el primer backup se ejecuta inmediatamente al arrancar)
sleep 30

# Listar backups
docker exec farmacy_db_backup list

# Verificar integridad del más reciente
docker exec farmacy_db_backup sh -c \
  "gunzip -t \$(ls -t /backups/*.sql.gz | head -1) && echo '✅ OK'"

# Backup manual inmediato
docker exec farmacy_db_backup backup
```

### 11.3 Backup del `.env` y archivos de configuración

Los backups de BD NO incluyen `.env`, `Caddyfile`, ni `docker-compose.yml`. Respáldalos por separado:

```bash
# Backup manual de configuración
sudo tar -czf ~/farmacy-config-$(date +%Y%m%d).tar.gz \
  ~/farmacy/.env \
  ~/farmacy/Caddyfile \
  ~/farmacy/docker-compose.yml
```

> **Recomendación:** Programa este backup semanal con cron.

---

## 12. Paso 10 — Post-deploy: monitoreo inicial

### Rutina inmediata (primeras 2 horas)

```bash
# 1. Healthcheck
curl -s https://tudominio.com/api/v1/health

# 2. Logs sin errores
docker compose logs --since=5m backend | grep -i "error\|fatal\|crash"

# 3. Contenedores estables
docker ps --format "table {{.Names}}\t{{.Status}}"

# 4. Frontend sin 5XX
docker compose logs --since=5m frontend | grep "HTTP/1.1\" [45]"

# 5. Recursos
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Rutina diaria (primera semana)

Ver la [rutina completa de monitoreo](monitoreo.md#3-rutina-de-revisión).

---

## 13. Resolución de problemas comunes

### ❌ Caddy no obtiene certificado SSL

**Síntoma:** `https://tudominio.com` no carga, o Caddy loguea `failed to obtain certificate`.

**Causas posibles y soluciones:**

1. **DNS no propagado** → Verifica: `dig +short tudominio.com`
2. **Puerto 80 no accesible** → Caddy necesita puerto 80 para el challenge HTTP-01 de Let's Encrypt:
   ```bash
   sudo ufw status | grep 80
   ```
3. **Caddy no puede escribir en /data** → Verificar permisos:
   ```bash
   docker compose exec caddy ls -la /data/caddy
   ```
4. **Rate limiting de Let's Encrypt** → Espera 1 hora e intenta de nuevo

### ❌ Backend no inicia (crash loop)

**Síntoma:** `docker ps` muestra backend reiniciándose.

**Diagnóstico:**
```bash
docker compose logs backend --tail=50
```

**Causas comunes:**
1. **PostgreSQL no listo** → Verificar: `docker compose logs postgres --tail=10`
2. **Variable de entorno faltante** → Verificar que `.env` tenga `POSTGRES_PASSWORD`
3. **Error de conexión a BD** → Verificar `DATABASE_URL` en `.env`
4. **Puerto ocupado** → Verificar: `sudo netstat -tlnp | grep 3000`

### ❌ Frontend carga en blanco

**Síntoma:** Navegador muestra página en blanco, consola con errores.

**Diagnóstico:**
```bash
# Verificar que los archivos estáticos existen
docker compose exec frontend ls /usr/share/nginx/html

# Verificar errores de Nginx
docker compose logs frontend --tail=30

# Verificar que el build fue exitoso
docker compose logs frontend --since=10m | grep -i "error\|build"
```

**Causas comunes:**
1. **Build falló** → Revisa logs de build con `docker compose build frontend 2>&1`
2. **CORS mal configurado** → Revisar `VITE_API_URL` en `.env`
3. **Pre-renderizado falló** → Revisar logs de Playwright en builder stage

### ❌ WebSocket no conecta

**Síntoma:** POS en vivo no funciona, chatbot no recibe mensajes.

**Diagnóstico:**
```bash
# Verificar que el endpoint WS está configurado en Nginx
docker compose exec frontend cat /etc/nginx/conf.d/default.conf | grep -A 10 "location /ws"
```

**Solución:** Verificar que `nginx.conf` dentro del frontend tenga la sección `location /ws` (debería estar, si no, rebuildear).

### ❌ Error 502 Bad Gateway

**Síntoma:** Nginx devuelve 502 al navegar.

**Causa:** Backend caído o lento.

```bash
# Verificar backend
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health
# Si no responde: revisar logs del backend

# Si responde pero lento: revisar conexión a BD
docker compose exec postgres pg_isready -U farmacy_user
```

---

## 14. Checklist rápido de deploy

### Antes del deploy (en tu máquina local)

- [ ] TypeScript backend: 0 errores (`cd backend && npx tsc --noEmit`)
- [ ] TypeScript frontend: 0 errores (`cd frontend && npx tsc --noEmit`)
- [ ] Tests: 536+ pasando (`cd backend && pnpm run test`)
- [ ] CI pipeline: todos los checks verdes en GitHub Actions
- [ ] Secret scanning: sin alertas
- [ ] `.env` listo con todos los secrets necesarios
- [ ] Dominio configurado y DNS propagado

### Durante el deploy (en el VPS)

- [ ] `git pull` (o clonar repo)
- [ ] `.env` configurado con valores de producción
- [ ] `docker compose up -d --build`
- [ ] `docker ps` — todos los contenedores `Up`

### Después del deploy (en el VPS)

- [ ] `curl https://tudominio.com/api/v1/health` → `ok: true`
- [ ] Navegador: frontend carga sin errores
- [ ] Login admin funcional
- [ ] Catálogo público carga con productos
- [ ] SSL válido (candado verde)
- [ ] Backup automático funcionando
- [ ] Monitoreo inicial: sin errores críticos en logs

### Post-mortem (24h después)

- [ ] Sin crash loops
- [ ] Sin aumento de 5XX
- [ ] Sin jobs BullMQ fallidos recurrentes
- [ ] Consumo de recursos dentro de lo esperado
- [ ] Backups ejecutándose correctamente

---

## 15. Mantenimiento y actualizaciones

### Actualizar el código y redeploy

```bash
cd ~/farmacy

# 1. Bajar servicios (opcional, pero recomendado)
docker compose down

# 2. Pull del código nuevo
git pull

# 3. Si hay migraciones de BD:
#    docker compose up -d postgres
#    docker compose exec -T postgres psql -U farmacy_user farmacy_db < migracion.sql
#    (Prisma: `npx prisma migrate deploy` dentro del contenedor)

# 4. Rebuildear y deployar
docker compose up -d --build
```

### Comandos de mantenimiento comunes

```bash
# Ver logs en tiempo real
docker compose logs -f backend

# Ejecutar comando dentro de un contenedor
docker compose exec backend node -e "console.log('hello')"

# Backup manual de BD
docker compose exec postgres pg_dump -U farmacy_user farmacy_db > backup_$(date +%Y%m%d).sql

# Restaurar BD desde backup
cat backup.sql | docker compose exec -T postgres psql -U farmacy_user farmacy_db

# Ver espacio usado por volúmenes Docker
docker system df

# Limpiar imágenes no usadas
docker image prune -af

# Reiniciar un servicio específico
docker compose restart backend
```

### Migraciones de Prisma en producción

```bash
# Desde el host, dentro del contenedor backend:
docker compose exec backend npx prisma migrate deploy \
  --schema=../database/prisma/schema.prisma

# O si prefieres desde el host (requiere psql):
cat database/prisma/migrations/*/migration.sql | \
  docker compose exec -T postgres psql -U farmacy_user farmacy_db
```

---

## 📚 Referencias

| Documento | Descripción |
|---|---|
| [monitoreo.md](monitoreo.md) | Rutina completa de monitoreo operativo |
| [architecture.md](architecture.md) | Arquitectura detallada del sistema |
| [api-routes.md](api-routes.md) | Mapa completo de rutas **API** |
| [worklog.md](worklog.md) | Bitácora de cambios del proyecto |
| [AGENTS.md](../AGENTS.md) | Guía para desarrolladores IA |

---

> **Última actualización:** 2026-05-28
> **Mantenido por:** Equipo Farmacy
