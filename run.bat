@echo off
title Farmacy - Starting Application
cd /d "%~dp0"

if not exist "backend\.env" (
  echo [0/3] backend/.env not found, copying root .env...
  if exist ".env" (
    copy /Y ".env" "backend\.env" >nul
  ) else (
    echo Root .env not found. Create it from .env.example first.
  )
)

echo [1/3] Starting Docker containers...
docker compose -f docker-compose.dev.yml up -d

echo [2/3] Starting Backend Server (Port 3000)...
start "Farmacy Backend" cmd /k "cd /d "%~dp0backend" && pnpm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Store (Port 5173)...
start "Farmacy Frontend" cmd /k "cd /d "%~dp0frontend" && pnpm run dev"

echo Opening browser...
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
