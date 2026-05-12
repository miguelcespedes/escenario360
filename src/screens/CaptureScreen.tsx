import React, { useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, View } from 'react-native';
import { Icon, Text as PaperText } from 'react-native-paper';
import { Camera } from 'react-native-vision-camera';

import { CameraPreview } from '../components/CameraPreview';
import { CaptureControls } from '../components/CaptureControls';
import { LevelHud } from '../components/LevelHud';
import { ArPointStrip } from '../components/ArPointStrip';
import { PanelCarousel } from '../components/PanelCarousel';
import { PhotoPreviewModal } from '../components/PhotoPreviewModal';
import { buildGuidance, estimateOverlapFromStep } from '../capture/guidance';
import { useCaptureStore } from '../capture/captureStore';
import {
  advanceArAnchor,
  createArEquatorAnchors,
  getArAnchors,
  getArStatus,
  isArModuleAvailable,
  setArAnchorMode,
  startArSession,
  stopArSession,
  subscribeArStatus,
  type ArGuidanceStatus,
  type ArAnchorPoint,
} from '../ar/arGuidanceBridge';
import { saveManifestFile, savePanelImage } from '../utils/fileSystem';
import { requestCameraAndStoragePermissions } from '../utils/permissions';
import { useDeviceOrientation } from '../sensors/useDeviceOrientation';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppHeader } from '../ui/AppHeader';
import { AppSurface } from '../ui/AppSurface';

