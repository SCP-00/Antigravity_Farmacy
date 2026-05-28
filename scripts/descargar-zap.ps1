# ═══════════════════════════════════════════════════════════════════════════════
#  descargar-zap.ps1 — Descarga OWASP ZAP (Cross Platform Package)
#  para escaneo de seguridad de Farmacy API.
#
#  Uso:   .\scripts\descargar-zap.ps1 [-Destination <ruta>] [-SkipExtract]
#  Ej:    .\scripts\descargar-zap.ps1
#         .\scripts\descargar-zap.ps1 -Destination C:\tools\zap
#
#  Requisitos:
#   - Windows 10+ (tiene tar nativo + curl)
#   - Java 17+ instalado (ZAP lo requiere para ejecutarse)
#
#  Descarga:
#   Obtiene la URL automáticamente desde ZapVersions.xml (canonical source)
#   usando el nodo <core><linux><url> que apunta al .tar.gz cross-platform.
# ═══════════════════════════════════════════════════════════════════════════════

param(
  [string]$Destination = "",
  [switch]$SkipExtract
)

$ErrorActionPreference = "Stop"

# ── Colores ──────────────────────────────────────────────────────────────────
$Cyan   = [ConsoleColor]::Cyan
$Green  = [ConsoleColor]::Green
$Yellow = [ConsoleColor]::Yellow
$Red    = [ConsoleColor]::Red
$Magenta = [ConsoleColor]::Magenta

function Write-Info  { Write-Host "  ℹ️  " -ForegroundColor $Cyan -NoNewline; Write-Host " $($args)" }
function Write-OK   { Write-Host "  ✅ " -ForegroundColor $Green -NoNewline; Write-Host " $($args)" }
function Write-Warn { Write-Host "  ⚠️  " -ForegroundColor $Yellow -NoNewline; Write-Host " $($args)" }
function Write-Err  { Write-Host "  ❌ " -ForegroundColor $Red -NoNewline; Write-Host " $($args)" }

# ── Banner ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║   📥 OWASP ZAP — Descarga Automática (Cross Platform)          ║" -ForegroundColor $Cyan
Write-Host "║   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                                          ║" -ForegroundColor $Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""

# ── Determinar directorio de descarga ────────────────────────────────────────
if (-not $Destination) {
  $Destination = Join-Path $PSScriptRoot "tools"
}
Write-Info "Directorio destino: $Destination"

# Crear directorio si no existe
New-Item -ItemType Directory -Force -Path $Destination | Out-Null

# ── Obtener URL desde ZapVersions.xml ────────────────────────────────────────
Write-Host ""
Write-Host "📡 Conectando con ZapVersions.xml..." -ForegroundColor $Magenta

$versionsUrl = "https://raw.githubusercontent.com/zaproxy/zap-admin/master/ZapVersions.xml"

try {
  [xml]$zapVersions = Invoke-RestMethod -Uri $versionsUrl -UseBasicParsing -TimeoutSec 30
  $version     = $zapVersions.ZAP.core.version
  $downloadUrl = $zapVersions.ZAP.core.linux.url
  $fileName    = $zapVersions.ZAP.core.linux.file
  $fileHash    = $zapVersions.ZAP.core.linux.hash
  $fileSize    = $zapVersions.ZAP.core.linux.size

  if (-not $downloadUrl -or $downloadUrl -eq "") {
    throw "No se pudo extraer la URL de descarga desde ZapVersions.xml"
  }

  Write-OK "Versión estable: ZAP $version"
  Write-Info "Archivo: $fileName ($([math]::Round($fileSize / 1MB, 1)) MB)"
  Write-Info "Hash: $fileHash"
  Write-Info "URL: $downloadUrl"

} catch {
  Write-Err "Error al obtener ZapVersions.xml: $($_.Exception.Message)"
  Write-Host ""
  Write-Warn "Usando URL de respaldo (versión 2.17.0)..."
  $version     = "2.17.0"
  $downloadUrl = "https://github.com/zaproxy/zaproxy/releases/download/v2.17.0/ZAP_2.17.0_Linux.tar.gz"
  $fileName    = "ZAP_2.17.0_Linux.tar.gz"
  Write-Info "URL respaldo: $downloadUrl"
}

# ── Descargar ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "⬇️  Descargando OWASP ZAP $version..." -ForegroundColor $Magenta

$tarPath = Join-Path $Destination $fileName

try {
  $progressParams = @{
    Uri             = $downloadUrl
    OutFile         = $tarPath
    UseBasicParsing = $true
    TimeoutSec      = 600  # 10 minutos para ~245MB
  }

  # Mostrar barra de progreso
  Write-Host "  (puede tomar varios minutos según la velocidad de descarga)" -ForegroundColor $Yellow
  Invoke-WebRequest @progressParams

  # Verificar que se descargó
  if (-not (Test-Path $tarPath)) {
    throw "El archivo no se descargó correctamente"
  }

  $actualSize = (Get-Item $tarPath).Length
  Write-OK "Descarga completa: $([math]::Round($actualSize / 1MB, 1)) MB"

} catch {
  Write-Err "Error durante la descarga: $($_.Exception.Message)"
  exit 1
}

# ── Verificar hash SHA-256 ───────────────────────────────────────────────────
Write-Host ""
Write-Host "🔐 Verificando integridad..." -ForegroundColor $Magenta

