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
1. Verificar `node --version`
2. Instalar pnpm globalmente si no existe: `corepack enable pnpm`
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
| Si pnpm no existe | **Instalarlo automáticamente** con `corepack enable pnpm` |
| Flujo de inicio | Script automatizado, no manual |
| Modo de ejecución | Ventanas separadas (no headless) |

---

## 5. Casos de Error Específicos

Cada paso del flujo puede fallar de maneras distintas. A continuación se detallan los escenarios de error conocidos con su acción esperada y recuperación.

### 5.1 Node.js no instalado
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Paso [1/8] — `Get-Command "node"` falla |
| **Síntoma** | `node --version` lanza error "not recognized" |
| **Acción del script** | Escribe error → pausa → `exit 1` |
| **Recuperación manual** | Descargar Node.js LTS desde https://nodejs.org, ejecutar instalador, reiniciar PowerShell y volver a ejecutar `run.ps1` |
| **Tiempo estimado de resolución** | 2-5 minutos |
| **¿Se puede automatizar?** | Parcial — se podría descargar e instalar con winget/choco, pero requiere permisos de administrador que no siempre están disponibles |

### 5.2 pnpm no instalado
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Paso [2/8] — `Get-Command "pnpm"` falla |
| **Síntoma** | `pnpm --version` lanza error "not recognized" |
| **Acción del script** | Ejecuta `corepack enable pnpm` automáticamente. Si falla: error → pausa → `exit 1` |
| **Causas de fallo de instalación** | Sin permisos de administrador, corepack no disponible, sin conexión a internet, proxy corporativo bloqueando npm registry |
| **Recuperación manual** | `corepack enable pnpm` (como Admin), o descargar desde https://pnpm.io/installation |
| **Tiempo estimado de resolución** | 30s automático, 2min manual |

### 5.3 Docker no instalado
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Paso [3/8] — `Get-Command "docker"` falla |
| **Síntoma** | `docker info` lanza error "command not found" |
| **Acción del script** | Escribe error → pausa → `exit 1` |
| **Recuperación manual** | Instalar Docker Desktop desde https://www.docker.com/products/docker-desktop/. Requiere reinicio del sistema. Activar WSL2 en Windows si es necesario. |
| **Edge case: Docker instalado pero no corriendo** | `docker info` falla con error de conexión al daemon. El script detecta esto y muestra mensaje diferente: "Docker instalado pero no está corriendo. Abre Docker Desktop y espera a que esté listo." |
| **Edge case: WSL2 no configurado** | En Windows, Docker Desktop requiere WSL2. Si no está habilitado, `docker info` puede colgarse o mostrar error de backend no encontrado. |
| **Tiempo estimado de resolución** | 10-15 minutos (descarga + instalación + reinicio) |

### 5.4 Puertos ocupados (3000 o 5173)
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Paso [4/8] + inicio de servidores [8/8] |
| **Síntoma en [4/8]** | `Get-NetTCPConnection` encuentra procesos existentes. El script los mata automáticamente. |
| **Síntoma en [8/8]** | El backend/frontend lanza `EADDRINUSE` porque el puerto sigue ocupado (process kill falló silenciosamente) |
| **Acción del script** | En [4/8]: intenta `Stop-Process` con `-Force`. En [8/8]: el error se propaga como fallo del servidor. El healthcheck eventualmente da timeout. |
| **Edge cases** | 
| | **Proceso en otro usuario**: `Stop-Process` falla si el proceso pertenece a otro usuario (ej: Docker corriendo en SYSTEM). El healthcheck detectará que backend nunca responde. |
| | **Puerto privilegiado (<1024)**: No aplica (3000/5173 son no-privilegiados). |
| | **Proceso protegido (antivirus)**: Algunos antivirus protegen procesos contra terminación forzada. |
| **Recuperación manual** | `netstat -ano | findstr :3000` para encontrar PID. Luego `taskkill /PID <PID> /F`. Si el PID es de Docker, reiniciar Docker Desktop. |
| **Mejora futura** | En lugar de solo kill, reintentar con `taskkill /F` como fallback. Verificar que el puerto quede libre antes de continuar. |

