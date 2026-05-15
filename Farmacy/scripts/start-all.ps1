Param(
    [switch]$DryRun
)

# Script para levantar servicios Docker, aplicar migraciones/seed y arrancar backend/frontend en Windows
Set-StrictMode -Version Latest

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$DevCompose = Join-Path $RepoRoot 'docker-compose.dev.yml'
$BackendDir = Join-Path $RepoRoot 'backend'
$FrontendDir = Join-Path $RepoRoot 'frontend'

function Check-Command($cmd) {
    try {
        & $cmd --version > $null 2>&1
        return $true
    } catch {
        return $false
    }
}

Write-Host "Repo root: $RepoRoot"

if (-not (Check-Command 'docker')) {
    Write-Error 'Docker no está instalado o no está en PATH. Instala Docker Desktop y vuelve a intentarlo.'
    exit 1
}

Write-Host 'Iniciando servicios Docker (dev)...'
Push-Location $RepoRoot
try {
    docker compose -f $DevCompose up -d --build
} catch {
    Write-Warning 'Error al ejecutar docker compose; revisa la salida anterior.'
}
Pop-Location

# Esperar a que Postgres esté listo
$pgContainer = 'farmacy_postgres_dev'
Write-Host "Esperando a que Postgres ($pgContainer) responda..."
$max = 60
$ready = $false
for ($i=0; $i -lt $max; $i++) {
    try {
        docker exec $pgContainer pg_isready -U farmacy_user -d farmacy_db > $null 2>&1
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    } catch {
        # ignorar
    }
    Start-Sleep -Seconds 2
}
if (-not $ready) {
    Write-Warning "Postgres no respondió después de $($max*2) segundos. Revisa logs con: docker logs $pgContainer"
} else {
    Write-Host 'Postgres listo.'
}

# Ejecutar comandos de Prisma y seed
if (-not (Test-Path $BackendDir)) {
    Write-Error "No se encontró la carpeta backend en $BackendDir"
    exit 1
}

Push-Location $BackendDir
Write-Host 'Generando Prisma Client...'
npm run db:generate

Write-Host 'Aplicando esquema a la base de datos (db:push)...'
npm run db:push

Write-Host 'Ejecutando seeds...'
npm run db:seed
Pop-Location

if (-not $DryRun) {
    Write-Host 'Abriendo ventanas para backend y frontend (dev)...'
    $pwsh = (Get-Command powershell).Source
    Start-Process -FilePath $pwsh -ArgumentList "-NoExit","-Command","Set-Location '$BackendDir'; npm run dev"
    Start-Process -FilePath $pwsh -ArgumentList "-NoExit","-Command","Set-Location '$FrontendDir'; npm run dev"
} else {
    Write-Host 'DryRun: no se iniciaron procesos en desarrollo.'
}

Write-Host "`nListo. Endpoints:`n  Frontend: http://localhost:5173/`n  Backend:  http://localhost:3000/api/v1`n  pgAdmin:  http://localhost:5050  (admin@farmacy.co / admin)`n"
