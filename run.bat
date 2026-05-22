@echo off
title Farmacy - Starting Application
echo [1/3] Starting Docker containers...
cd /d "%~dp0"
docker compose -f docker-compose.dev.yml up -d

echo [2/3] Starting Backend Server (Port 3000)...
start "Farmacy Backend" cmd /k "cd /d "%~dp0backend" && pnpm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Store (Port 5173)...
start "Farmacy Frontend" cmd /k "cd /d "%~dp0frontend" && pnpm run dev"

echo Opening browser...
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"