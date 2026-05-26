<#
.SYNOPSIS
  FARMACY — Inicio de Aplicación (PowerShell)
.DESCRIPTION
  Script principal para iniciar el entorno de desarrollo de Farmacy.
  - Verifica Node.js, pnpm y Docker
  - Levanta PostgreSQL + Redis con docker compose
  - Inicia backend (Express :3000) y frontend (Vite :5173)
  - Healthcheck automático hasta que el backend responda
  - Abre el navegador en la app

.NOTES
  Ejecutar desde PowerShell:  .\run.ps1
  O doble clic en run.bat (detecta PowerShell y ejecuta este script).
#>

#requires -Version 5.1

# ══════════════════════════════════════════════════════════
# CONFIGURACIÓN
# ══════════════════════════════════════════════════════════

# Cambia a $true si ejecutas en SSH/WSL/Codespaces (sin GUI)
$HEADLESS = $false

# Duración máxima del healthcheck (segundos)
$HEALTHCHECK_TIMEOUT = 60
# Intervalo entre intentos del healthcheck (segundos)
$HEALTHCHECK_INTERVAL = 2

# Ruta raíz del proyecto
$ROOT = $PSScriptRoot
if (-not $ROOT) { $ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path }
Set-Location $ROOT

# ══════════════════════════════════════════════════════════
# FUNCIONES AUXILIARES
# ══════════════════════════════════════════════════════════

function Write-Step {
    param(
        [int]$Num,
        [int]$Total,
        [string]$Message
    )
    Write-Host " " -NoNewline
    Write-Host "[$Num/$Total]" -ForegroundColor Cyan -NoNewline
    Write-Host " $Message"
}

function Write-StepLabel {
    param([string]$Label, [string]$Message)
    Write-Host " " -NoNewline
    Write-Host "[$Label]" -ForegroundColor DarkGray -NoNewline
    Write-Host " $Message"
}

function Write-OK {
    param([string]$Message)
    Write-Host "   ✔ " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Skip {
    param([string]$Message)
    Write-Host "   ⚡ " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Write-Warn {
    param([string]$Message)
    Write-Host "   ⚠ " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Write-Err {
    param([string]$Message)
    Write-Host "   ✖ " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║     FARMACY — Inicio de Aplicacion           ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Test-CommandAvailable {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Get-ProcessOnPort {
    param([int]$Port)
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($conn) {
            return $conn.OwningProcess
        }
    } catch {
        # No admin rights or other issue
    }
    return $null
}

function Stop-ProcessOnPort {
    param([int]$Port)
    $pids = Get-ProcessOnPort -Port $Port
    if ($pids) {
        foreach ($pid in $pids) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "     Matado PID $pid en puerto $Port"
            } catch {
                # Process may already be dead
            }
        }
    }
}

function Start-HealthcheckLoop {
    $maxAttempts = [math]::Floor($HEALTHCHECK_TIMEOUT / $HEALTHCHECK_INTERVAL)
    $attempt = 0
    Write-Host "   Esperando a que el backend responda en http://localhost:3000/api/v1/health ..."

    while ($attempt -lt $maxAttempts) {
        $attempt++
        Start-Sleep -Seconds $HEALTHCHECK_INTERVAL

        try {
            $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/health' `
                -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-OK "Backend respondiendo en http://localhost:3000"
                return $true
            }
        } catch {
            # Still starting, try again
        }

        if ($attempt % 5 -eq 0) {
            Write-Host "   ...intento $attempt de $maxAttempts" -ForegroundColor DarkGray
        }
    }

    return $false
}

# ══════════════════════════════════════════════════════════
# MANEJO DE CIERRE (Ctrl+C)
# ══════════════════════════════════════════════════════════

$script:BackendPID = $null
$script:FrontendPID = $null

function Cleanup {
    Write-Host ""
    Write-Host "  Cerrando servidores..." -ForegroundColor Yellow
    if ($script:BackendPID) {
        try { Stop-Process -Id $script:BackendPID -Force -ErrorAction SilentlyContinue } catch {}
        Write-Host "   ✖ Backend detenido"
    }
    if ($script:FrontendPID) {
        try { Stop-Process -Id $script:FrontendPID -Force -ErrorAction SilentlyContinue } catch {}
        Write-Host "   ✖ Frontend detenido"
    }
    Write-Host "  Procesos limpiados." -ForegroundColor Green
}

# Registrar el cleanup para Ctrl+C (redundante con try/finally, pero captura algunos casos)
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    # En caso de que Cleanup ya no esté en scope, matar procesos directamente
    if ($script:BackendPID) { try { Stop-Process -Id $script:BackendPID -Force -ErrorAction SilentlyContinue } catch {} }
    if ($script:FrontendPID) { try { Stop-Process -Id $script:FrontendPID -Force -ErrorAction SilentlyContinue } catch {} }
}

