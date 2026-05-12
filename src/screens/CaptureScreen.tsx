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
import { createArEquatorAnchors, isArModuleAvailable, startArSession, stopArSession } from '../ar/arGuidanceBridge';
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
  const capture = useCaptureStore();
  const orientation = useDeviceOrientation();
  const target = capture.getTargetForPanel(capture.currentPanel);
  const guidanceState = buildGuidance(orientation, target, capture.currentPanel === 1);
  const enforceGuidance = orientation.source === 'sensor';

  React.useEffect(() => {
    requestCameraAndStoragePermissions().then(setHasPermission);
  }, []);

  React.useEffect(() => {
    setArStatus(isArModuleAvailable() ? 'ready' : 'unavailable');
    return () => {
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
          capture.setStatusText('AR no disponible. Se usara guia de orientacion.');
          capture.setAnchorFromOrientation(orientation.yaw, orientation.pitch, orientation.roll);
          return;
        }
        return createArEquatorAnchors(capture.totalPanels).then(created => {
          if (!created) {
            capture.setStatusText('No se pudieron crear puntos AR. Se usa ancla de orientacion.');
          } else {
            setArStatus('active');
            capture.setStatusText('Puntos AR inicializados. Sigue el punto 01.');
          }
          capture.setAnchorFromOrientation(orientation.yaw, orientation.pitch, orientation.roll);
        });
      })
      .catch(() => {
        capture.setStatusText('Fallo AR. Se usa ancla de orientacion.');
        capture.setAnchorFromOrientation(orientation.yaw, orientation.pitch, orientation.roll);
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
      : enforceGuidance
        ? guidanceState.message
        : `${capture.statusText} (guia basica)`;

  const subtitleRight =
    arStatus === 'active'
      ? 'AR activo'
      : arStatus === 'ready'
        ? 'AR listo'
        : arStatus === 'unavailable'
          ? 'AR no disponible'
          : 'AR inicializando';

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
              activeIndex={capture.currentPanel}
              completed={capture.shots.length}
            />
            <AppSurface style={styles.topOverlay}>
              <View style={styles.subtitleRow}>
                <Icon source="panorama-horizontal" size={14} color="#9AB0C8" />
                <PaperText style={styles.subtitle}>Captura panoramica</PaperText>
              </View>
              <PaperText style={styles.status}>{`Panel ${String(capture.currentPanel).padStart(2, '0')} de ${String(capture.totalPanels).padStart(2, '0')}`}</PaperText>
              <PaperText style={styles.statusHint}>{subtitleRight}</PaperText>
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