if ($fileHash -and $fileHash -match "SHA-256:([a-f0-9]{64})") {
  $expectedHash = $Matches[1].ToLower()
  $actualHash   = (Get-FileHash -Path $tarPath -Algorithm SHA256).Hash.ToLower()

  if ($actualHash -eq $expectedHash) {
    Write-OK "Hash SHA-256 verificado correctamente"
  } else {
    Write-Warn "Hash no coincide!"
    Write-Warn "  Esperado: $expectedHash"
    Write-Warn "  Obtenido: $actualHash"
    Write-Warn "  El archivo puede estar corrupto o ser de una fuente diferente."
  }
} else {
  Write-Warn "No se pudo verificar el hash (formato inesperado: $fileHash)"
}

# ── Extraer ──────────────────────────────────────────────────────────────────
if (-not $SkipExtract) {
  Write-Host ""
  Write-Host "📦 Extrayendo..." -ForegroundColor $Magenta

  $extractPath = Join-Path $Destination "ZAP"

  try {
    # Windows 10+ tiene tar nativo en el PATH
    $tarResult = tar -xzf $tarPath -C $Destination 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "tar falló con código $LASTEXITCODE`: $tarResult"
    }

    # La carpeta extraída suele llamarse ZAP_2.17.0/ — renombrar a ZAP/
    $extractedDirs = Get-ChildItem -Path $Destination -Directory | Where-Object Name -like "ZAP_*"
    foreach ($dir in $extractedDirs) {
      $targetPath = Join-Path $Destination "ZAP"
      if (Test-Path $targetPath) {
        Remove-Item -Path $targetPath -Recurse -Force
      }
      Rename-Item -Path $dir.FullName -NewName "ZAP" -Force
      Write-OK "Extraído: $($dir.Name) → ZAP/"
    }

    # Verificar que existe zap.bat
    $zapBat = Join-Path $extractPath "zap.bat"
    if (Test-Path $zapBat) {
      Write-OK "zap.bat encontrado en: $extractPath"
    } else {
      Write-Warn "No se encontró zap.bat en $extractPath"
      Write-Warn "  Buscando ejecutables disponibles..."
      Get-ChildItem -Path $extractPath -Recurse -Include *.bat,*.sh,*.exe -ErrorAction SilentlyContinue |
        ForEach-Object { Write-Warn "  → $($_.FullName)" }
    }

  } catch {
    Write-Err "Error al extraer: $($_.Exception.Message)"
    Write-Host ""
    Write-Warn "Puedes extraer manualmente el archivo:"
    Write-Warn "  tar -xzf $tarPath -C $Destination"
    exit 1
  }

} else {
  Write-Info "Extracción omitida (-SkipExtract activo)"
  $extractPath = $Destination
}

# ── Verificar Java ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "☕  Verificando Java..." -ForegroundColor $Magenta

try {
  $javaVersion = & java -version 2>&1
  if ($LASTEXITCODE -eq 0) {
    $javaLine = ($javaVersion | Select-String "version" | Select-Object -First 1).ToString()
    Write-OK "Java detectado: $javaLine"
  } else {
    Write-Warn "Java no disponible o no responde correctamente"
    Write-Warn "OWASP ZAP requiere Java 17+ — descarga desde: https://adoptium.net/"
  }
} catch {
  Write-Warn "Java no encontrado en el PATH"
  Write-Warn "OWASP ZAP requiere Java 17+ — descarga desde: https://adoptium.net/"
}

# ── Resumen final ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "║   📥 DESCARGA COMPLETADA                                       ║" -ForegroundColor $Green
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Green
Write-Host ""
Write-OK "OWASP ZAP $version descargado en:"
Write-OK "  $Destination"
Write-Host ""

# ── Próximos pasos ──────────────────────────────────────────────────────────
Write-Host "🚀 Próximos pasos:" -ForegroundColor $Cyan
Write-Host ""

# Comando para daemon
Write-Host "  1. Iniciar ZAP en modo daemon (escucha en puerto 8080):" -ForegroundColor $Yellow
$daemonCmd = "& `"$extractPath\zap.bat`" -daemon -port 8080"
Write-Host "     $daemonCmd" -ForegroundColor White
Write-Host "     (abre una terminal separada — ZAP tarda ~15s en iniciar)" -ForegroundColor DarkGray
Write-Host ""

# Comando para scan rápido
Write-Host "  2. Escanear la API de Farmacy:" -ForegroundColor $Yellow
$scanCmd = "& `"$extractPath\zap.bat`" -cmd -quickurl http://localhost:3000/api/v1/ -newsession session -port 8080"
Write-Host "     $scanCmd" -ForegroundColor White
Write-Host "     (ejecuta el escaneo y muestra resumen en terminal)" -ForegroundColor DarkGray
Write-Host ""

# Comando para scan desde Python
Write-Host "  3. Escaneo completo con reporte HTML (usando Python):" -ForegroundColor $Yellow
$apiScanCmd = "& `"$extractPath\zap.bat`" -daemon -port 8080 -config api.key=12345"
Write-Host "     # 1) Iniciar daemon:" -ForegroundColor DarkGray
Write-Host "     $apiScanCmd"
Write-Host "     # 2) Usar ZAP API (http://localhost:8080) para lanzar spider + active scan" -ForegroundColor DarkGray
Write-Host "     # 3) Reporte: http://localhost:8080/JSON/reports/action/generate/" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  📖 Documentación ZAP API: https://www.zaproxy.org/docs/api/" -ForegroundColor $Cyan
Write-Host ""

# Verificar si está todo listo
if (Test-Path $extractPath) {
  Write-OK "¡Todo listo! OWASP ZAP $version está disponible en: $extractPath"
}

exit 0
