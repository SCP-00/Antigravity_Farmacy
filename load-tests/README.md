# ══════════════════════════════════════════════════════════
#  FARMACY — Load Testing
#  Scripts de prueba de carga con k6
# ══════════════════════════════════════════════════════════

## Requisitos

- [k6](https://k6.io/docs/get-started/installation/) instalado
- Backend corriendo en `http://localhost:3000`
- Base de datos con seeds pobladas

## Instalación de k6

```bash
# Windows (PowerShell)
winget install k6

# Linux (Debian/Ubuntu)
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# macOS
brew install k6
```

## Scripts disponibles

| Script | Descripción | Flujo |
|---|---|---|
| `smoke-test.js` | Smoke test básico — verifica que los endpoints críticos responden | Catálogo, auth, productos, health |
| `catalogo-test.js` | Carga sobre el catálogo público | GET /productos, GET /categorias, GET /productos/buscar |
| `auth-test.js` | Carga sobre autenticación | POST /auth/login, POST /clientes/auth/registro |
| `catalogo-cliente-test.js` | Catálogo autenticado como cliente | Login cliente → productos → detalle |

## Ejecución

```bash
# Smoke test (1 usuario virtual, 1 iteración — verifica que todo funciona)
k6 run load-tests/smoke-test.js

# Carga catálogo (10 VUs, 30 segundos)
k6 run --vus 10 --duration 30s load-tests/catalogo-test.js

# Autenticación (5 VUs, 20 segundos)
k6 run --vus 5 --duration 20s load-tests/auth-test.js

# Checkout completo (3 VUs, 15 segundos)
k6 run --vus 3 --duration 15s load-tests/catalogo-cliente-test.js

# Todos los tests (corto)
k6 run load-tests/smoke-test.js && \
k6 run --vus 10 --duration 30s load-tests/catalogo-test.js && \
k6 run --vus 5 --duration 20s load-tests/auth-test.js && \
k6 run --vus 3 --duration 15s load-tests/catalogo-cliente-test.js
```

## Umbrales (thresholds) recomendados

| Métrica | Límite | Descripción |
|---|---|---|
| `http_req_duration` | p(95) < 2000ms | 95% de requests completados en < 2s |
| `http_req_failed` | rate < 0.01 | Menos del 1% de fallos |
| `http_reqs` | rate > 50/s | Mínimo 50 requests por segundo |
