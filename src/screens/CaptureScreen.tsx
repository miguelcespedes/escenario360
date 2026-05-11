import React, { useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, View } from 'react-native';
import { Icon, Text as PaperText } from 'react-native-paper';
import { Camera } from 'react-native-vision-camera';

import { CameraPreview } from '../components/CameraPreview';
import { CaptureControls } from '../components/CaptureControls';
import { LevelHud } from '../components/LevelHud';
import { PanelCarousel } from '../components/PanelCarousel';
import { PhotoPreviewModal } from '../components/PhotoPreviewModal';
import { useCaptureStore } from '../capture/captureStore';
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
  const capture = useCaptureStore();
  const orientation = useDeviceOrientation();

  React.useEffect(() => {
    requestCameraAndStoragePermissions().then(setHasPermission);
  }, []);

  const handleCapture = async () => {
    if (!hasPermission || capture.currentPanel > capture.totalPanels) {
      return;
    }

    try {
      const photo = await cameraRef.current?.takePhoto({ qualityPrioritization: 'quality' });
      if (!photo?.path) {
        return;
      }

      const panelNo = capture.currentPanel;
      const saved = await savePanelImage(photo.path, panelNo);
      const plan = capture.plan[panelNo - 1];
      capture.registerShot(
        {
          index: panelNo,
          filename: saved.filename,
          panel: panelNo,
          band: 'equator',
          plannedYaw: plan.plannedYaw,
          plannedPitch: plan.plannedPitch,
          capturedYaw: orientation.yaw,
          capturedPitch: orientation.pitch,
          capturedRoll: orientation.roll,
          capturedAt: new Date().toISOString(),
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
  const guidance = isComplete
    ? 'Captura completa.'
    : orientation.isLevel
      ? capture.statusText
      : 'Celular inclinado.';

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
          <CameraPreview hasPermission={hasPermission} cameraRef={cameraRef} style={styles.camera} />
          <View style={styles.hudLayer}>
            <LevelHud isLevel={orientation.isLevel} />
            <AppSurface style={styles.topOverlay}>
              <View style={styles.subtitleRow}>
                <Icon source="panorama-horizontal" size={14} color="#9AB0C8" />
                <PaperText style={styles.subtitle}>Captura panoramica</PaperText>
              </View>
              <PaperText style={styles.status}>{`Panel ${String(capture.currentPanel).padStart(2, '0')} de ${String(capture.totalPanels).padStart(2, '0')}`}</PaperText>
            </AppSurface>
            <AppSurface style={styles.bottomOverlay}>
              <Icon
                source={isComplete ? 'check-circle' : orientation.isLevel ? 'camera' : 'alert-circle-outline'}
                size={14}
                color={isComplete ? '#5BD3A3' : '#EAF2FF'}
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
          onCapture={handleCapture}
          panelLabel={`${completedPanels}/${capture.totalPanels} capturadas`}
          disabled={!hasPermission}
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