export const CaptureScreen = () => {
  const cameraRef = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [arStatus, setArStatus] = useState<'idle' | 'ready' | 'active' | 'unavailable'>('idle');
  const [arGuidanceStatus, setArGuidanceStatus] = useState<ArGuidanceStatus | null>(null);
  const [arAnchors, setArAnchors] = useState<ArAnchorPoint[]>([]);
  const capture = useCaptureStore();
  const orientation = useDeviceOrientation();
  const fallbackTarget = capture.getTargetForPanel(capture.currentPanel);
  const target =
    arStatus === 'active' &&
    arGuidanceStatus?.targetYaw !== undefined &&
    arGuidanceStatus?.targetPitch !== undefined
      ? {
          plannedYaw: arGuidanceStatus.targetYaw,
          plannedPitch: arGuidanceStatus.targetPitch,
          plannedRoll: capture.rollAnchor ?? 0,
        }
      : fallbackTarget;
  const guidanceState = buildGuidance(orientation, target, capture.currentPanel === 1);
  const enforceGuidance = orientation.source === 'sensor';
  const scanStage: 'idle' | 'scan_floor' | 'scan_walls' | 'ready' | 'tracking_lost' =
    capture.anchorReady && orientation.source !== 'sensor'
      ? 'tracking_lost'
      : !capture.anchorReady
        ? 'idle'
        : arGuidanceStatus?.sessionQuality === 'ready'
          ? 'ready'
          : arGuidanceStatus?.floorDetected && !arGuidanceStatus?.wallsDetected
            ? 'scan_walls'
            : arGuidanceStatus?.sessionQuality === 'scanning'
              ? 'scan_floor'
              : 'scan_floor';

  React.useEffect(() => {
    requestCameraAndStoragePermissions().then(setHasPermission);
  }, []);

  React.useEffect(() => {
    setArStatus(isArModuleAvailable() ? 'ready' : 'unavailable');
    const subscription = subscribeArStatus(status => {
      setArGuidanceStatus(status);
    });
    getArStatus().then(setArGuidanceStatus).catch(() => {});
    return () => {
      subscription.remove();
      stopArSession().catch(() => {});
    };
  }, []);

  const handleCapture = async () => {
    if (!hasPermission || capture.currentPanel > capture.totalPanels) {
      return;
    }

    if (!capture.anchorReady) {
      capture.setStatusText('Primero fija el punto base.');
      return;
    }

    if (scanStage === 'tracking_lost') {
      capture.setStatusText('Tracking perdido. Reescanea suelo y paredes.');
      return;
    }

    if (enforceGuidance && !guidanceState.isCaptureAllowed) {
      capture.setStatusText(guidanceState.message);
      return;
    }

    try {
      const photo = await cameraRef.current?.takePhoto({ qualityPrioritization: 'quality' });
      if (!photo?.path) {
        return;
      }

      const panelNo = capture.currentPanel;
      const saved = await savePanelImage(photo.path, panelNo);
      const panelTarget = capture.getTargetForPanel(panelNo);
      const previousShot = capture.shots[capture.shots.length - 1];
      const stepDeltaYaw = previousShot ? orientation.yaw - previousShot.capturedYaw : 0;
      const overlapEstimate = previousShot ? estimateOverlapFromStep(stepDeltaYaw) : 0.35;
      capture.registerShot(
        {
          index: panelNo,
          filename: saved.filename,
          panel: panelNo,
          band: 'equator',
          plannedYaw: panelTarget.plannedYaw,
          plannedPitch: panelTarget.plannedPitch,
          capturedYaw: orientation.yaw,
          capturedPitch: orientation.pitch,
          capturedRoll: orientation.roll,
          capturedAt: new Date().toISOString(),
          target: {
            expectedYaw: panelTarget.plannedYaw,
            expectedPitch: panelTarget.plannedPitch,
            expectedRoll: panelTarget.plannedRoll,
          },
          quality: {
            alignmentStatus: guidanceState.isCaptureAllowed ? 'accepted' : 'warning',
            overlapEstimate,
            verticalDeviation: Number(Math.abs(guidanceState.deltas.pitch).toFixed(2)),
            rollDeviation: Number(Math.abs(guidanceState.deltas.roll).toFixed(2)),
            yawDeviation: Number(Math.abs(guidanceState.deltas.yaw).toFixed(2)),
          },
        },
        saved.path,
      );

      if (arStatus === 'active') {
        advanceArAnchor().catch(() => {});
      }
    } catch {
      capture.setStatusText('Celular inclinado.');
    }
  };

  const handleExport = async () => {
    const manifestPath = await saveManifestFile(JSON.stringify(capture.manifest, null, 2));
    Alert.alert('Exportar manifest', `Manifest guardado en ${manifestPath}`);
    setMenuVisible(false);
  };

  const handleSetAnchor = () => {
    if (orientation.source !== 'sensor') {
      capture.setStatusText('Sensor no disponible para fijar punto base.');
      return;
    }
    startArSession()
      .then(started => {
        if (!started) {
          setArStatus('unavailable');
          capture.setStatusText('ARCore no disponible. Este modo requiere AR real.');
          return;
        }
        capture.setStatusText('Inicia escaneo AR: suelo primero, luego paredes.');
        return setArAnchorMode('world').then(() =>
          createArEquatorAnchors(
            capture.totalPanels,
            orientation.yaw,
            orientation.pitch,
          ).then(created => {
            if (!created) {
              capture.setStatusText('No se pudieron crear anchors AR reales. Reintenta escaneo.');
            } else {
              getArAnchors().then(setArAnchors).catch(() => {});
              setArStatus('active');
              capture.setAnchorFromOrientation(orientation.yaw, orientation.pitch, orientation.roll);
            }
          }),
        );
      })
      .catch(() => {
        capture.setStatusText('Fallo AR. Reintenta inicializar ARCore.');
      });
  };

  const handleOpenPanel = (panel: { panel: number; thumbnailUri?: string }) => {
    setViewerOpen(true);
    setViewerIndex(Math.max(0, panel.panel - 1));
  };

  const handleHelp = () => {
    setMenuVisible(false);
    Alert.alert('Ayuda', 'Mantén el celular recto y gira lentamente entre cada panel.');
  };

  const handleDebug = () => {
    setMenuVisible(false);
    Alert.alert('Debug', `Capturas: ${capture.shots.length}/${capture.totalPanels}`);
  };

  const handleAbout = () => {
    setMenuVisible(false);
    Alert.alert('Stage360', 'Herramienta de captura panoramica guiada v0.1.0');
  };

  const photos = capture.panels.map(panel => ({
    panel: panel.panel,
    uri: panel.thumbnailUri,
    filename: panel.filename,
    capturedAt: capture.shots.find(shot => shot.panel === panel.panel)?.capturedAt,
  }));

  const isComplete = capture.shots.length === capture.totalPanels;
  const completedPanels = capture.shots.length;
  const highlightedPanel = completedPanels > 0 ? completedPanels : capture.currentPanel;
  const guidance = cameraError
    ? `Error de camara: ${cameraError}`
    : isComplete
      ? 'Captura completa.'
      : !capture.anchorReady
        ? 'Fija un punto base mirando al centro de inicio.'
      : scanStage === 'scan_floor'
        ? 'Escaneo: apunta al suelo y mueve el telefono lentamente.'
      : scanStage === 'scan_walls'
        ? 'Escaneo: apunta a paredes para cerrar el escenario.'
      : scanStage === 'tracking_lost'
        ? 'Tracking perdido. Vuelve a escanear paredes.'
      : enforceGuidance
        ? guidanceState.message
        : `${capture.statusText} (guia basica)`;

  const subtitleRight =
    arStatus === 'active'
      ? `AR ${arGuidanceStatus?.anchorMode || 'synthetic'} ${arGuidanceStatus?.activeAnchorIndex || capture.currentPanel}/${arAnchors.length || arGuidanceStatus?.totalAnchors || capture.totalPanels}`
      : arStatus === 'ready'
        ? 'AR listo'
        : arStatus === 'unavailable'
          ? 'AR no disponible'
          : 'AR inicializando';

  const arHint =
    arStatus === 'active' && arGuidanceStatus?.anchorMode === 'synthetic'
      ? arGuidanceStatus.modeReason || 'World anchors aun no activos.'
      : null;

  const arTargetHint =
    arStatus === 'active' &&
    arGuidanceStatus?.targetX !== undefined &&
    arGuidanceStatus?.targetY !== undefined &&
    arGuidanceStatus?.targetZ !== undefined
      ? `Target XYZ: ${arGuidanceStatus.targetX.toFixed(2)}, ${arGuidanceStatus.targetY.toFixed(2)}, ${arGuidanceStatus.targetZ.toFixed(2)}`
      : null;

  const scanProgress =
    scanStage === 'idle'
      ? 0
      : scanStage === 'scan_floor'
        ? 33
        : scanStage === 'scan_walls'
          ? 66
          : scanStage === 'ready'
            ? 100
            : 50;

  const statusIcon = isComplete
    ? 'check-circle'
    : guidanceState.status === 'alineado'
      ? 'check-circle-outline'
      : guidanceState.status === 'cerca'
        ? 'target'
        : 'alert-circle-outline';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <AppHeader
          menuVisible={menuVisible}
          setMenuVisible={setMenuVisible}
          onReset={() => {
            capture.resetCapture();
            setMenuVisible(false);
          }}
          onExport={handleExport}
          onHelp={handleHelp}
          onDebug={handleDebug}
          onAbout={handleAbout}
        />

        <View style={styles.cameraWrap}>
          <CameraPreview
            hasPermission={hasPermission}
            cameraRef={cameraRef}
            style={styles.camera}
            onCameraError={message => setCameraError(message)}
          />
          <View style={styles.hudLayer}>
            <LevelHud
              isLevel={orientation.isLevel}
              alignmentStatus={guidanceState.status}
              showTarget={false}
            />
            <ArPointStrip
              total={capture.totalPanels}
              activeIndex={arGuidanceStatus?.activeAnchorIndex || capture.currentPanel}
              completed={capture.shots.length}
              anchors={arAnchors}
            />
            <AppSurface style={styles.topOverlay}>
              <View style={styles.subtitleRow}>
                <Icon source="panorama-horizontal" size={14} color="#9AB0C8" />
                <PaperText style={styles.subtitle}>Captura panoramica</PaperText>
              </View>
              <PaperText style={styles.status}>{`Panel ${String(capture.currentPanel).padStart(2, '0')} de ${String(capture.totalPanels).padStart(2, '0')}`}</PaperText>
              <PaperText style={styles.statusHint}>{subtitleRight}</PaperText>
              <View style={styles.scanProgressWrap}>
                <View style={[styles.scanProgressFill, { width: `${scanProgress}%` }]} />
              </View>
              {arTargetHint ? <PaperText style={styles.statusHintDim}>{arTargetHint}</PaperText> : null}
              {arHint ? <PaperText style={styles.statusHintWarn}>{arHint}</PaperText> : null}
            </AppSurface>
            <AppSurface style={styles.bottomOverlay}>
              <Icon
                source={statusIcon}
                size={14}
                color={isComplete || guidanceState.status === 'alineado' ? '#5BD3A3' : '#EAF2FF'}
              />
              <PaperText style={styles.bottomText}>{guidance}</PaperText>
            </AppSurface>
          </View>
        </View>

        <PanelCarousel
          panels={capture.panels}
          currentPanel={capture.currentPanel}
          highlightedPanel={highlightedPanel}
          onPressItem={handleOpenPanel}
        />

        <CaptureControls
          onSetAnchor={handleSetAnchor}
          onCapture={handleCapture}
          panelLabel={`${completedPanels}/${capture.totalPanels} capturadas`}
          anchorReady={capture.anchorReady}
          disabled={
            !hasPermission ||
            !capture.anchorReady ||
            scanStage === 'scan_floor' ||
            scanStage === 'scan_walls' ||
            scanStage === 'tracking_lost' ||
            (enforceGuidance && !guidanceState.isCaptureAllowed)
          }
        />

        <PhotoPreviewModal
          visible={viewerOpen}
          photos={photos}
          initialIndex={viewerIndex}
          onClose={() => {
            setViewerOpen(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  wrap: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  cameraWrap: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.black,
    minHeight: 420,
  },
  camera: {
    width: '100%',
    height: '100%',
    minHeight: 420,
  },
  hudLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  topOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.overlay,
  },
  subtitle: {
    color: '#9AB0C8',
    fontWeight: '600',
    fontSize: 12,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  status: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 2,
  },
  statusHint: {
    color: '#9AB0C8',
    fontSize: 11,
    marginTop: 2,
  },
  statusHintWarn: {
    color: '#EAC45A',
    fontSize: 10,
    marginTop: 2,
  },
  statusHintDim: {
    color: '#6F87A4',
    fontSize: 10,
    marginTop: 2,
  },
  scanProgressWrap: {
    marginTop: 6,
    width: '100%',
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  scanProgressFill: {
    height: '100%',
    backgroundColor: '#5BD3A3',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.overlay,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