### 5.5 .env no existe y no hay .env.example (o .env.example está vacío)
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Paso [5/8] — `Test-Path .env` = false |
| **Síntoma** | `Test-Path .env` = false, `Test-Path .env.example` = false (o `.env.example` existe pero está vacío) |
| **Acción del script** | Error → pausa → `exit 1` |
| **Recuperación manual** | Crear `.env` manualmente con las variables mínimas: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_CLIENTE_SECRET`. Ver `.env.example` del repositorio o la sección de Variables de Entorno en README.md. |
| **Edge case: .env.example vacío** | Si `.env.example` existe pero está vacío (`(Get-Item .env.example).Length -eq 0`), el script copia un template vacío y el backend falla al arrancar con un error confuso de variable faltante. El script debería verificar que `.env.example` tenga contenido significativo (mínimo 10 líneas no vacías) antes de copiarlo. |
| **Tiempo estimado de resolución** | 2-5 minutos |

### 5.6 Dependencias no instaladas y `pnpm install` falla
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Paso [6/8] — `Test-Path node_modules` = false, `pnpm install` falla |
| **Síntomas posibles** | Error de red (ECONNRESET, ETIMEOUT), error de autenticación en registry privado, falta de espacio en disco, error de compilación de dependencias nativas (node-gyp, sharp) |
| **Acción del script** | Captura la excepción → error → pausa → `exit 1` |
| **Recuperación manual** | 
| | **Error de red**: Verificar conexión, proxy: `pnpm config set proxy http://proxy:8080` |
| | **Error de compilación**: `pnpm install --ignore-scripts` (instala pero no compila) |
| | **Espacio en disco**: Liberar espacio, `pnpm store prune` para limpiar caché |
| | **Registry privado**: `pnpm config set registry https://registry.npmjs.org/` |
| **Tiempo estimado de resolución** | 1-5 minutos dependiendo de la causa |

### 5.7 Prisma generate falla
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Paso [6a/8] — `npx prisma generate` falla |
| **Síntomas posibles** | `EPERM` (query-engine bloqueado), sintaxis inválida en schema.prisma, versión incorrecta de Prisma CLI |
| **Acción del script** | Warning (no fatal) — imprime error pero continúa. El backend lanzará error al iniciar si Prisma Client no está generado. |
| **Recuperación manual** | `cd backend && npx prisma generate --schema=../database/prisma/schema.prisma`. Si es EPERM: cerrar todo proceso Node.js, esperar 5 segundos, reintentar. |
| **Tiempo estimado de resolución** | 30s |

### 5.8 Docker compose up falla
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Paso [7/8] — `docker compose -f docker-compose.dev.yml up -d` falla |
| **Síntomas posibles** | Puerto 5432/6379/5050 ya ocupado, docker-compose.dev.yml no encontrado (el script no verifica su existencia antes), error de sintaxis en YAML, imagen no encontrada, falta de memoria/disco |
| **Acción del script** | Captura excepción → error → pausa → `exit 1` |
| **Mejora futura** | Agregar `if (-not (Test-Path $composeFile))` antes de `docker compose` con mensaje claro: "No se encuentra docker-compose.dev.yml en la raíz del proyecto." |
| **Recuperación manual** | 
| | **Puerto ocupado**: `netstat -ano | findstr :5432` y matar proceso o cambiar puerto en docker-compose.dev.yml y .env |
| | **Archivo no encontrado**: Verificar que `docker-compose.dev.yml` exista en la raíz del proyecto |
| | **Error de sintaxis**: Validar YAML en https://yamlchecker.com |
| | **Imagen no encontrada**: Verificar conexión a Docker Hub, `docker pull postgres:15-alpine` manualmente |
| **Tiempo estimado de resolución** | 2-10 minutos |

