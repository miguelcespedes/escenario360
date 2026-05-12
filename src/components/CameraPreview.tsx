import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

import { colors } from '../theme/colors';

type Props = {
  hasPermission: boolean;
  cameraRef?: React.RefObject<Camera | null>;
  style?: StyleProp<ViewStyle>;
  onCameraError?: (message: string) => void;
};

export const CameraPreview = ({ hasPermission, cameraRef, style, onCameraError }: Props) => {
  const devices = useCameraDevices();
  const backDevice = devices.find(item => item.position === 'back');
  const frontDevice = devices.find(item => item.position === 'front');
  const fallbackDevice = __DEV__ ? devices[0] : undefined;
  const device = backDevice ?? frontDevice ?? fallbackDevice;

  if (!hasPermission) {
    return (
      <View style={[styles.base, styles.placeholder, style]}>
        <Text style={styles.placeholderText}>Permiso de camara pendiente</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.base, styles.placeholder, style]}>
        <Text style={styles.placeholderText}>No hay camara disponible en este dispositivo</Text>
      </View>
    );
  }

  return (
    <Camera
      ref={cameraRef}
      style={[styles.base, style]}
      device={device}
      isActive
      photo
      onError={error => {
        onCameraError?.(error.message);
      }}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    height: 420,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: colors.line,
    borderWidth: 1,
  },
  placeholderText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
