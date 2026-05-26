# Spec: Resolver `run.bat` y Estabilizar el Entorno Post-Migración

**Fecha:** 2026-05-26
**Estado:** Borrador — Pendiente de implementación

---

## 1. Resumen Ejecutivo

El proyecto `Antigravity_Farmacy` sufrió migraciones mayores (React 18→19, Tailwind 3→4, TypeScript 6, Vite 6) que, aunque exitosas en cobertura de tests (95.35%) y compilación TypeScript, dejaron **6 issues concretos** que impiden ejecutar `run.bat` correctamente y arrancar el entorno de desarrollo.

---

## 2. Problemas Identificados

### 🔴 P1 — `run.bat` no funciona desde PowerShell
**Síntoma:** El script muestra `[0/6] Verificando pnpm...` y luego retorna al prompt sin errores visibles.

**Causa raíz:** `run.bat` está escrito en CMD batch. Cuando se ejecuta desde PowerShell, el `exit /b 1` de la verificación de pnpm (si pnpm no está en PATH) provoca que PowerShell capture el exit code y retorne al prompt inmediatamente. Además:
- El título `title Farmacy...` no se muestra en PowerShell
- `start` se comporta diferente desde PowerShell
- `PAUSE` no funciona como en CMD puro

**Solución propuesta:** Crear `run.ps1` (PowerShell script) que reemplace a `run.bat`, con la misma lógica pero adaptada a PowerShell. Alternativamente, hacer que `run.bat` detecte si está siendo ejecutado desde PowerShell y se comporte distinto.

---

### 🔴 P2 — Archivo `backend\nul` corrupto
**Síntoma:** Existe un archivo literalmente llamado `nul` en `backend/`.
**Causa:** Las redirecciones `>nul 2>&1` en los scripts `.bat`, al ejecutarse desde PowerShell o en ciertas condiciones, pueden crear un archivo llamado `nul` en lugar de descartar la salida al dispositivo NUL del sistema. En Windows, `nul` es un nombre reservado de dispositivo DOS — tener un archivo real con ese nombre causa comportamientos impredecibles.
**Solución:** 
1. Eliminar el archivo usando sintaxis especial de Windows: `\\.\C:\path\to\backend\nul`
2. Asegurarse de que `run.ps1` use `$null` en lugar de `nul` para descartar salida

---

### 🔴 P3 — Prisma `EPERM` en `predev`
**Síntoma:** `pnpm run dev` falla con `EPERM: operation not permitted, rename ...query-engine-windows.exe.tmpXXXX`.

**Causa:** El script `predev` ejecuta `prisma generate` antes de `dev`. Cuando el backend se cierra forzosamente (Ctrl+C o cerrando terminal), el binario `query-engine-windows.exe` queda bloqueado por el sistema operativo. El siguiente intento de `prisma generate` no puede renombrar el binario temporal porque el anterior está bloqueado.

**Solución:**
1. Agregar un paso en `run.ps1` que mate procesos Node.js/Prisma huérfanos antes de iniciar
2. Agregar verificación de que no haya procesos en puerto 3000 antes de iniciar backend
3. Opcional: en `nodemon.json` evitar `predev` redundante si Prisma ya está generado

---

### 🟡 P4 — Uncommitted changes de herramientas
**Archivos modificados (no commiteados):**
| Archivo | Cambio | Acción |
|---|---|---|
| `backend/src/server.ts` | `console.error` de debug agregados | ✅ Limpiar (revertir debug logs) |
| `database/prisma/schema.prisma` | Línea `output = "../../backend/node_modules/.prisma/client"` eliminada | ⚠️ Decidir si restaurar o dejar así — la generación funciona sin ella |
| `backend/nul` | Archivo corrupto | 🗑️ Eliminar |

### 🟡 P5 — BACKEND/.env desincronizado
**Problema:** `backend/.env` tiene `DATABASE_URL=postgresql://farmacy:farmacy123@localhost:5432/farmacy_dev` mientras que `docker-compose.dev.yml` configura `farmacy_user:farmacy_pass` y la base `farmacy_db`.

**Impacto:** Nulo en la práctica — el root `.env` se carga después y sobrescribe. Pero es confuso y frágil.

**Solución:** Sincronizar o documentar que `backend/.env` es solo para respaldos/scripts y el root `.env` es el que manda.

---

