@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ══════════════════════════════════════════════════════════
::  FARMACY — Setup Universal
::
::  Instala todas las dependencias del proyecto y prepara
::  la base de datos para desarrollo local.
::
::  Requisitos:
::    • Node.js 18+   (https://nodejs.org)
::    • Docker Desktop (https://www.docker.com/products/docker-desktop)
::
::  Uso:  Doble clic en setup.bat  ó  ejecutar desde terminal
:: ══════════════════════════════════════════════════════════

title Farmacy — Instalacion de Dependencias

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     FARMACY — Setup de Entorno Local         ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ── 1. Verificar Node.js ─────────────────────────────────
echo [1/6] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Node.js no esta instalado.
    echo  Descargalo en: https://nodejs.org
    echo  Instala la version LTS y vuelve a ejecutar este script.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo    Node.js detectado: %NODE_VER%

:: Verificar pnpm
where pnpm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [INFO] pnpm no encontrado. Activando corepack para pnpm...
    call corepack enable pnpm
    if !ERRORLEVEL! neq 0 (
        echo  [ERROR] No se pudo activar pnpm. Activalo manualmente: corepack enable pnpm
        pause
        exit /b 1
    )
    echo    pnpm activado via corepack.
)
for /f "tokens=*" %%v in ('pnpm -v') do set PNPM_VER=%%v
echo    pnpm detectado:     v%PNPM_VER%
echo.

:: ── 2. Verificar Docker ─────────────────────────────────
echo [2/6] Verificando Docker...
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [AVISO] Docker no esta instalado o no esta en el PATH.
    echo  El proyecto necesita PostgreSQL y Redis.
    echo  Opciones:
    echo    a) Instalar Docker Desktop: https://www.docker.com/products/docker-desktop
    echo    b) Tener PostgreSQL y Redis instalados localmente
    echo.
    echo  Continuando con la instalacion de dependencias pnpm...
    echo.
) else (
    for /f "tokens=*" %%v in ('docker --version') do set DOCKER_VER=%%v
    echo    !DOCKER_VER!

    :: Verificar que Docker daemon esté corriendo
    docker info >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        echo.
        echo  [AVISO] Docker esta instalado pero no esta corriendo.
        echo  Abre Docker Desktop antes de usar run.bat.
        echo.
    ) else (
        echo    Docker daemon activo.
    )
    echo.
)

:: ── 3. Instalar dependencias ─────────────────────────────
echo [3/6] Instalando dependencias del proyecto...
echo.

echo    Raiz del proyecto...
cd /d "%~dp0"
call pnpm install
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Fallo al instalar dependencias en la raiz.
    pause
    exit /b 1
)
echo.

echo    Backend...
cd /d "%~dp0backend"
call pnpm install
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Fallo al instalar dependencias del backend.
    pause
    exit /b 1
)
echo.

echo    Frontend...
cd /d "%~dp0frontend"
call pnpm install
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Fallo al instalar dependencias del frontend.
    pause
    exit /b 1
)
echo.

:: ── 4. Generar Prisma Client ─────────────────────────────
echo [4/6] Generando Prisma Client...
cd /d "%~dp0backend"
call pnpm run db:generate
if %ERRORLEVEL% neq 0 (
    echo  [AVISO] No se pudo generar el Prisma Client.
    echo  Verifica que el schema.prisma exista en database/prisma/
    echo.
) else (
    echo    Prisma Client generado correctamente.
    echo.
)

:: ── 5. Aplicar esquema a la base de datos ────────────────
echo [5/6] Aplicando esquema a la base de datos (db push)...
echo    Asegurate de que PostgreSQL este corriendo.
cd /d "%~dp0backend"
call pnpm run db:push
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [AVISO] No se pudo aplicar el esquema. Posibles causas:
    echo    - PostgreSQL no esta corriendo
    echo    - Las variables de entorno no estan configuradas
    echo  Ejecuta 'run.bat' primero para levantar Docker, luego repite este paso.
    echo.
) else (
    echo    Esquema aplicado correctamente.
    echo.
)

:: ── 6. Poblar base de datos con seeds ────────────────────
echo [6/6] Poblando base de datos con datos semilla...
cd /d "%~dp0backend"
call pnpm run db:seed
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [AVISO] No se pudieron cargar los seeds. Posibles causas:
    echo    - PostgreSQL no esta corriendo
    echo    - El esquema aun no se ha aplicado
    echo  Puedes ejecutar manualmente: cd backend ^&^& pnpm run db:seed
    echo.
) else (
    echo    Datos semilla cargados correctamente.
    echo.
)

:: ── Fin ──────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   Setup completado exitosamente!             ║
echo  ║                                              ║
echo  ║   Siguiente paso:                            ║
echo  ║   Ejecuta  run.bat  para iniciar Farmacy     ║
echo  ╚══════════════════════════════════════════════╝
echo.

cd /d "%~dp0"
pause
