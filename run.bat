@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ══════════════════════════════════════════════════════════
::  FARMACY — Lanzador Universal
::
::  Levanta los contenedores de Docker (PostgreSQL, Redis,
::  pgAdmin), espera la base de datos, inicia backend y
::  frontend en ventanas separadas, y abre el navegador.
::
::  Requisitos previos:
::    • Haber ejecutado  setup.bat  al menos una vez
::    • Docker Desktop corriendo
::
::  Uso:  Doble clic en run.bat  ó  ejecutar desde terminal
:: ══════════════════════════════════════════════════════════

title Farmacy — Iniciando Aplicacion

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     FARMACY — Lanzador de Aplicacion         ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ── 1. Verificar Docker ─────────────────────────────────
echo [1/5] Verificando Docker...
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Docker no esta instalado o no esta en el PATH.
    echo  Instala Docker Desktop: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Docker no esta corriendo.
    echo  Abre Docker Desktop y espera a que inicie, luego vuelve a ejecutar run.bat.
    echo.
    pause
    exit /b 1
)
echo    Docker activo.
echo.

:: ── 2. Levantar contenedores ─────────────────────────────
echo [2/5] Levantando contenedores (PostgreSQL, Redis, pgAdmin)...
cd /d "%~dp0"
docker compose -f docker-compose.dev.yml up -d
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] No se pudieron levantar los contenedores.
    echo  Revisa los logs con: docker compose -f docker-compose.dev.yml logs
    echo.
    pause
    exit /b 1
)
echo    Contenedores iniciados.
echo.

:: ── 3. Esperar a que PostgreSQL esté listo ───────────────
echo [3/5] Esperando a que PostgreSQL este listo...
set MAX_RETRIES=30
set RETRY_COUNT=0

:pg_wait_loop
set /a RETRY_COUNT+=1
if %RETRY_COUNT% gtr %MAX_RETRIES% (
    echo.
    echo  [ERROR] PostgreSQL no respondio despues de %MAX_RETRIES% intentos.
    echo  Revisa los logs: docker logs farmacy_postgres_dev
    echo.
    pause
    exit /b 1
)

docker exec farmacy_postgres_dev pg_isready -U farmacy_user -d farmacy_db >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo    Intento %RETRY_COUNT%/%MAX_RETRIES% - Esperando...
    timeout /t 2 /nobreak >nul
    goto pg_wait_loop
)
echo    PostgreSQL listo y aceptando conexiones.
echo.

:: ── 4. Iniciar servidores de desarrollo ──────────────────
echo [4/5] Iniciando servidores de desarrollo...

:: Copiar .env a backend si no existe
if not exist "%~dp0backend\.env" (
    if exist "%~dp0.env" (
        echo    Copiando .env a backend...
        copy "%~dp0.env" "%~dp0backend\.env" >nul
    )
)

:: Iniciar Backend en nueva ventana
echo    Abriendo Backend (puerto 3001)...
start "Farmacy Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: Pequeña pausa para que el backend arranque primero
timeout /t 3 /nobreak >nul

:: Iniciar Frontend en nueva ventana
echo    Abriendo Frontend (puerto 5173)...
start "Farmacy Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo    Servidores iniciandose en ventanas separadas.
echo.

:: ── 5. Abrir navegador ───────────────────────────────────
echo [5/5] Abriendo navegador en http://localhost:5173 ...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"

:: ── Información final ────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   Farmacy esta corriendo!                    ║
echo  ║                                              ║
echo  ║   Frontend:  http://localhost:5173            ║
echo  ║   Backend:   http://localhost:3001/api/v1     ║
echo  ║   pgAdmin:   http://localhost:5050            ║
echo  ║                                              ║
echo  ║   Para detener todo:                         ║
echo  ║   1. Cierra las ventanas de Backend/Frontend  ║
echo  ║   2. Ejecuta:                                ║
echo  ║      docker compose -f docker-compose.dev.yml down ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  Puedes cerrar esta ventana. Los servidores siguen
echo  corriendo en sus propias ventanas.
echo.
pause
