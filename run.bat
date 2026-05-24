@echo off
title Farmacy - Starting Application
cd /d "%~dp0"

echo [1/4] Limpiando procesos huerfanos en los puertos 3000 y 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1

if not exist "backend\.env" (
  echo [2/4] backend/.env no encontrado, copiando .env raiz...
  if exist ".env" (
    copy /Y ".env" "backend\.env" >nul
  ) else (
    echo [AVISO] .env raiz no encontrado. Crealo desde .env.example.
  )
)

echo [3/4] Levantando contenedores Docker (PostgreSQL y Redis)...
docker compose -f docker-compose.dev.yml up -d

echo [4/4] Iniciando Backend...
start "Farmacy Backend" cmd /k "cd /d "%~dp0backend" && pnpm run dev"

echo Esperando a que el backend inicie (puerto 3000)...
:WAIT_BACKEND
netstat -an | find "3000" | find "LISTENING" >nul
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto WAIT_BACKEND
)

echo Backend listo. Iniciando Frontend...
start "Farmacy Frontend" cmd /k "cd /d "%~dp0frontend" && pnpm run dev"

echo Abriendo navegador en breve...
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"