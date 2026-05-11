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
- crea `output/`;
- copia APK a `output/stage360-debug.apk`;
- sube artifact `stage360-debug-apk`.

## Donde queda el APK

- Ruta intermedia: `android/app/build/outputs/apk/debug/app-debug.apk`
- Ruta final esperada en workspace: `output/stage360-debug.apk`

## Descargar artifact en GitHub

1. Ve a la pestana **Actions** del repo.
2. Abre el run del workflow **Android Build**.
3. En **Artifacts**, descarga `stage360-debug-apk`.

## Instalar APK en Android

Con ADB:

```bash
adb install -r output/stage360-debug.apk
```

O copia el APK al telefono y abre el archivo para instalarlo.

## Pendientes para backend/stitching

- Endpoint de subida por sesion.
- Ingesta de `manifest.json` y paneles.
- Pipeline de stitching en servidor.
- Validaciones de calidad (solape, blur, exposicion).
