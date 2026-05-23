@echo off
title Farmacy - Starting Application
cd /d "%~dp0"

echo [1/4] Limpiando procesos huerfanos en los puertos 3000 y 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1

if not exist "backend\.env" (
  echo [2/4] backend/.env not found, copying root .env...
  if exist ".env" (
    copy /Y ".env" "backend\.env" >nul
  ) else (
    echo Root .env not found. Create it from .env.example first.
  )
)

echo [3/4] Levantando contenedores Docker (PostgreSQL y Redis)...
docker compose -f docker-compose.dev.yml up -d

echo [4/4] Iniciando Servidores...
start "Farmacy Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak >nul
start "Farmacy Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Abriendo navegador en breve...
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
