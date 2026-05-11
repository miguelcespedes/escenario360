param(
  [switch]$ForceDownload,
  [switch]$InstallOnly
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot '.env'
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

$outputDir = Join-Path $projectRoot 'output'
$tempRoot = Join-Path $env:TEMP 'stage360-artifact'
$zipPath = Join-Path $tempRoot 'artifact.zip'
$extractPath = Join-Path $tempRoot 'unzipped'
$repo = 'miguelcespedes/escenario360'
$artifactName = 'stage360-release-apk'

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

$packageJsonPath = Join-Path $projectRoot 'package.json'
$packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
$version = $packageJson.version
$apkFileName = "stage360-v$version-release.apk"
$localApkPath = Join-Path $outputDir $apkFileName

function Resolve-AdbPath {
  $adbCommand = Get-Command adb -ErrorAction SilentlyContinue
  if ($adbCommand) { return $adbCommand.Source }

  $wingetAdb = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe'
  if (Test-Path -LiteralPath $wingetAdb) { return $wingetAdb }

  throw "No se encontro adb. Instala Android platform-tools o reinicia tu terminal para refrescar PATH."
}

function Invoke-WebRequestWithRetry {
  param(
    [string]$Uri,
    [hashtable]$Headers,
    [string]$OutFile,
    [int]$Attempts = 3,
    [int]$TimeoutSec = 120
  )

  for ($i = 1; $i -le $Attempts; $i++) {
    try {
      Invoke-WebRequest -Uri $Uri -Headers $Headers -OutFile $OutFile -TimeoutSec $TimeoutSec
      return
    } catch {
      if ($i -eq $Attempts) { throw }
      Write-Host "Descarga fallida (intento $i/$Attempts). Reintentando en 5s..."
      Start-Sleep -Seconds 5
    }
  }
}

function Install-Apk {
  param(
    [string]$AdbPath,
    [string]$ApkPath
  )

  $adbOutput = & $AdbPath devices -l
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
    throw "No se pudo detectar un deviceId valido desde 'adb devices'."
  }

  Write-Host "Validando conexion ADB con dispositivo: $deviceId"
  & $AdbPath -s $deviceId shell echo ok | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'No se pudo validar la sesion adb shell.'
  }

  Write-Host "Instalando APK release: $ApkPath"
  $installOutput = & $AdbPath -s $deviceId install -r "$ApkPath" 2>&1
  $installText = ($installOutput | Out-String)

  if ($LASTEXITCODE -ne 0 -and $installText -match 'INSTALL_FAILED_USER_RESTRICTED') {
    Write-Host 'El telefono bloqueo la instalacion por politica de usuario.'
    Write-Host 'Desbloquea el telefono y acepta cualquier aviso de instalacion por USB.'
    Write-Host 'Reintentando una vez en 8 segundos...'
    Start-Sleep -Seconds 8

    $installOutput = & $AdbPath -s $deviceId install -r "$ApkPath" 2>&1
    $installText = ($installOutput | Out-String)
  }

  if ($LASTEXITCODE -ne 0) {
    Write-Host $installText
    if ($installText -match 'INSTALL_FAILED_USER_RESTRICTED') {
      Write-Host "El APK ya quedo en output/$apkFileName. Corrige permisos en el telefono y reintenta con npm run install:android:release:local."
    }
    throw 'Fallo la instalacion por ADB.'
  }
}

$adb = Resolve-AdbPath

if ($InstallOnly) {
  if (-not (Test-Path -LiteralPath $localApkPath)) {
    throw "No existe output/$apkFileName. Ejecuta primero npm run install:android:release o npm run install:android:release:fresh."
  }

  Install-Apk -AdbPath $adb -ApkPath $localApkPath
  Write-Host "Instalacion local completada. APK usado: $localApkPath"
  exit 0
}

if ((Test-Path -LiteralPath $localApkPath) -and -not $ForceDownload) {
  Write-Host "Usando APK local cacheado: $localApkPath"
  Install-Apk -AdbPath $adb -ApkPath $localApkPath
  Write-Host "Instalacion completada. APK usado: $localApkPath"
  exit 0
}

