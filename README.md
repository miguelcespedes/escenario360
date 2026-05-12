# Stage360

Stage360 es una app React Native para Android orientada a captura panoramica guiada por paneles.

## Vision del producto

La app no busca tomar fotos sueltas. El objetivo es guiar al usuario para capturar una secuencia ordenada de imagenes con continuidad visual, suficiente solape y estabilidad angular, para stitching en backend.

Flujo esperado:

1. Iniciar sesion de captura.
2. Capturar foto ancla (panel 01).
3. Guiar cada siguiente captura con referencia espacial (giro, altura y nivelacion).
4. Aceptar solo capturas dentro de tolerancia minima.
5. Guardar secuencia y metadatos para backend.

## Estado actual (v0.1.0)

Disponible hoy:

- Pantalla principal con preview de camara.
- HUD visual basico (linea/reticulo/estado).
- Carrusel de 12 paneles con miniaturas.
- Visor ampliado por panel.
- Guardado local de imagenes y `manifest.json`.
- Pipeline release Android en GitHub Actions.

Limitaciones actuales:

- No hay stitching local.
- No hay backend de subida/procesamiento.
- La guia de captura aun no valida tolerancias estrictas por panel.

## Alcance funcional

Si hace:

- Secuencia de 12 paneles horizontales (`01..12`).
- Orden de captura y almacenamiento por indice.
- Export de manifest para consumo posterior.

No hace:

- iOS/Xcode/IPA/TestFlight.
- VR/WebXR/ARKit/ARCore/LiDAR.
- Grilla multi-altura en esta primera etapa.

## Plan concreto de trabajo

### Fase 1 - Guiado minimo util (prioridad alta)

Objetivo: dejar de capturar "a ojo" y bloquear capturas claramente desalineadas.

Entregables:

- Lectura de orientacion real (`yaw/pitch/roll`) en tiempo real.
- Calculo de error respecto al panel objetivo actual.
- Estados de alineacion: `fuera`, `cerca`, `alineado`.
- Mensajes accionables: derecha/izquierda/sube/baja/nivela.
- Regla de aceptacion minima para permitir captura.

Criterio de exito:

- El usuario recibe instrucciones claras antes de capturar.
- No se acepta una foto muy fuera de tolerancia.

### Fase 2 - Calidad de secuencia (prioridad alta)

Objetivo: mejorar continuidad para stitching.

Entregables:

- Control de avance horizontal por panel (sin saltos bruscos).
- Estimacion simple de solape con el panel anterior.
- Advertencias de calidad antes de aceptar captura.

Criterio de exito:

- La secuencia mantiene mejor continuidad lateral.
- Baja el riesgo de pares de imagenes no cosibles.

### Fase 3 - Metadatos de calidad (prioridad media)

Objetivo: enviar contexto util al backend para diagnostico y scoring.

Entregables por foto:

- `sessionId`, `photoIndex`, `timestamp`
- orientacion capturada y orientacion objetivo
- desviacion vertical y angular
- `alignmentStatus`, `overlapEstimate`
- estado de aceptacion/advertencia

Criterio de exito:

- Backend puede auditar calidad de captura por panel.

### Fase 4 - Evolucion guiada (prioridad futura)

Objetivo: extender sin romper V1.

Entregables potenciales:

- Modo multi-banda (alturas multiples).
- Mejores ayudas visuales (target frame dinamico).
- Reglas adaptativas por dispositivo.

## Intentos experimentales de UX guiada

Esta seccion documenta los enfoques probados (o preparados) para llegar a una experiencia de captura realmente asistida.

### Bitacora de hipotesis