### 5.9 Backend no responde (healthcheck timeout)
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Post [8/8] — healthcheck loop |
| **Síntoma** | `Invoke-WebRequest` a `http://localhost:3000/api/v1/health` nunca retorna 200 después de 60s |
| **Acción del script** | Timeout → error → pausa → `exit 1` |
| **Causas posibles** | 
| | **Prisma Client no generado** (error silencioso en paso 6a) |
| | **Base de datos no accesible** — PostgreSQL no inició, credenciales incorrectas |
| | **Error de compilación TypeScript** — nodemon no pudo transpilar |
| | **Puerto 3000 ocupado** por otro proceso que no se mató en paso [4/8] |
| | **Error de sintaxis** en algún archivo del backend |
| **Recuperación manual** | Abrir la ventana del backend y revisar los logs. Buscar errores como "ECONNREFUSED", "PrismaClientInitializationError", "listen EADDRINUSE". |
| **Mejora futura** | Capturar la salida de la ventana del backend y mostrarla en la consola principal para diagnóstico |

### 5.10 Frontend build falla
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Al iniciar Vite dev server en paso [8/8] |
| **Síntoma** | La ventana del frontend muestra error de compilación y se cierra inmediatamente |
| **Acción del script** | El healthcheck solo monitorea backend. Si el frontend falla, la ventana se cierra y el script lo detecta en el loop de monitoreo con el mensaje "Frontend detenido" |
| **Causas posibles** | Dependencia faltante, error de sintaxis en archivo .tsx, plugin de Vite mal configurado |
| **Recuperación manual** | Revisar la ventana del frontend o ejecutar `cd frontend && pnpm run dev` manualmente para ver los errores completos |

### 5.11 Ctrl+C — Limpieza de procesos
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | En cualquier momento durante la ejecución |
| **Síntoma** | Usuario presiona Ctrl+C en la ventana principal |
| **Acción del script** | `finally { Cleanup }` ejecuta `Stop-Process` para backendPID y frontendPID. El `Register-EngineEvent` es respaldo adicional. |
| **Edge cases** | 
| | **Ctrl+C durante docker compose**: Docker puede dejar contenedores iniciados pero el script ya no los detendrá. Los contenedores quedan corriendo en background. |
| | **Ctrl+C durante pnpm install**: pnpm maneja su propia señal y aborta la instalación. node_modules queda en estado inconsistente — toca borrar y reinstalar. |
| **Mejora futura** | Agregar cleanup de contenedores Docker: `docker compose -f docker-compose.dev.yml down` |

### 5.12 HEADLESS mode — Monitoreo de Jobs
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Cuando `$HEADLESS = $true` |
| **Síntoma** | `Get-Process -Id $BackendPID` se usa con un Job ID (no un Process PID), lo que siempre falla |
| **Acción del script** | El loop de monitoreo muestra "Backend detenido" incorrectamente porque `Get-Process` no encuentra un proceso con ese ID (aunque el Job siga vivo) |
| **Solución actual** | No hay — el loop de monitoreo solo funciona correctamente en modo normal (no headless) |
| **Mejora futura** | En headless mode, usar `Get-Job -Id $id | Where-Object { $_.State -eq 'Running' }` en lugar de `Get-Process` |

