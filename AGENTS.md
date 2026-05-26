# FARMACY — AGENTS.md

Guía rápida para desarrolladores IA y humanos que trabajan en este proyecto.

## Quick start (Windows)
1. `setup.bat` — Instala deps, genera Prisma Client, hace db push, corre seeds
2. `.\run.ps1` — Inicia Docker (Postgres + Redis), backend (nodemon :3000), frontend (Vite 6 :5173)
   - Ejecutar directamente desde PowerShell
3. Alternativa manual: `docker compose -f docker-compose.dev.yml up -d` + `cd backend && pnpm run dev` + `cd frontend && pnpm run dev`

## Services + ports
| Service | Port | Container |
|---|---|---|
| PostgreSQL 15 | 5432 | `farmacy_postgres_dev` |
| Redis 7 | 6379 | `farmacy_redis_dev` |
| pgAdmin | 5050 | `farmacy_pgadmin` (admin@farmacy.co / admin) |
| Backend (Express) | 3000 | Corre en host via nodemon |
| Frontend (Vite) | 5173 | Proxy `/api` → 127.0.0.1:3000 |

## Prisma + database (Colombian INVIMA/CUM Integration)
- Schema: `database/prisma/schema.prisma`
- Todos los scripts usan `--schema=../database/prisma/schema.prisma`
- **17 modelos:** Sucursal, Empleado, Categoria, Producto (35+ campos INVIMA), Lote, Proveedor, OrdenCompra, Venta, PagoTransaccion, etc.
- Producto tiene `cum` (unique), `registroInvima`, `principioActivo`, `atc`, `esMuestraMedica`, `alergenos`, `advertencias`
- Muestras médicas (`esMuestraMedica: true`) bloqueadas en ruta `/buscar`
- Seed: `pnpm run db:seed` desde `backend/`

## Pasarelas de pago
| Pasarela | Sandbox Keys | Estado |
|---|---|---|
| Wompi | `pub_test_*`, `prv_test_*`, `test_integrity_*` | ✅ Sandbox configurado |
| Stripe | `pk_test_*`, `sk_test_*`, `whsec_*` | ✅ Test keys |
| MercadoPago | `TEST-*` access token + public key | ✅ Sandbox configurado |
| Efectivo | — | ✅ Sin pasarela |

## Credenciales de desarrollo (seeds)
| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@farmacy.co | Admin@1234 |
| Farmacéuta | farmaceuta@farmacy.co | Farm@1234 |
| Auxiliar | auxiliar@farmacy.co | Aux@1234 |
| Cliente demo | cliente@ejemplo.co | Cliente@1234 |

