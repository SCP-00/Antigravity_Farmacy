@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
cd /d "%~dp0"

:: ── Detectar PowerShell y delegar ────────────────────────
:: Si estamos en PowerShell, ejecuta run.ps1 directamente.
:: Si estamos en CMD clásico, muestra instrucciones.

:: Verificar si hay powershell.exe disponible
where powershell >nul 2>&1
if %ERRORLEVEL% equ 0 (
    :: Ejecutar run.ps1 desde PowerShell
    powershell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dpn0.ps1'"
    exit /b %ERRORLEVEL%
)

:: ── CMD clásico (sin PowerShell) ─────────────────────────
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     FARMACY — Inicio de Aplicacion           ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  Este script requiere PowerShell 5.1+ para funcionar.
echo.
echo  Instrucciones:
echo    1. Abre PowerShell como Administrador
echo    2. Navega a la carpeta del proyecto:
echo       cd /d "%~dp0"
echo    3. Ejecuta:
echo       .\run.ps1
echo.
echo  O simplemente escribe "powershell" y luego ".\run.ps1"
echo.
pause
exit /b 1

endlocal