### 5.13 PowerShell Execution Policy bloquea run.ps1
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Al ejecutar `.\run.ps1` directamente desde PowerShell (no desde `run.bat`) |
| **Síntoma** | `File "...\run.ps1" cannot be loaded because running scripts is disabled on this system` |
| **Causa raíz** | PowerShell tiene `ExecutionPolicy` en `Restricted` (default en Windows). El wrapper `run.bat` usa `-ExecutionPolicy Bypass` y no sufre este problema, pero la ejecución directa de `run.ps1` sí. |
| **Solución** | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` y reintentar. O siempre ejecutar a través de `run.bat`. |
| **¿Se puede automatizar?** | El script mismo no puede cambiarlo (es el bloqueo lo que impide que cargue). Se podría incluir en `run.bat` como verificación. |

### 5.14 Limitaciones de Windows: Path length y Antivirus
| Propiedad | Detalle |
|---|---|
| **Dónde ocurre** | Transversal — puede afectar pasos [6/8] (pnpm install) y [6a/8] (prisma generate) |
| **Síntoma — Long paths** | `pnpm install` falla con `ENAMETOOLONG` o `Error: EPROTO` si la ruta del proyecto supera ~260 caracteres (límite MAX_PATH de Windows) |
| **Síntoma — Antivirus** | Prisma `query-engine-windows.exe` es puesto en cuarentena por Windows Defender, McAfee, o Avast. `prisma generate` falla con `EPERM` o "file not found" a pesar de existir. |
| **Solución — Long paths** | Habilitar paths largos en Windows 10/11: `gpedit.msc` → Computer Config → Administrative Templates → System → Filesystem → Enable NTFS long paths. O mover el proyecto a una ruta más corta (ej: `C:\Proyectos\Farmacy`). |
| **Solución — Antivirus** | Agregar exclusión en el antivirus para la carpeta del proyecto. En Windows Defender: `Settings → Virus & threat protection → Add exclusion → Folder`. |
| **Prevención en script** | `run.ps1` podría verificar la longitud de la ruta: `if ($PWD.Path.Length -gt 200) { Write-Warn "La ruta del proyecto es muy larga..." }` |

---

## 6. Plan de Rollback

### 6.1 Rollback por Commit (usando referencias portátiles)

Cada fase produce un commit independiente, lo que permite revertir cambios de forma selectiva.

**IMPORTANTE:** Los hashes de commit son locales a cada clon y cambian después de rebase. Usar `HEAD~N` para referencias portátiles:

| Comando | Efecto | Riesgo |
|---|---|---|
| `git revert HEAD --no-edit` | Revierte Fase 2 (run.ps1 + docs). **Más seguro** — solo scripts y documentación. | 🟢 Bajo |
| `git revert HEAD~1 --no-edit` | Revierte Fase 1 (nul cleanup, schema, .gitignore). **Precaución** — affecta schema de Prisma y gitignore. | 🟡 Medio |
| `git revert HEAD~2 --no-edit` | Revierte migraciones (React 19, Tailwind 4, tests). **Solo si las migraciones rompen producción.** | 🔴 Alto |
| `git revert HEAD~2..HEAD --no-edit` | Revierte TODO lo de esta sesión (Fase 1 + Fase 2, mantiene migraciones). **Rollback completo limpio.** | 🟡 Medio |

**Ejemplo: rollback completo a pre-Fase 1**

```bash
git revert HEAD~2..HEAD --no-edit
```
Esto revierte los 2 commits de Fase 1 y Fase 2, dejando el repositorio como estaba después de las migraciones (commit `934a702`).

**Para referencia, los commits en este clon son:**
| Fecha | Hash local | Descripción |
|---|---|---|
| HEAD | `78f3bd1` | run.ps1 + wrapper + docs |
| HEAD~1 | `0ae9a15` | Limpieza Fase 1 (nul, schema, gitignore) |
| HEAD~2 | `934a702` | Migraciones React 19 + Tailwind 4 + tests |

### 6.2 Rollback por Archivo (parcial)

Si un archivo individual causa problemas, se puede restaurar desde HEAD~1 sin revertir todo el commit:

```bash
# Restaurar run.bat a la versión anterior al último commit
git show HEAD~1:run.bat > run.bat

# Restaurar AGENTS.md
git show HEAD~1:AGENTS.md > AGENTS.md

