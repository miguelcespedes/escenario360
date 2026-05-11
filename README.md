# Stage360

Stage360 es una app React Native (Android) para captura panoramica guiada por paneles.

## Objetivo

Capturar 12 fotos horizontales desde un mismo punto fisico, guardar originales locales y generar `manifest.json` para stitching en backend.

## Alcance v0.1.0

- Pantalla principal con camara en vivo y HUD de nivelacion.
- Tira fija de 12 slots (`01` a `12`) con progreso estable.
- Botones: `Capturar panel`, `Reiniciar`, `Exportar manifest`.
- Guardado local de paneles y manifest.
- Workflow GitHub Actions para compilar APK Android debug.

## Que NO hace v0.1.0

- No stitching local.
- No backend.
- No iOS, Xcode, IPA ni TestFlight.
- No VR/WebXR/ARKit/ARCore/LiDAR.

## Ejecutar en Android local

1. Instala dependencias:

```bash
npm install
```

2. Inicia Metro:

```bash
npm start
```

3. En otra terminal, ejecuta Android:

```bash
npm run android
```

## Build Android por script

```bash
npm run build:android:debug
```

## GitHub Actions

Workflow: `.github/workflows/android-build.yml`

Hace lo siguiente:

- corre en `ubuntu-latest`;
- instala Node.js LTS y JDK 17;
- instala dependencias (`npm ci`);
- compila APK debug (`cd android && ./gradlew assembleDebug`);
- compila APK release (`cd android && ./gradlew assembleRelease`);
- crea `output/`;
- copia APK a `output/stage360-debug.apk`;
- copia APK a `output/stage360-release.apk`;
- sube artifacts `stage360-debug-apk` y `stage360-release-apk`.

## Donde queda el APK

- Ruta intermedia: `android/app/build/outputs/apk/debug/app-debug.apk`
- Ruta final esperada en workspace: `output/stage360-debug.apk`
- Ruta release intermedia: `android/app/build/outputs/apk/release/app-release.apk`
- Ruta release final: `output/stage360-release.apk`

## Descargar artifact en GitHub

1. Ve a la pestana **Actions** del repo.
2. Abre el run del workflow **Android Build**.
3. En **Artifacts**, descarga `stage360-debug-apk`.
4. Para APK autonomo (sin Metro), descarga `stage360-release-apk`.

## Instalar APK en Android

Con ADB:

```bash
adb install -r output/stage360-debug.apk
```

O copia el APK al telefono y abre el archivo para instalarlo.

## Instalar directo desde artifact (sin compilar local)

Con celular conectado por USB-C y depuracion USB activa:

```bash
npm run install:android:debug
```

Este script:

- consulta el ultimo run exitoso de `Android Build`;
- prioriza `stage360-release-apk` y usa `stage360-debug-apk` como fallback;
- extrae `stage360-release.apk` o `stage360-debug.apk`;
- instala con `adb install -r` en el dispositivo conectado.

Nota: GitHub exige autenticacion para descargar `archive_download_url` de artifacts. Usa `GITHUB_TOKEN` (o `GH_TOKEN`) con permiso de lectura del repositorio.

Puedes guardarlo en `.env`:

```env
GITHUB_TOKEN=tu_token
```

## Pendientes para backend/stitching

- Endpoint de subida por sesion.
- Ingesta de `manifest.json` y paneles.
- Pipeline de stitching en servidor.
- Validaciones de calidad (solape, blur, exposicion).
