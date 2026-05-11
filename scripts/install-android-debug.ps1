$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env"
if (Test-Path -LiteralPath $envFile) {
  Get-Content -LiteralPath $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $parts = $_ -split '=', 2
    if ($parts.Count -eq 2) {
      $key = $parts[0].Trim()
      $value = $parts[1].Trim().Trim('"')
      if ($key -and -not (Test-Path "env:$key")) {
        Set-Item -Path "env:$key" -Value $value
      }
    }
  }
}

function Resolve-AdbPath {
  $adbCommand = Get-Command adb -ErrorAction SilentlyContinue
  if ($adbCommand) {
    return $adbCommand.Source
  }

  $wingetAdb = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"
  if (Test-Path -LiteralPath $wingetAdb) {
    return $wingetAdb
  }

  throw "No se encontro adb. Instala Android platform-tools o reinicia tu terminal para refrescar PATH."
}

$adb = Resolve-AdbPath

$repo = "miguelcespedes/escenario360"
$preferredArtifacts = @("stage360-release-apk", "stage360-debug-apk")
$tempRoot = Join-Path $env:TEMP "stage360-artifact"
$zipPath = Join-Path $tempRoot "artifact.zip"
$extractPath = Join-Path $tempRoot "unzipped"
$token = if ($env:GITHUB_TOKEN) { $env:GITHUB_TOKEN } elseif ($env:GH_TOKEN) { $env:GH_TOKEN } else { $null }

if (-not $token) {
  throw "Falta token GitHub. Define GITHUB_TOKEN o GH_TOKEN con permiso de lectura de Actions artifacts (scope 'repo' para token classic)."
}

$headers = @{
  "User-Agent" = "stage360-installer"
  "Authorization" = "Bearer $token"
  "Accept" = "application/vnd.github+json"
}

New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
if (Test-Path -LiteralPath $extractPath) {
  Remove-Item -LiteralPath $extractPath -Recurse -Force
}

Write-Host "Consultando ultimo run exitoso..."
$runsUrl = "https://api.github.com/repos/$repo/actions/runs?status=completed&per_page=20"
$runs = Invoke-RestMethod -Uri $runsUrl -Headers $headers

$run = $runs.workflow_runs |
  Where-Object { $_.name -eq "Android Build" -and $_.conclusion -eq "success" } |
  Select-Object -First 1

if (-not $run) {
  throw "No se encontro un run exitoso de 'Android Build'."
}

Write-Host "Run encontrado: #$($run.run_number) ($($run.html_url))"

$artifacts = Invoke-RestMethod -Uri $run.artifacts_url -Headers $headers
$artifact = $null
foreach ($artifactName in $preferredArtifacts) {
  $artifact = $artifacts.artifacts | Where-Object { $_.name -eq $artifactName -and -not $_.expired } | Select-Object -First 1
  if ($artifact) { break }
}

if (-not $artifact) {
  throw "No se encontro artifact release/debug en el run #$($run.run_number)."
}

Write-Host "Descargando artifact: $($artifact.name)"
Invoke-WebRequest -Uri $artifact.archive_download_url -Headers $headers -OutFile $zipPath

Write-Host "Extrayendo artifact..."
Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force

$apkPath = Join-Path $extractPath "stage360-release.apk"
if (-not (Test-Path -LiteralPath $apkPath)) {
  $apkPath = Join-Path $extractPath "stage360-debug.apk"
}
if (-not (Test-Path -LiteralPath $apkPath)) {
  $apkCandidate = Get-ChildItem -LiteralPath $extractPath -Filter "*.apk" -Recurse | Select-Object -First 1
  if ($apkCandidate) {
    $apkPath = $apkCandidate.FullName
  } else {
    throw "No se encontro ningun APK dentro del artifact descargado."
  }
}

$adbOutput = & $adb devices -l
$deviceLines = $adbOutput | Where-Object {
  $line = $_.Trim()
  $line -and -not $line.StartsWith('List of devices attached') -and $line -match '\sdevice(\s|$)'
}
if (-not $deviceLines -or $deviceLines.Count -eq 0) {
  Write-Host "Salida actual de 'adb devices':"
  $adbOutput | ForEach-Object { Write-Host $_ }
  throw "No hay dispositivo Android en estado 'device'. Verifica cable USB-C, depuracion USB y autorizacion ADB."
}

$firstDeviceLine = @($deviceLines)[0].ToString().Trim()
$parts = ($firstDeviceLine -split '\s+')
$deviceId = if ($parts.Count -gt 0) { $parts[0] } else { '' }
if (-not $deviceId) {
  Write-Host "Salida actual de 'adb devices':"
  $adbOutput | ForEach-Object { Write-Host $_ }
  throw "No se pudo detectar un deviceId valido desde 'adb devices'."
}
Write-Host "Instalando en dispositivo: $deviceId"
$installOutput = & $adb -s $deviceId install -r "$apkPath" 2>&1
$installText = ($installOutput | Out-String)

if ($LASTEXITCODE -ne 0) {
  if ($installText -match 'INSTALL_FAILED_USER_RESTRICTED') {
    Write-Host "El telefono bloqueo la instalacion por politica de usuario."
    Write-Host "Desbloquea el telefono y acepta cualquier aviso de instalacion por USB."
    Write-Host "Reintentando una vez en 8 segundos..."
    Start-Sleep -Seconds 8

    $installOutput = & $adb -s $deviceId install -r "$apkPath" 2>&1
    $installText = ($installOutput | Out-String)
  }
}

if ($LASTEXITCODE -ne 0) {
  Write-Host $installText
  throw "Fallo la instalacion por ADB."
}

Write-Host "Instalacion completada desde artifact de GitHub Actions."
Write-Host "APK usado: $apkPath"