# Eliminar run.ps1 si causa problemas
git rm --cached run.ps1 2>/dev/null
rm run.ps1 2>/dev/null
```

**Nota:** Si hay múltiples commits entre la versión actual y la deseada, usar `HEAD~2`, `HEAD~3`, etc. en lugar de `HEAD~1`.

### 6.3 Rollback Completo (último recurso)

Si el entorno queda inservible después de los cambios:

```bash
# 1. Revertir Fase 1 y Fase 2 (mantiene migraciones React/Tailwind)
git revert HEAD~2..HEAD --no-edit

# 2. Si también hay que revertir migraciones (último recurso):
git revert HEAD~2 --no-edit
# O más simple: git reset --hard HEAD~3 && git push --force-with-lease

# 3. Forzar reinstalación de dependencias
cd backend && rm -rf node_modules
cd ../frontend && rm -rf node_modules
cd .. && rm -rf node_modules
pnpm install

# 4. Regenerar Prisma
cd backend && npx prisma generate --schema=../database/prisma/schema.prisma

# 5. Verificar que todo funcione
npx tsc --noEmit
cd ../frontend && npx tsc --noEmit && npx vite build
```

### 6.4 Puntos de Control Naturales

| Punto | Antes de | Verificar |
|---|---|---|
| Pre-Fase 1 | Eliminar `nul`, modificar schema | Commit `934a702` es stable — tests pasan, build funciona |
| Pre-Fase 2 | Crear run.ps1 | Commit `0ae9a15` es stable — `nul` eliminado, sin debug logs |
| Post-commit run.ps1 | Cerrar sesión | Working tree clean, última versión de run.ps1 commiteada |

### 6.5 Rollback de Docker

Si los contenedores quedan en estado inconsistente después de un cierre forzado:

```bash
# Detener y eliminar contenedores, volúmenes y redes
docker compose -f docker-compose.dev.yml down -v

# Reconstruir sin caché
docker compose -f docker-compose.dev.yml build --no-cache

