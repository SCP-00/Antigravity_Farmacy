@echo off
REM Atajo para ejecutar el script PowerShell que automatiza el arranque
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-all.ps1" %*
