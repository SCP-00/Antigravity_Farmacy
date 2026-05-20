@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

REM FARMACY - Launcher
REM Start Docker containers (Postgres, Redis, pgAdmin),
REM wait for DB, start backend and frontend, and open browser.
REM Requirements: run setup.bat first and have Docker Desktop running.
REM Usage: double-click run.bat or run from a terminal.

title Farmacy - Starting Application

echo.
echo FARMACY - Launcher
echo -------------------
echo.

REM 1) Verify Docker
echo [1/5] Verifying Docker...
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Docker is not installed or not in PATH.
    echo  Install Docker Desktop: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Docker daemon is not running.
    echo  Start Docker Desktop, wait for it to initialize, then run run.bat again.
    echo.
    pause
    exit /b 1
)
echo Docker activo.
echo.

REM 2) Start containers
echo [2/5] Starting containers (PostgreSQL, Redis, pgAdmin)...
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
echo Contenedores iniciados.
echo.

REM 3) Wait for PostgreSQL to be ready
echo [3/5] Waiting for PostgreSQL to be ready...
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
    echo    Attempt %RETRY_COUNT%/%MAX_RETRIES% - Waiting...
    timeout /t 2 /nobreak >nul
    goto pg_wait_loop
)
echo PostgreSQL is ready and accepting connections.
echo.

REM 4) Start development servers
echo [4/5] Starting development servers...

REM Copy .env to backend if not present
if not exist "%~dp0backend\.env" (
    if exist "%~dp0.env" (
        echo    Copying .env to backend...
        copy "%~dp0.env" "%~dp0backend\.env" >nul
    )
)

REM Start Backend in new window
echo Opening Backend (port 3001)...
start "Farmacy Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

REM Small pause for backend to start first
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
echo Opening Frontend (port 5173)...
start "Farmacy Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Servidores iniciandose en ventanas separadas.
echo.

REM 5) Open browser
echo [5/5] Opening browser at http://localhost:5173 ...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"

REM Final information
echo.
echo Farmacy is running!
echo
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001/api/v1
echo pgAdmin:  http://localhost:5050
echo
echo To stop everything:
echo  1) Close the Backend/Frontend windows
echo  2) Run: docker compose -f docker-compose.dev.yml down
echo
echo You can close this window. The servers will keep running in their own windows.
echo.
pause