# Levantar de nuevo
docker compose -f docker-compose.dev.yml up -d
```

⚠️ **Advertencia:** `down -v` elimina **volúmenes**, lo que borra TODOS los datos de PostgreSQL y Redis. Usar solo si la base de datos está corrupta o es irrecuperable.

---

## 7. Preguntas Pendientes (actualizado)

- [x] ¿Mantener `run.bat` como wrapper que detecte PowerShell y ejecute `run.ps1`? → **Sí, implementado**
- [ ] ¿Vale la pena migrar `setup.bat` a `setup.ps1` también?
- [x] ¿Restaurar el `output` path en schema.prisma o dejarlo como está (funciona sin él)? → **Se dejó sin output path, funciona correctamente**
- [x] Definir timeouts para el healthcheck (actualmente infinito) → **60 segundos con intervalo de 2s, configurable**
- [ ] ¿Notificar en Slack/Teams/email cuando los servidores arranquen?
- [ ] En HEADLESS mode, ¿cómo monitorear jobs de PowerShell en lugar de procesos?
- [ ] ¿Agregar `docker compose down` en el cleanup de Ctrl+C?
- [ ] ¿Capturar logs del backend/frontend en la consola principal para diagnóstico?

---

## 8. Archivos Afectados

| Archivo | Acción | Estado |
|---|---|---|
| `run.bat` | Reescribir como wrapper | ✅ Commit 78f3bd1 |
| `run.ps1` | **Nuevo** — script principal de inicio | ✅ Commit 78f3bd1 |
| `backend/nul` | Eliminar | ✅ Commit 0ae9a15 |
| `backend/src/server.ts` | Revertir debug logs | ✅ Ya estaba limpio |
| `database/prisma/schema.prisma` | Eliminar output path (innecesario) | ✅ Commit 0ae9a15 |
| `.gitignore` | Agregar `.agents/`, `skills-lock.json`, `backend/coverage/` | ✅ Commit 0ae9a15 |
| `backend/nodemon.json` | Posible mejora: quitar `predev` redundante | ⬜ Pendiente |
| `AGENTS.md` | Actualizar documentación del nuevo flujo | ✅ Commit 78f3bd1 |
| `README.md` | Actualizar instrucciones | ✅ Commit 78f3bd1 |
| `docs/spec/resolver-run-batch-y-migraciones.md` | Este spec | ✅ Actualizado |

---

## 9. Entregables

1. ✅ **`run.ps1`** — Script PowerShell funcional para iniciar el entorno
2. ✅ **`run.bat`** actualizado — Wrapper que detecta PowerShell y ejecuta `run.ps1`
3. ✅ Limpieza de archivos corruptos (`backend/nul`, root `nul`, `backend_cmd.log`, `backend_output*.log`)
4. ✅ Actualización de documentación (`AGENTS.md`, `README.md`)
5. ✅ Git commit de Fase 1 y Fase 2
6. ⬜ **`setup.ps1`** — Migración opcional de setup.bat (futuro)
7. ⬜ **HEADLESS mode** — Fix de monitoreo de Jobs (futuro)

---

## 10. Criterios de Aceptación

### 10.1 Funcionalidad Principal

| # | Criterio | Cómo se verifica | Prioridad |
|---|---|---|---|
| CA-01 | `run.ps1` ejecuta desde PowerShell (`.un.ps1`) sin errores visibles de script | Ejecutar `powershell -File .\run.ps1; exit $LASTEXITCODE` desde CMD. Debe retornar exit code 0. **No usar** dot-source (`. .\run.ps1`) porque `exit` dentro del script anula cualquier `exit` posterior. | 🔴 Blocker |
| CA-02 | `run.bat` desde CMD detecta PowerShell y ejecuta `run.ps1` | Ejecutar `run.bat` desde CMD. Debe delegar a run.ps1 sin errores de sintaxis batch. | 🔴 Blocker |
| CA-03 | `run.bat` desde PowerShell muestra el banner e inicia la ejecución | Ejecutar `.\run.bat` desde PowerShell. Debe mostrar el banner de Farmacy y comenzar paso [1/8]. | 🔴 Blocker |
| CA-04 | Todos los pasos muestran su numeración correctamente: [1/8] a [8/8] | Ejecutar y observar la salida. No debe haber duplicados ni saltos en la numeración. | 🟡 Alta |

### 10.2 Verificación de Prerrequisitos

| # | Criterio | Cómo se verifica | Prioridad |
|---|---|---|---|
| CA-05 | Si Node.js no está instalado, el script muestra error claro con instrucciones | Desinstalar Node.js temporalmente (o renombrar `node.exe`), ejecutar `run.ps1`. Debe mostrar "Node.js no esta instalado. Descargalo en: https://nodejs.org" y hacer pausa. | 🟡 Alta |
| CA-06 | Si pnpm no está instalado, el script lo activa automáticamente | Desinstalar pnpm temporalmente (`pnpm uninstall -g pnpm`). Ejecutar `run.ps1`. Debe activar pnpm y continuar. El mensaje debe decir "pnpm no encontrado. Activando corepack para pnpm..." | 🟡 Alta |
| CA-07 | Si pnpm no se puede activar automáticamente, el script muestra error y se detiene | Simular fallo de corepack: `npm config set registry https://registry.invalid`. Ejecutar `run.ps1`. Debe mostrar "No se pudo activar pnpm" y hacer pausa. Restaurar registry después. | 🟡 Alta |
| CA-08 | Si Docker no está instalado, el script muestra error claro | Desinstalar Docker temporalmente. Ejecutar `run.ps1`. Debe mostrar "Docker no esta instalado o no esta en el PATH." | 🟡 Alta |
| CA-09 | Si Docker está instalado pero no corriendo, el script muestra mensaje específico | Detener Docker Desktop. Ejecutar `run.ps1`. Debe mostrar "Docker esta instalado pero no esta corriendo." (diferente del mensaje de "no instalado") | 🟡 Alta |
| CA-10 | Si `.env` no existe, se crea desde `.env.example` automáticamente | Renombrar `.env` a `.env.bak`. Ejecutar `run.ps1`. Debe crear `.env` copiando `.env.example`. Mostrar "Revisa y ajusta los valores antes de continuar." | 🟡 Alta |
| CA-11 | Si `.env` y `.env.example` no existen, el script muestra error | Renombrar ambos archivos. Ejecutar `run.ps1`. Debe mostrar "No se encuentra .env ni .env.example" | 🟡 Alta |

