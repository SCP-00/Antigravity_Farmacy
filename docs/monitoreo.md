# Rutina de monitoreo operativo

> 🚨 **pnpm-only.** Este proyecto SOLO usa `pnpm`. NO uses `npm` ni `yarn`.

> **Documento:** `docs/monitoreo.md`
> **Propósito:** Definir qué logs revisar, cada cuánto, qué errores son críticos y qué alertas requieren acción manual.

---

## 📋 Tabla de contenidos

1. [Healthchecks del sistema](#1-healthchecks-del-sistema)
2. [Logs a revisar](#2-logs-a-revisar)
3. [Rutina de revisión](#3-rutina-de-revisión)
4. [Errores críticos vs no críticos](#4-errores-críticos-vs-no-críticos)
5. [Alertas que requieren acción manual](#5-alertas-que-requieren-acción-manual)
6. [Checklist de deploy](#6-checklist-deploy)
7. [Comandos útiles](#7-comandos-útiles)

---

## 1. Healthchecks del sistema

Cada servicio expone un endpoint de healthcheck:

| Servicio | Healthcheck | Frecuencia | Lo que valida |
|---|---|---|---|
| PostgreSQL | `pg_isready -U farmacy_user -d farmacy_db` | Cada 10s | Conexión al motor de BD |
| Redis | `redis-cli ping` | Cada 10s | Conexión al servicio de caché/cola |
| Backend | `GET /api/v1/health` | Cada 30s | App funcionando, responde JSON `{ ok: true, ... }` |
| Frontend | `GET /health` (Nginx) | Cada 30s | Nginx sirviendo archivos estáticos |

### Lo que devuelve el healthcheck del backend

```json
{
  "ok": true,
  "app": "Farmacy",
  "version": "1.0.0",
  "timestamp": "2026-05-27T12:00:00.000Z"
}
```

**Si `ok: false`** o el endpoint no responde → el contenedor se reinicia automáticamente (`restart: always` en Docker). Si los reinicios son frecuentes (>3 en 5 minutos), hay un problema grave.

---

## 2. Logs a revisar

### 2.1 Nivel de logs por entorno

| Entorno | LOG_LEVEL | Datos sensibles |
|---|---|---|
| Desarrollo | `debug` | Puede incluir datos reales de prueba |
| Producción | `info` (recomendado) | No incluir datos personales ni tokens completos |

### 2.2 Qué revisar en cada fuente

#### Backend (`docker logs farmacy_backend`)

| Tipo de log | Qué buscar | Acción si aparece |
|---|---|---|
| `error` | Stack traces, errores de BD, fallos de pago | Revisar detalle, crear issue si es recurrente |
| `warn` | Rate limiting activado, webhook inválido, CORS bloqueado | Monitorear frecuencia; si es alta, revisor configuración |
| `info` | Inicio de servidor, jobs completados, webhooks recibidos | Verificar periodicidad esperada |
| `debug` | Eventos EventBus, consultas lentas | Solo en desarrollo para troubleshooting |

#### Frontend (Nginx: `docker logs farmacy_frontend`)

| Código HTTP | Significado | Acción |
|---|---|---|
| `200` / `304` | Normal | — |
| `404` | Ruta no encontrada | Verificar que no sea un ataque o linking roto |
| `500` | Error interno del backend | Revisar logs del backend |
| `502` / `503` | Backend caído o sobrecargado | Verificar healthcheck del backend |
| `429` | Rate limiting | Posible ataque o configuración muy restrictiva |

#### Nginx error log (`docker exec farmacy_frontend cat /var/log/nginx/error.log`)

| Mensaje | Acción |
|---|---|
| `connect() failed` | Backend no está corriendo |
| `open() "/usr/share/nginx/html/..." failed` | Archivo estático faltante (revisar build) |
| `no live upstreams` | Todos los backends están caídos |

#### PostgreSQL (`docker logs farmacy_postgres`)

| Evento | Acción |
|---|---|
| `could not connect to database` | BD caída o red interna rota |
| `too many connections` | Pool de conexiones saturado (revisar `DATABASE_URL` pool size) |
| `deadlock detected` | Deadlock en query — revisar transacciones largas |
| `checkpoint starting` | Normal (cada ~5 minutos) |

#### Redis (`docker logs farmacy_redis`)

| Evento | Acción |
|---|---|
| `Error accepting a client connection` | Redis saturado o sin memoria |
| `Can't save in background` | Sin espacio en disco para RDB/AOF |
| `OOM command not allowed when used memory > 'maxmemory'` | Redis sin memoria — revisar TTL de claves |

---

## 3. Rutina de revisión

### 3.1 Periodicidad sugerida

| Periodo post-deploy | Frecuencia | Alcance |
|---|---|---|
| **Primera semana** | **2 veces al día** | Todos los healthchecks + errores en backend + frontend (5XX) |
| **Semanas 2 a 4** | **1 vez al día** | Healthchecks + errores backend |
| **Luego de estabilización** | **3 veces por semana** | Healthchecks + rate limiting + errores recurrentes |
| **Tras cada release** | **Primeras 2 horas continuas** | Monitoreo activo de healthchecks + logs + alertas |

### 3.2 Rutina rápida (5 minutos)

```bash
# 1. Verificar que todos los contenedores estén arriba
docker ps --format "table {{.Names}}\t{{.Status}}" | grep farmacy

# 2. Healthcheck del backend
curl -s http://localhost:3000/api/v1/health

# 3. Últimos errores del backend
docker logs farmacy_backend --since 1h | grep -i "error\|fatal\|crash" | tail -20

# 4. Últimos 5XX del frontend (Nginx)
docker logs farmacy_frontend --since 1h | grep "HTTP/1.1\" [45][0-9][0-9]" | tail -20

# 5. Espacio en disco
df -h /var/lib/docker
```

### 3.3 Rutina completa (15 minutos)

Incluye los pasos de la rutina rápida más:

```bash
# 6. Logs de PostgreSQL (errores/desconexiones)
docker logs farmacy_postgres --since 6h | grep -i "error\|fatal\|could not\|deadlock\|too many connections" | tail -10

# 7. Logs de Redis
docker logs farmacy_redis --since 6h | grep -i "error\|OOM\|Can't save" | tail -10

# 8. Uso de recursos
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep farmacy

# 9. Rate limiting - cuántas veces se activó
docker logs farmacy_backend --since 24h | grep -c "rate.limit\|429\|Too Many Requests"

# 10. Jobs BullMQ completados vs fallidos
docker logs farmacy_backend --since 24h | grep "Job completado\|Job falló"
```

---

## 4. Errores críticos vs no críticos

### 🔴 Críticos (requieren acción inmediata)

| Error | Síntoma | Acción |
|---|---|---|
| Backend no responde healthcheck | `docker ps` muestra contenedor reiniciándose | Revisar logs, verificar DB/Redis, revisar última release |
| Base de datos caída | Backend responde 500 en todas las rutas | Revisar `docker logs farmacy_postgres`, verificar volumen |
| Errores de pago recurrentes | Webhooks fallando, transacciones no actualizadas | Revisar secrets de pasarela, logs de webhook |
| Memory leak / OOM | Contenedor reiniciándose cada pocas horas | Revisar heap, conexiones BD no cerradas, EventBus listeners |
| Fuga de secretos | Gitleaks alerta en PR o push | Rotar secretos inmediatamente, eliminar del historial git |

### 🟡 No críticos (monitorear, no requieren acción inmediata)

| Error | Síntoma | Acción |
|---|---|---|
| Rate limiting puntual | Cliente legítimo recibe 429 | Revisar si es ataque o ajustar límites |
| Job BullMQ fallido aislado | 1 de 100 jobs falla | Verificar datos del job, revisar si es reproducible |
| 404 en ruta pública | Alguien navegó a URL inexistente | Generalmente inofensivo; si es recurrente, revisar SEO/enlaces |
| Timeout de conexión BD | Ocasional, no recurrente | Puede ser pico de carga normal |
| Alerta de inventario | Stock bajo o próximo a vencer | Acción planificada, no urgente |

### ⚪ Informativos (solo registro)

| Evento | Acción |
|---|---|
| Webhook recibido | Normal — verificar que llegue con la frecuencia esperada |
| Job completado | Normal — verificar que ningún job quede en `waiting` |
| Login fallido | Normal — puede ser usuario olvidó contraseña |
| Sesión de caja cerrada | Normal — parte del flujo operativo |

---

## 5. Alertas que requieren acción manual

### 5.1 Alertas de inventario

| Alerta | Disparador | Acción requerida |
|---|---|---|
| Stock crítico | Producto con stock ≤ 10 unidades | Orden de compra al proveedor |
| Próximo a vencer (30 días) | Lote vence en ≤ 30 días | Revisar rotación, considerar descuento o devolución |
| Vencido | Lote con `fechaVencimiento < hoy` | **Retirar del inventario físicamente** y actualizar en sistema |
| Sin alertas configuradas | Producto sin `stockMinimo` definido | Configurar `stockMinimo` en ficha del producto |

### 5.2 Alertas de sistema

| Alerta | Disparador | Acción requerida |
|---|---|---|
| Contenedor reiniciándose | Más de 3 reinicios en 5 minutos | Revisar logs, posiblemente OOM o error fatal |
| Disco casi lleno | Uso de disco > 85% | Revisar logs acumulados, rotación de logs de Docker |
| Redis sin memoria | Redis rechaza escrituras | Aumentar `maxmemory` o reducir TTL de claves |
| Certificado SSL próximo a vencer | Faltan ≤ 30 días | Renovar certificado |

---

## 6. Checklist de deploy

### Antes del deploy

- [ ] TypeScript backend: 0 errores (`cd backend && npx tsc --noEmit`)
- [ ] TypeScript frontend: 0 errores (`cd frontend && npx tsc --noEmit`)
- [ ] Tests: 100% pasando (`cd backend && pnpm run test`)
- [ ] CI pipeline: todos los checks verdes en GitHub Actions
- [ ] Secret scanning: sin alertas (`gitleaks detect --source . --config backend/.gitleaks.toml -v`)
- [ ] `.env.production` actualizado con todos los secrets necesarios
- [ ] Migraciones de BD ejecutadas (`prisma migrate deploy`)
- [ ] Changelog / release notes preparados
- [ ] Documentación actualizada si aplica (API, rutas, arquitectura)

### Durante el deploy

- [ ] Build de imágenes Docker (`docker compose build --no-cache`)
- [ ] Backup de BD actual (`pg_dump`)
- [ ] Despliegue gradual si es posible
- [ ] Monitoreo activo de healthchecks durante primeras 2 horas

### Después del deploy (primeras 2 horas)

- [ ] Healthcheck del backend responde `ok`
- [ ] Frontend carga sin errores de consola
- [ ] Login admin funcional
- [ ] POS carga sin errores
- [ ] Catálogo público carga
- [ ] Webhooks de pago no muestran errores nuevos
- [ ] Jobs BullMQ no muestran fallos nuevos
- [ ] Logs sin errores críticos

### Post-mortem (24h después)

- [ ] Backend sin crash loops
- [ ] Sin aumento de 5XX en frontend
- [ ] Sin alertas de secretos
- [ ] Sin jobs fallidos recurrentes
- [ ] Consumo de recursos dentro de lo esperado

---

## 7. Comandos útiles

### Docker

```bash
# Estado de contenedores
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Logs del backend (última hora)
docker logs farmacy_backend --since 1h

# Logs del backend en tiempo real
docker logs -f farmacy_backend

# Logs filtrados por nivel
docker logs farmacy_backend --since 1h | jq -R 'fromjson? | select(.level == "error")'

# Consumo de recursos
docker stats farmacy_backend farmacy_frontend farmacy_postgres farmacy_redis --no-stream

# Backup de BD
docker exec -t farmacy_postgres pg_dump -U farmacy_user farmacy_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore de BD
cat backup.sql | docker exec -i farmacy_postgres psql -U farmacy_user farmacy_db
```

### Backend

```bash
# Verificar healthcheck
curl -s http://localhost:3000/api/v1/health | jq .

# Verificar rate limiting activo
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health

# Verificar rutas expuestas
curl -s http://localhost:3000/api/v1/productos/buscar?q=ibuprofeno | jq '.productos | length'

# Verificar estado de Redis
redis-cli ping
redis-cli info memory | grep used_memory_human

# Verificar jobs BullMQ (desde el contenedor backend)
docker exec farmacy_backend node -e "
  const { Queue } = require('bullmq');
  const q = new Queue('csv-export', { connection: { host: 'redis', port: 6379 } });
  q.getJobCounts().then(console.log).then(() => q.close());
"
```

### Monitoreo continuo (cron sugerido)

```bash
# Agregar a crontab para monitoreo automático cada 6 horas
# 0 */6 * * * /usr/local/bin/farmacy-healthcheck.sh

# farmacy-healthcheck.sh:
#!/bin/bash
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health)
if [ "$HEALTH" != "200" ]; then
  echo "[$(date)] Healthcheck FAILED: $HEALTH" >> /var/log/farmacy-health.log
  # Opcional: enviar notificación (Slack, email, etc.)
fi
```

---

## Apéndice A: Referencia rápida de variables de entorno

| Variable | Dónde se usa | Valor default (desarrollo) |
|---|---|---|
| `DATABASE_URL` | Prisma / PostgreSQL | `postgresql://farmacy_user:farmacy_pass@localhost:5432/farmacy_db` |
| `REDIS_URL` | ioredis / BullMQ | `redis://localhost:6379` |
| `JWT_SECRET` | jsonwebtoken (admin) | — (requerida, min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh tokens | — (requerida, min 32 chars) |
| `JWT_CLIENTE_SECRET` | Clientes B2C | — (requerida, min 32 chars) |
| `NODE_ENV` | Express / seguridad | `development` |
| `LOG_LEVEL` | Winston | `debug` (dev) / `info` (prod) |
| `PORT` | Express | `3000` |
| `API_PREFIX` | Express | `/api/v1` |
| `FRONTEND_URL` | CORS | `http://localhost:5173` |
| `CORS_ORIGINS` | CORS producción | — (prod: lista separada por comas) |

---

> **Última actualización:** 2026-05-27
> **Próxima revisión:** 2026-07-27 (o tras cambios significativos en infraestructura)