## Variables de entorno esenciales
- `DATABASE_URL` — PostgreSQL (requerida)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_CLIENTE_SECRET` — mínimo 32 caracteres cada una
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth social (opcional)
- `WOMPI_*` — Wompi (opcional para sandbox)
- `STRIPE_*` — Stripe (opcional)
- `MERCADOPAGO_*` — MercadoPago (opcional)

## Tech stack
- **Runtime:** Node.js v24.15.0 + pnpm v11.2.2
- **Backend:** Express 4 + TypeScript 6.0 + Prisma 5.22
- **Frontend:** React 19 + TypeScript 6.0 + Vite 6.4 + Tailwind CSS 4
- **Build:** @tailwindcss/vite plugin (reemplaza postcss + autoprefixer)
- **Testing:** Vitest v3 (510 tests, 95.35% cobertura)

## Script entrypoints
- Backend: `backend/src/server.ts` (conecta DB antes de HTTP)
- Frontend: `frontend/src/main.tsx` (React 18 + QueryClient)
- Tests: Vitest v3 en `backend/` + `frontend/` (27 archivos, 462 tests, 83.7% cobertura)

## Uso de browser-use (Playwright) — solo pnpm

Este proyecto **NO usa npm**. Solo `pnpm` está instalado y disponible.

### Instalación de Playwright (solo una vez)
```bash
# Desde la raíz del proyecto
pnpm add -D playwright
pnpm exec playwright install chromium
```

Playwright instala Chromium en:
```
C:\Users\<usuario>\AppData\Local\ms-playwright\chromium-XXXX\chrome-win64\chrome.exe
```

### Ejecutar browser-use desde Codebuff
```bash
# El agente browser-use necesita Chrome/Chromium en el PATH del sistema.
# Si ya se ejecutó la instalación de Playwright, agregar al PATH:
$env:Path += ";C:\Users\andyh\AppData\Local\ms-playwright\chromium-1223\chrome-win64"
```

> **⚠️ Importante:** El agente `browser-use` depende del System Info cacheado al inicio de la conversación. Si al inicio reporta `Chrome: not found`, no podrá usarse en **esa conversación** aunque Chromium esté en PATH. En una **nueva conversación**, Codebuff reevaluará el System Info y detectará Chromium correctamente. Como alternativa inmediata, se puede usar un script Playwright directo.

### Script de prueba alternativo (cuando browser-use no funciona)
Crear `test-app.mjs` temporal:
```js
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Escuchar errores de consola
page.on("console", msg => console.log(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", err => console.log(`[PAGE ERROR] ${err.message}`));

// Navegar y verificar
await page.goto("http://localhost:5173");
const title = await page.title();
console.log(`Page title: ${title}`);

// Verificar que React root renderizó
const root = await page.$("#root");
console.log(`React root: ${root ? "✅ presente" : "❌ ausente"}`);

await browser.close();
```
Ejecutar con: `node test-app.mjs` (no necesita npm, solo Node.js + Playwright instalado vía pnpm)

---

## ⚠️ Cuidado con procesos (kill safety)

**NUNCA** uses estos comandos, porque pueden matar `freebuff.cmd` y otros procesos del entorno:

| ❌ Comando peligroso | Riesgo |
|---|---|
| `taskkill /F /IM node.exe` | Mata **todos** los procesos Node.js, incluyendo freebuff.cmd u otros asistentes |
| `Get-Process node \| Stop-Process` | Igual que arriba — mata todo proceso Node.js |
| `Stop-Process -Name "node"` | Mata TODOS los Node.js sin filtrar |
| `taskkill /F /FI "IMAGENAME eq node*"` | Igual — filtro demasiado amplio |

### ✅ Forma segura de detener servidores

Solo matar por **PID específico** capturado al iniciar el proceso:

```powershell
# Capturar PID al iniciar
$backendPID = (Start-Process ... -PassThru).Id

# Matar solo ese PID específico
Stop-Process -Id $backendPID -Force
```

O liberar solo el puerto conocido (sin matar procesos no relacionados):

```powershell
$pidOnPort = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess
if ($pidOnPort) { Stop-Process -Id $pidOnPort -Force }
```

### Referencia rápida de comandos seguros

| Acción | Comando seguro |
|---|---|
| Detener backend por PID | `Stop-Process -Id $BACKEND_PID -Force` |
| Detener frontend por PID | `Stop-Process -Id $FRONTEND_PID -Force` |
| Liberar puerto 3000 | `Get-NetTCPConnection -LocalPort 3000 \| Stop-Process` |
| Verificar qué ocupa un puerto | `netstat -ano \| findstr :3000` |
| Dejar Docker intacto | **No tocar** `docker` ni contenedores |

> **Regla de oro:** Nunca uses `taskkill /F /IM` ni filtres por nombre de proceso. Siempre usa el PID específico.

---

## 📝 Regla: documentar cambios + git commit/push siempre

Cada vez que se modifique el código o la configuración del proyecto, se debe:

### 1. Documentar en AGENTS.md y/o docs/
- Si el cambio afecta el flujo de trabajo de IA → actualizar `AGENTS.md`
- Si el cambio es funcional (rutas, DB, features) → actualizar `docs/` correspondiente
- Si es un milestone → registrar en `docs/worklog.md`

### 2. Hacer git commit con mensaje descriptivo
```bash
git add .
git commit -m "tipo: descripción clara del cambio"
```
Tipos de commit recomendados: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

### 3. Hacer git push
```bash
git push
```

> **⚠️ Importante:** No dejar cambios sin commitear ni documentación desactualizada. El commit y push son parte obligatoria de cada tarea completada.