### 10.3 Docker y Servicios

| # | Criterio | Cómo se verifica | Prioridad |
|---|---|---|---|
| CA-12 | Docker containers (Postgres, Redis, pgAdmin) se inician correctamente | `docker compose -f docker-compose.dev.yml ps` debe mostrar 3 containers con estado "Up" después de ejecutar `run.ps1` | 🔴 Blocker |
| CA-13 | Si los puertos 5432/6379/5050 ya están ocupados, Docker compose falla con mensaje claro | Ocupar el puerto 5432 artificialmente (ej: `netstat` + matar no es práctico). Simular lanzando `docker compose` con un puerto ocupado conocido. | 🟡 Alta |

### 10.4 Servidores e Healthcheck

| # | Criterio | Cómo se verifica | Prioridad |
|---|---|---|---|
| CA-14 | Backend inicia en `http://localhost:3000` | Después de ejecutar `run.ps1`, `curl http://localhost:3000/api/v1/health` debe responder con status 200 | 🔴 Blocker |
| CA-15 | El healthcheck loop logra detectar que el backend responde y continúa | El script debe mostrar "Backend respondiendo en http://localhost:3000" y procedir a abrir el navegador | 🔴 Blocker |
| CA-16 | Si el backend no responde después de 60s, el healthcheck timeout con error | **No destructivo:** No iniciar Docker (detener Docker Desktop o no ejecutar `docker compose up`). El backend fallará al conectar a PostgreSQL, y el healthcheck debe dar timeout después de 60s con mensaje claro. Alternativa: cambiar el puerto del backend temporalmente. | 🟡 Alta |
| CA-17 | El tiempo de healthcheck es configurable via `$HEALTHCHECK_TIMEOUT` | Cambiar `$HEALTHCHECK_TIMEOUT = 5` en `run.ps1`. Ejecutar. Debe timeout después de ~5s. Restaurar valor. | 🟢 Media |
| CA-18 | Frontend inicia en `http://localhost:5173` | Después de ejecutar `run.ps1`, visitar `http://localhost:5173` debe cargar la app sin errores de consola | 🔴 Blocker |
| CA-19 | El navegador se abre automáticamente al finalizar | Ejecutar `run.ps1` con `$HEADLESS = $false`. Una vez que el healthcheck pase, debe ejecutarse `Start-Process "http://localhost:5173"` | 🟢 Media |

### 10.5 Limpieza y Cierre

| # | Criterio | Cómo se verifica | Prioridad |
|---|---|---|---|
| CA-20 | Ctrl+C mata los procesos del backend y frontend | Iniciar con `run.ps1`. Presionar Ctrl+C. Verificar que `Get-Process -Id $BackendPID` y `Get-Process -Id $FrontendPID` ya no existan (o que las ventanas se cierren). | 🔴 Blocker |
| CA-21 | El mensaje de cierre muestra "Cerrando servidores..." y confirma limpieza | Después de Ctrl+C, el script debe mostrar "Cerrando servidores...", "Backend detenido", "Frontend detenido", "Procesos limpiados." | 🟡 Alta |
| CA-22 | No quedan archivos `nul` en el proyecto después de ejecutar | `dir /s nul` no debe encontrar ningún archivo llamado `nul` (en CMD) | 🟡 Alta |
| CA-23 | Los contenedores Docker NO se detienen al hacer Ctrl+C (quedan para próxima ejecución) | Después de Ctrl+C, `docker ps` debe mostrar los contenedores aún corriendo | 🟢 Media |

