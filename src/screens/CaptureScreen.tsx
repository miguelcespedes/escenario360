import React, { useRef, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Camera } from 'react-native-vision-camera';

import { CameraPreview } from '../components/CameraPreview';
import { CaptureControls } from '../components/CaptureControls';
import { LevelHud } from '../components/LevelHud';
import { PanelStrip } from '../components/PanelStrip';
import { StatusCard } from '../components/StatusCard';
import { useCaptureStore } from '../capture/captureStore';
import { saveManifestFile, savePanelImage } from '../utils/fileSystem';
import { requestCameraAndStoragePermissions } from '../utils/permissions';
import { useDeviceOrientation } from '../sensors/useDeviceOrientation';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export const CaptureScreen = () => {
  const cameraRef = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState(false);
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
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <StatusCard
          panel={capture.currentPanel}
          total={capture.totalPanels}
          statusText={capture.statusText}
        />

        <View>
          <CameraPreview hasPermission={hasPermission} cameraRef={cameraRef} />
          <View style={styles.hudLayer}>
            <LevelHud isLevel={orientation.isLevel} />
          </View>
        </View>

        <PanelStrip panels={capture.panels} currentPanel={capture.currentPanel} />

        <CaptureControls
          onCapture={handleCapture}
          onReset={capture.resetCapture}
          onExport={handleExport}
          disabled={!hasPermission}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  wrap: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  hudLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