### 🟡 P6 — Numbering inconsistente en run.bat
**Problema:** Los pasos en `run.bat` van de `[0/6]` → `[1/6]` → `[2/7]` → ... → `[6/7]`. El denominador cambia de 6 a 7 en el paso 2.

**Solución:** Resolver al migrar a run.ps1 — usar numeración consistente.

---

## 3. Plan de Acción Propuesto

### Fase 1: Diagnóstico y limpieza
1. Verificar `node --version` y `npm --version`
2. Instalar pnpm globalmente si no existe: `npm install -g pnpm`
3. Eliminar archivo `backend/nul`
4. Matar procesos huérfanos en puertos 3000 y 5173
5. Hacer `prisma generate` manualmente para verificar que funciona
6. Limpiar debug logs de `server.ts`

### Fase 2: Crear run.ps1
1. Script PowerShell que reemplace a `run.bat`
2. Pasos análogos:
   - Verificar Node.js
   - Verificar / instalar pnpm automáticamente
   - Verificar Docker
   - Matar procesos en puertos 3000 y 5173
   - Verificar .env (crear desde .env.example si no existe)
   - `pnpm install` si faltan dependencias
   - `prisma generate`
   - `docker compose -f docker-compose.dev.yml up -d`
   - Iniciar backend + frontend en ventanas separadas
   - Healthcheck hasta que backend responda
   - Abrir navegador en localhost:5173
3. Usar `$null` en lugar de `nul` para redirecciones
4. Usar `Start-Process` en lugar de `start`
5. Manejo de errores con `try/catch`

### Fase 3: Validación
1. Ejecutar `run.ps1` de principio a fin
2. Verificar health endpoint
3. Verificar frontend cargando
4. Ejecutar tests: `cd backend && pnpm run test`
5. Ejecutar build: `cd frontend && pnpm run build`
6. Commit de todos los cambios

---

## 4. Decisiones Tomadas (de las entrevistas)

| Decisión | Opción elegida |
|---|---|
| Gestor de paquetes | **pnpm** (el proyecto lo usa) |
| Script de inicio | **PowerShell (.ps1)**, actualizar run.bat a un wrapper |
| Si pnpm no existe | **Instalarlo automáticamente** con `npm install -g pnpm` |
| Flujo de inicio | Script automatizado, no manual |
| Modo de ejecución | Ventanas separadas (no headless) |

---

## 5. Preguntas Pendientes

- [ ] ¿Mantener `run.bat` como wrapper que detecte PowerShell y ejecute `run.ps1`?
- [ ] ¿Vale la pena migrar `setup.bat` a `setup.ps1` también?
- [ ] ¿Restaurar el `output` path en schema.prisma o dejarlo como está (funciona sin él)?
- [ ] Definir timeouts para el healthcheck (actualmente infinito)
- [ ] ¿Notificar en Slack/Teams/email cuando los servidores arranquen?

---

## 6. Archivos Afectados

| Archivo | Acción |
|---|---|
| `run.bat` | Reescribir como wrapper |
| `run.ps1` | **Nuevo** — script principal de inicio |
| `backend/nul` | Eliminar |
| `backend/src/server.ts` | Limpiar debug logs |
| `backend/src/config/database.ts` | Posible mejora: mejor manejo de errores de conexión |
| `backend/nodemon.json` | Posible mejora: quitar `predev` redundante |
| `AGENTS.md` | Actualizar documentación del nuevo flujo |
| `README.md` | Actualizar instrucciones |

---

## 7. Entregables

1. **`run.ps1`** — Script PowerShell funcional para iniciar el entorno
2. **`run.bat`** actualizado — Wrapper que detecta PowerShell y ejecuta `run.ps1`
3. Limpieza de archivos corruptos (`backend/nul`, debug logs)
4. Actualización de documentación
5. Git commit con todos los cambios

---

## 8. Criterios de Aceptación

- ✅ `run.ps1` ejecuta desde PowerShell sin errores
- ✅ Docker containers (Postgres, Redis, pgAdmin) arrancan
- ✅ Backend inicia en `http://localhost:3000` y `/api/v1/health` responde 200
- ✅ Frontend inicia en `http://localhost:5173` sin errores de compilación
- ✅ Al abrir `localhost:5173` se ve la app de Farmacy (no pantalla en blanco)
- ✅ `ctrl+c` limpia los procesos correctamente
- ✅ Los 510 tests siguen pasando
- ✅ No hay archivos `nul` corruptos en el proyecto
- ✅ No hay TypeScript errors en backend ni frontend