### 10.6 Integridad del Código

| # | Criterio | Cómo se verifica | Prioridad |
|---|---|---|---|
| CA-24 | Los 510 tests del backend siguen pasando | `cd backend && pnpm run test` debe reportar 510 passed, 0 failed, 0 skipped | 🔴 Blocker |
| CA-25 | TypeScript backend 0 errores | `cd backend && npx tsc --noEmit` debe retornar exit code 0 | 🔴 Blocker |
| CA-26 | TypeScript frontend 0 errores | `cd frontend && npx tsc --noEmit` debe retornar exit code 0 | 🔴 Blocker |
| CA-27 | Frontend build exitoso sin errores | `cd frontend && npx vite build` debe completar con exit code 0. Warnings de chunk size permitidos. | 🟡 Alta |

### 10.7 Escenarios de Frontera (Edge Cases)

| # | Criterio | Cómo se verifica | Prioridad |
|---|---|---|---|
| CA-28 | Ejecución desde la raíz del proyecto (no desde `backend/` ni `frontend/`) | `cd C:\...\Antigravity_Farmacy && .\run.ps1`. El script debe funcionar desde cualquier directorio dentro de la unidad. | 🟡 Alta |
| CA-29 | Ruta del proyecto con espacios (ej: `C:\My Projects\Farmacy`) | Mover el proyecto temporalmente a una ruta con espacios. Ejecutar `run.ps1`. Verificar que `Set-Location`, `Start-Process` y `Join-Path` funcionen correctamente. | 🟢 Media |
| CA-30 | HEADLESS mode sin ventanas emergentes | `$HEADLESS = $true`. Ejecutar. Backend y frontend deben iniciar como background jobs sin abrir ventanas. | 🟢 Media |
| CA-31 | HEADLESS mode + monitoreo de jobs (fix pendiente) | ⬜ **Futuro** — No implementado actualmente. Cuando se implemente: en headless mode, el bucle `while ($true)` no debe mostrar falsos positivos de "servidor detenido" cuando los jobs siguen vivos. Usar `Get-Job` en lugar de `Get-Process`. | ⬜ Futuro |
| CA-32 | Ejecución con proxy corporativo | Configurar `HTTP_PROXY` y `HTTPS_PROXY`. `pnpm install` debe funcionar a través del proxy. | 🟢 Media |
| CA-33 | Ejecución sin conexión a internet | Desconectar la red. En paso [6/8], `pnpm install` debe fallar si no hay caché local. El script debe mostrar error claro. | 🟢 Media |
| CA-34 | Doble ejecución (segunda instancia mientras la primera corre) | Abrir dos terminales PowerShell. Ejecutar `run.ps1` en ambas. La segunda debe fallar al intentar matar procesos y al intentar ocupar puertos ya ocupados. | 🟢 Media |
| CA-36 | El script verifica que `docker-compose.dev.yml` existe antes de ejecutar `docker compose -f` | Revisar el código en paso [7/8]. Si no existe el archivo, debe mostrar error claro: "No se encuentra docker-compose.dev.yml". | 🟡 Alta |
| CA-37 | Si `.env.example` existe pero está vacío, el script lo detecta y muestra advertencia | `(Get-Item .env.example).Length -eq 0` debe lanzar advertencia. Opcional: abortar si el template está vacío. | 🟢 Media |
| CA-38 | Ejecución desde PowerShell Core 7 (`pwsh.exe`) vs Windows PowerShell 5.1 | Probar con ambos. El script debe funcionar en ambos shells. | 🟡 Alta |