# ══════════════════════════════════════════════════════════
# EJECUCIÓN PRINCIPAL
# ══════════════════════════════════════════════════════════

try {
    Write-Banner

    # ── [1/8] Verificar Node.js ────────────────────────────
    Write-Step 1 8 "Verificando Node.js..."
    if (-not (Test-CommandAvailable "node")) {
        Write-Err "Node.js no esta instalado."
        Write-Host "   Descargalo en: https://nodejs.org (version LTS)"
        Write-Host ""
        pause
        exit 1
    }
    $nodeVer = node --version
    Write-OK "Node.js detectado: $nodeVer"

    # ── [2/8] Verificar / Instalar pnpm ────────────────────
    Write-Step 2 8 "Verificando pnpm..."
    if (-not (Test-CommandAvailable "pnpm")) {
        Write-Warn "pnpm no encontrado. Instalando con npm..."
        try {
            npm install -g pnpm
            if ($LASTEXITCODE -ne 0) { throw "npm install -g pnpm falló" }
            Write-OK "pnpm instalado globalmente"
        } catch {
            Write-Err "No se pudo instalar pnpm. Instalalo manualmente: npm install -g pnpm"
            pause
            exit 1
        }
    }
    $pnpmVer = pnpm --version
    Write-OK "pnpm detectado: v$pnpmVer"

    # ── [3/8] Verificar Docker ─────────────────────────────
    Write-Step 3 8 "Verificando Docker..."
    if (-not (Test-CommandAvailable "docker")) {
        Write-Err "Docker no esta instalado o no esta en el PATH."
        Write-Host "   Instala Docker Desktop: https://www.docker.com/products/docker-desktop"
        pause
        exit 1
    }
    try {
        $dockerInfo = docker info --format '{{.OSType}}' 2>$null
        if (-not $dockerInfo) { throw "Docker daemon no responde" }
        Write-OK "Docker detectado y funcionando"
    } catch {
        Write-Err "Docker esta instalado pero no esta corriendo."
        Write-Host "   Abre Docker Desktop y espera a que este listo."
        pause
        exit 1
    }

    # ── [4/8] Limpiar procesos en puertos ──────────────────
    Write-Step 4 8 "Limpiando procesos en puertos 3000 y 5173..."
    Stop-ProcessOnPort -Port 3000
    Stop-ProcessOnPort -Port 5173
    Write-OK "Puertos liberados"

    # ── [5/8] Verificar .env ───────────────────────────────
    Write-Step 5 8 "Verificando archivo .env..."
    $envPath = Join-Path $ROOT ".env"
    $envExamplePath = Join-Path $ROOT ".env.example"

    if (-not (Test-Path $envPath)) {
        if (Test-Path $envExamplePath) {
            Write-Warn ".env no existe. Creando desde .env.example..."
            Copy-Item $envExamplePath $envPath
            Write-OK ".env creado desde .env.example"
            Write-Host ""
            Write-Host "  ⚠ [AVISO] Se creo .env desde .env.example." -ForegroundColor Yellow
            Write-Host "  Revisa y ajusta los valores antes de continuar." -ForegroundColor Yellow
            Write-Host "  (especialmente JWT_SECRET, JWT_CLIENTE_SECRET, etc.)" -ForegroundColor Yellow
            Write-Host ""
            pause
        } else {
            Write-Err "No se encuentra .env ni .env.example"
            pause
            exit 1
        }
    } else {
        Write-OK ".env encontrado"
    }

    # ── [6/8] Instalar dependencias si faltan ──────────────
    Write-Step 6 8 "Verificando dependencias..."
    $rootModules = Join-Path $ROOT "node_modules"
    $backendModules = Join-Path $ROOT "backend" "node_modules"
    $frontendModules = Join-Path $ROOT "frontend" "node_modules"

    # En pnpm workspaces, si existe node_modules raíz, las dependencias
    # de backend/frontend están resueltas por el monorepo.
    if (-not (Test-Path $rootModules)) {
        Write-Skip "node_modules no encontrado. Instalando dependencias..."
        try {
            Push-Location $ROOT
            pnpm install
            if ($LASTEXITCODE -ne 0) { throw "pnpm install falló" }
            Write-OK "Dependencias instaladas"
        } catch {
            Write-Err "Fallo pnpm install: $_"
            pause
            exit 1
        } finally {
            Pop-Location
        }
    } else {
        Write-OK "Dependencias listas"
    }

    # ── Generar Prisma Client ─────────────────────────────
    Write-StepLabel "6a" "Generando Prisma Client..."
    try {
        Push-Location (Join-Path $ROOT "backend")
        $prismaSchema = Join-Path $ROOT "database" "prisma" "schema.prisma"
        npx prisma generate --schema=$prismaSchema 2>&1 | Out-Null
        if (-not $?) { throw "prisma generate falló" }
        Write-OK "Prisma Client generado"
    } catch {
        Write-Err "Fallo prisma generate: $_"
        Write-Warn "Puedes ejecutarlo manualmente: cd backend && pnpm run db:generate"
    } finally {
        Pop-Location
    }

    # ── [7/8] Levantar Docker (PostgreSQL + Redis) ─────────
    Write-Step 7 8 "Levantando contenedores Docker..."
    $composeFile = Join-Path $ROOT "docker-compose.dev.yml"
    try {
        Push-Location $ROOT
        docker compose -f $composeFile up -d
        if ($LASTEXITCODE -ne 0) { throw "docker compose falló" }
        Write-OK "Contenedores iniciados"
    } catch {
        Write-Err "Fallo al levantar contenedores Docker: $_"
        pause
        exit 1
    } finally {
        Pop-Location
    }

    # ── [8/8] Iniciar servidores ───────────────────────────
    Write-Step 8 8 "Iniciando servidores..."
    Write-Host ""

    # Configurar variables de entorno para los procesos hijos
    $backendDir = Join-Path $ROOT "backend"
    $frontendDir = Join-Path $ROOT "frontend"

    if ($HEADLESS) {
        # Modo headless: procesos ocultos, logs a archivos
        $backendLog = Join-Path $ROOT "backend.log"
        $frontendLog = Join-Path $ROOT "frontend.log"
        $backendJob = Start-Job -ScriptBlock {
            param($dir) Set-Location $dir; pnpm run dev
        } -ArgumentList $backendDir
        $frontendJob = Start-Job -ScriptBlock {
            param($dir) Set-Location $dir; pnpm run dev
        } -ArgumentList $frontendDir
        $script:BackendPID = $backendJob.Id
        $script:FrontendPID = $frontendJob.Id
        Write-OK "  [Headless] Backend Job ID: $($backendJob.Id)  (log: backend.log)"
        Write-OK "  [Headless] Frontend Job ID: $($frontendJob.Id) (log: frontend.log)"
    } else {
        # Modo normal: ventanas separadas
        # Intentar con pwsh.exe primero, fallback a powershell.exe
        $shellExe = "powershell.exe"
        if (Get-Command "pwsh.exe" -ErrorAction SilentlyContinue) {
            $shellExe = "pwsh.exe"
        }

        $backendProcess = Start-Process -FilePath $shellExe `
            -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; pnpm run dev" `
            -WindowStyle Normal -PassThru
        $script:BackendPID = $backendProcess.Id

        $frontendProcess = Start-Process -FilePath $shellExe `
            -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; pnpm run dev" `
            -WindowStyle Normal -PassThru
        $script:FrontendPID = $frontendProcess.Id

        Write-Host "   Backend  → PID: $($backendProcess.Id)" -ForegroundColor Green
        Write-Host "   Frontend → PID: $($frontendProcess.Id)" -ForegroundColor Green
        Write-Host "   (Shell: $shellExe)" -ForegroundColor DarkGray
    }

    # ── Healthcheck ─────────────────────────────────────────
    Write-Host ""
    Write-StepLabel "--" "Verificando salud del backend..."
    $healthOK = Start-HealthcheckLoop

    if (-not $healthOK) {
        Write-Err "El backend no respondio despues de $HEALTHCHECK_TIMEOUT segundos."
        Write-Host "   Verifica que no haya errores en la ventana del backend."
        Write-Host "   Timeout configurable en `$HEALTHCHECK_TIMEOUT en run.ps1"
        Write-Host ""
        pause
        exit 1
    }

    # ── Abrir navegador ────────────────────────────────────
    Write-StepLabel "--" "Abriendo navegador..."
    Start-Sleep -Seconds 1
    try {
        Start-Process "http://localhost:5173"
        Write-OK "Navegador abierto en http://localhost:5173"
    } catch {
        Write-Warn "No se pudo abrir el navegador automaticamente"
        Write-Host "   Abrelo manualmente: http://localhost:5173"
    }

    # ── Éxito ──────────────────────────────────────────────
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║  Farmacy iniciado correctamente!             ║" -ForegroundColor Cyan
    Write-Host "  ║                                              ║" -ForegroundColor Cyan
    Write-Host "  ║  Frontend: http://localhost:5173              ║" -ForegroundColor Green
    Write-Host "  ║  Backend:  http://localhost:3000/api/v1      ║" -ForegroundColor Green
    Write-Host "  ║  pgAdmin:  http://localhost:5050              ║" -ForegroundColor Green
    Write-Host "  ║                                              ║" -ForegroundColor Cyan
    Write-Host "  ║  Presiona Ctrl+C en esta ventana             ║" -ForegroundColor Yellow
    Write-Host "  ║  para detener todo limpiamente.              ║" -ForegroundColor Yellow
    Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    # Mantener la ventana abierta (no headless)
    if (-not $HEADLESS) {
        Write-Host "  Esta ventana muestra logs del proceso principal."
        Write-Host "  Puedes cerrarla con Ctrl+C cuando termines."
        Write-Host ""

        # Esperar a que el usuario presione Ctrl+C o las ventanas se cierren
        while ($true) {
            Start-Sleep -Seconds 5
            $backendAlive = Get-Process -Id $script:BackendPID -ErrorAction SilentlyContinue
            $frontendAlive = Get-Process -Id $script:FrontendPID -ErrorAction SilentlyContinue
            if (-not $backendAlive -and -not $frontendAlive) {
                Write-Host "  Ambos servidores se detuvieron. Saliendo..." -ForegroundColor Yellow
                break
            }
            if (-not $backendAlive) {
                Write-Host "  Backend detenido. Frontend sigue corriendo..." -ForegroundColor Yellow
            }
            if (-not $frontendAlive) {
                Write-Host "  Frontend detenido. Backend sigue corriendo..." -ForegroundColor Yellow
            }
        }
    }

} catch {
    Write-Host ""
    Write-Err "Error inesperado: $_"
    Write-Host ""
    pause
    exit 1

} finally {
    Cleanup
}
