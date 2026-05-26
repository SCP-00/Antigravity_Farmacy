@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title Farmacy - Starting Application
cd /d "%~dp0"

:: ── Configuración ────────────────────────────────────────
:: Cambia a "true" si ejecutas en SSH/WSL/Codespaces (sin GUI)
set "HEADLESS=false"

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     FARMACY — Inicio de Aplicacion           ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ── 0. Verificar pnpm ───────────────────────────────────
echo [0/6] Verificando pnpm...
pnpm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] pnpm no esta disponible.
    echo  Instalalo con: npm install -g pnpm
    echo.
    pause
    exit /b 1
)
echo    pnpm detectado correctamente.
echo.

:: ── 1. Verificar Docker ─────────────────────────────────
echo [1/6] Verificando Docker...
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Docker no esta disponible.
    echo  Abre Docker Desktop y espera a que este listo.
    echo.
    pause
    exit /b 1
)
echo    Docker detectado correctamente.
echo.

:: ── 2. Limpiar procesos en puertos ───────────────────────
echo [2/7] Limpiando procesos en puertos 3000 y 5173...
powershell -Command "
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
        try { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } catch {}
    }
    Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object {
        try { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } catch {}
    }
" >nul 2>&1
echo    Puertos liberados.
echo.

:: ── 3. Verificar .env ────────────────────────────────────
echo [3/7] Verificando archivo .env...
if not exist ".env" (
    if exist ".env.example" (
        echo    Creando .env desde .env.example...
        copy /Y ".env.example" ".env" >nul
        echo.
        echo  [AVISO] Se creo .env desde .env.example.
        echo  Revisa y ajusta los valores antes de continuar.
        echo  (especialmente JWT_SECRET, JWT_CLIENTE_SECRET, etc.)
        echo.
        pause
    ) else (
        echo  [ERROR] No se encuentra .env ni .env.example.
        pause
        exit /b 1
    )
)
echo    .env encontrado.
echo.

:: ── 4. Instalar dependencias si faltan ───────────────────
echo [4/7] Verificando dependencias...
if not exist "node_modules" (
    echo    Instalando dependencias del monorepo...
    call pnpm install
    if !ERRORLEVEL! neq 0 (
        echo  [ERROR] Fallo pnpm install.
        pause
        exit /b 1
    )
)
echo    Dependencias listas.
echo.

:: ── 5. Levantar Docker (PostgreSQL + Redis) ──────────────
echo [5/7] Levantando contenedores Docker...
docker compose -f docker-compose.dev.yml up -d
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Fallo al levantar contenedores Docker.
    pause
    exit /b 1
)
echo    Contenedores iniciados.
echo.

:: ── 6. Iniciar servidores ────────────────────────────────
echo [6/7] Iniciando servidores...
echo.

if "%HEADLESS%"=="true" (
    start /B "" cmd /c "cd /d "%~dp0backend" && pnpm run dev" > backend.log 2>&1
    start /B "" cmd /c "cd /d "%~dp0frontend" && pnpm run dev" > frontend.log 2>&1
    echo    [Headless] Backend log: backend.log
    echo    [Headless] Frontend log: frontend.log
) else (
    start "Farmacy Backend" cmd /k "cd /d "%~dp0backend" && pnpm run dev"
    start "Farmacy Frontend" cmd /k "cd /d "%~dp0frontend" && pnpm run dev"
)

echo.
echo Esperando a que el backend responda (healthcheck)...
:WAIT_BACKEND
timeout /t 2 /nobreak >nul
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    goto WAIT_BACKEND
)
echo    Backend respondiendo en http://localhost:3000
echo.

echo Abriendo navegador...
timeout /t 2 /nobreak >nul
start "" "http://localhost:5173"
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║  Farmacy iniciado correctamente!             ║
echo  ║  Frontend: http://localhost:5173              ║
echo  ║  Backend:  http://localhost:3000/api/v1      ║
echo  ║  pgAdmin:  http://localhost:5050              ║
echo  ╚══════════════════════════════════════════════╝
echo.

endlocal