$token = if ($env:GITHUB_TOKEN) { $env:GITHUB_TOKEN } elseif ($env:GH_TOKEN) { $env:GH_TOKEN } else { $null }
if (-not $token) {
  if (Test-Path -LiteralPath $localApkPath) {
    Write-Host 'No hay token GitHub. Se usara APK local cacheado.'
    Install-Apk -AdbPath $adb -ApkPath $localApkPath
    Write-Host "Instalacion completada. APK usado: $localApkPath"
    exit 0
  }
  throw 'Falta token GitHub. Define GITHUB_TOKEN o GH_TOKEN para descargar el artifact release.'
}

$headers = @{
  'User-Agent' = 'stage360-installer'
  'Authorization' = "Bearer $token"
  'Accept' = 'application/vnd.github+json'
}

if ($ForceDownload) {
  if (Test-Path -LiteralPath $extractPath) {
    Remove-Item -LiteralPath $extractPath -Recurse -Force
  }
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }
}

Write-Host 'Consultando ultimo run exitoso...'
$runsUrl = "https://api.github.com/repos/$repo/actions/runs?status=completed&per_page=20"
$runs = Invoke-RestMethod -Uri $runsUrl -Headers $headers

$run = $runs.workflow_runs |
  Where-Object { $_.name -eq 'Android Build' -and $_.conclusion -eq 'success' } |
  Select-Object -First 1

if (-not $run) {
  if (Test-Path -LiteralPath $localApkPath) {
    Write-Host 'No se encontro run exitoso. Se usara APK local cacheado.'
    Install-Apk -AdbPath $adb -ApkPath $localApkPath
    Write-Host "Instalacion completada. APK usado: $localApkPath"
    exit 0
  }
  throw "No se encontro un run exitoso de 'Android Build'."
}

Write-Host "Run encontrado: #$($run.run_number) ($($run.html_url))"
$artifacts = Invoke-RestMethod -Uri $run.artifacts_url -Headers $headers
$artifact = $artifacts.artifacts | Where-Object { $_.name -eq $artifactName -and -not $_.expired } | Select-Object -First 1

if (-not $artifact) {
  if (Test-Path -LiteralPath $localApkPath) {
    Write-Host 'No se encontro artifact release. Se usara APK local cacheado.'
    Install-Apk -AdbPath $adb -ApkPath $localApkPath
    Write-Host "Instalacion completada. APK usado: $localApkPath"
    exit 0
  }
  throw "No se encontro artifact '$artifactName'."
}

$downloadedWithGh = $false
$gh = Get-Command gh -ErrorAction SilentlyContinue
if ($gh) {
  try {
    Write-Host 'Intentando descargar artifact con gh...'
    if (Test-Path -LiteralPath $extractPath) {
      Remove-Item -LiteralPath $extractPath -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
    & $gh.Source run download $run.id -R $repo -n $artifactName -D $extractPath
    if ($LASTEXITCODE -eq 0) {
      $downloadedWithGh = $true
    }
  } catch {
    Write-Host 'gh run download fallo. Se intentara con API REST.'
  }
}

if (-not $downloadedWithGh) {
  try {
    Write-Host 'Descargando artifact con API REST...'
    Invoke-WebRequestWithRetry -Uri $artifact.archive_download_url -Headers $headers -OutFile $zipPath -Attempts 3 -TimeoutSec 120

    if (Test-Path -LiteralPath $extractPath) {
      Remove-Item -LiteralPath $extractPath -Recurse -Force
    }
    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force
  } catch {
    if (Test-Path -LiteralPath $localApkPath) {
      Write-Host 'La descarga fallo, pero existe APK local. Se instalara cache local.'
      Install-Apk -AdbPath $adb -ApkPath $localApkPath
      Write-Host "Instalacion completada. APK usado: $localApkPath"
      exit 0
    }
    throw
  }
}

$apkCandidate = Get-ChildItem -LiteralPath $extractPath -Filter '*.apk' -Recurse | Select-Object -First 1
if (-not $apkCandidate) {
  throw 'No se encontro ningun APK dentro del artifact descargado.'
}

Copy-Item -LiteralPath $apkCandidate.FullName -Destination $localApkPath -Force
Write-Host "APK release cacheado en: $localApkPath"

Install-Apk -AdbPath $adb -ApkPath $localApkPath
Write-Host "Instalacion completada. APK usado: $localApkPath"
