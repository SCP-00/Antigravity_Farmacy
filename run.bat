@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

title Farmacy - Starting Application
echo FARMACY - Launcher (Powered by pnpm)
echo ------------------------------------

echo [1/3] Iniciando contenedores de Docker...
cd /d "%~dp0"
docker compose -f docker-compose.dev.yml up -d

echo [2/3] Levantando Servidor Backend (Puerto 3000)...
start "Farmacy Backend" cmd /k "cd /d "%~dp0backend" && pnpm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] Levantando Tienda Frontend (Puerto 5173)...
start "Farmacy Frontend" cmd /k "cd /d "%~dp0frontend" && pnpm run dev"

echo Abriendo en el navegador...
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

echo ¡Listo! Cierra esta ventana. Los procesos corren en ventanas separadas.
pause >nul