| ID | Hipotesis | Implementacion | Resultado observado | Decision | Estado |
| --- | --- | --- | --- | --- | --- |
| H1 | Mensajes de texto bastan para orientar la siguiente toma. | Estado textual con instrucciones cortas (`derecha/izquierda/sube/baja/nivela`). | Sirve para diagnostico tecnico, pero el usuario sigue adivinando el punto exacto. | No usar como UX principal; mantener solo como apoyo. | Descartada |
| H2 | Bloquear captura fuera de tolerancia mejora la secuencia aun sin objetivo visual. | Estados `fuera/cerca/alineado` + habilitacion de captura por tolerancia. | Reduce capturas malas, pero obliga a "buscar" donde apuntar. | Mantener como capa de calidad; no suficiente por si sola. | Parcial |
| H3 | Usar la primera foto como ancla estabiliza el recorrido entre paneles. | `yawAnchor` en panel 1 + objetivos por panel desde ancla + `plannedYaw`. | Secuencia mas consistente para backend; existe riesgo de drift por sensor. | Mantener como base del flujo guiado V1. | Validada |
| H4 | Sin telemetria real de orientacion no hay guiado fiable. | Bridge nativo Android + evento `stage360_orientation` + hook RN. | Habilita guiado/gating real con `source='sensor'`; aparece jitter en algunos dispositivos. | Mantener y robustecer con suavizado/calibracion incremental. | Validada |
| H5 | Un punto flotante calculado con deltas angulares (`yaw/pitch`) da referencia espacial suficiente para la siguiente toma. | Proyeccion 2D en HUD con ancla de sesion y desplazamiento del objetivo en pantalla. | En uso real el punto sugerido queda lejos del lugar correcto; al mover el telefono en profundidad/altura la referencia no se mantiene estable para composicion humana. Genera friccion y exige precision incomoda con brazos/mano. | Descartar este modo como UX principal. No continuar calibrando este enfoque. | Descartada |
| H6 | El flujo debe iniciar preguntando un punto fijo base y construir 12 referencias ecuatoriales estables para la sesion. | Paso explicito "Fijar punto base" + ancla inicial (`yaw/pitch/roll`) + 12 puntos secuenciales de guia para captura ordenada. | Reduce ambiguedad operativa: el usuario define intencion espacial antes de capturar y luego sigue una ruta fija de paneles. | Adoptar como flujo principal V1 mientras se evalua ARCore world-anchors completo. | Activa |
| H7 | Para puntos realmente fijos e independientes de la direccion de camara se requieren anchors AR en mundo (ARCore), no solo orientacion inercial. | Refactor en progreso: desacoplar guia actual de HUD flotante y preparar modo `ar-guided` con ancla explicita y secuencia de 12 objetivos. | Confirmado en pruebas de campo: el modelo 2D flotante no representa bien el espacio fisico y resulta incomodo para usuarios. | Migrar a implementacion ARCore con world-anchors como plan principal. | Activa |
| H8 | La migracion a ARCore debe hacerse por capas para no frenar producto. | Primero bridge y estados AR (`ready/active/unavailable`), luego world-anchors reales y render persistente. | Permite avanzar sin bloquear captura actual y mantiene trazabilidad de evolucion tecnica. | Mantener estrategia incremental: bridge -> anchors -> render -> gating AR estricto. | Activa |
| H9 | Conviene desacoplar proveedor de anchors para cambiar de synthetic a ARCore sin romper contratos JS/UI. | Se introdujo `ArWorldAnchorProvider` con `SyntheticAnchorProvider` como implementacion inicial y contrato estable de `targetX/Y/Z`. | Reduce riesgo de refactor grande: la UI y bridge ya consumen el mismo esquema mientras el provider ARCore real se desarrolla. | Continuar con implementacion `ArCoreAnchorProvider` sobre el mismo contrato. | Activa |
| H10 | Activar modo `world` debe depender de disponibilidad real de ARCore y no romper fallback. | Se agrego `ArCoreAnchorProvider` y conmutacion en `setAnchorMode('world')`; si ARCore no existe, vuelve a `synthetic` con motivo explicito. | La app ahora decide modo de forma determinista y mantiene contrato de estado sin romper UI. | Mantener; siguiente paso es sustituir generacion sintetica por poses ARCore reales. | Activa |

### Decision de producto actual

- El flujo debe comenzar con confirmacion explicita de punto base (ancla de sesion).
- La ruta de captura se modela como 12 referencias ecuatoriales secuenciales.
- El modo de punto flotante libre queda descartado como enfoque principal.
- El objetivo tecnico es mover la guia principal a `ar-guided` con anchors en mundo (ARCore).

## Proximo experimento (inmediato)

Objetivo:

- Definir una guia centrada en continuidad visual entre imagen anterior y vista actual.

Regla visual:

- Mostrar referencia de la captura anterior como ayuda de encuadre (no punto absoluto).
- Guiar avance lateral y mantener altura/horizonte con tolerancias simples.
- Mantener mensajes cortos y estado de aceptacion.

Criterio de exito:

- El usuario compone sin "pelear" contra un target inestable.
- La secuencia mejora continuidad para stitching con menor friccion operativa.

## Ejecutar en Android local

Instalar dependencias:

```bash
npm install
```

### Emulador

1. Inicia emulador:

```bash
npm run emulator:lite
```

2. Inicia Metro (puerto fijo 8081):

```bash
npm run start:emulator
```

3. Despliega en emulador:

```bash
npm run android:emulator
```

### Telefono Android fisico

1. Activa `Developer options` + `USB debugging`.
2. Verifica dispositivo:

```bash
adb devices
```

3. Inicia Metro:

```bash
npm start
```

4. Despliega al dispositivo deseado:

```bash
npx react-native run-android --device <SERIAL> --port 8081
```

## Build release Android

Compilar release local:

```bash
npm run build:android:release
```

Instalar release desde artifact/cache:

```bash
npm run install:android:release
```

Atajos:

```bash
npm run install:android:release:local
npm run install:android:release:fresh
```

## CI de Android

Workflow: `.github/workflows/android-build.yml`

Pipeline:

- `npm ci`
- `./gradlew assembleRelease`
- versionado desde `package.json`
- copia final a `output/stage360-v<version>-release.apk`
- artifact: `stage360-release-apk`

Rutas de APK:

- Intermedia: `android/app/build/outputs/apk/release/app-release.apk`
- Final: `output/stage360-v<version>-release.apk`

## Branding

Assets en `assets/brand/`:

- `stage360-logo.svg`
- `stage360-symbol.svg`
- `stage360-wordmark.svg`
- `stage360-logo-dark.png`
- `stage360-logo-light.png`

Launcher Android en `android/app/src/main/res/mipmap-*/`.

## Backlog backend/stitching

- Endpoint de subida por sesion.
- Ingesta de `manifest.json` + paneles.
- Pipeline de stitching server-side.
- Reglas de calidad (solape, blur, exposicion, continuidad).
