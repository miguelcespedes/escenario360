import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

import { colors } from '../theme/colors';

type Props = { hasPermission: boolean; cameraRef?: React.RefObject<Camera | null> };

export const CameraPreview = ({ hasPermission, cameraRef }: Props) => {
  const device = useCameraDevice('back');

  if (!hasPermission || !device) {
    return (
      <View style={[styles.base, styles.placeholder]}>
        <Text style={styles.placeholderText}>Permiso de camara pendiente</Text>
      </View>
    );
  }

  return <Camera ref={cameraRef} style={styles.base} device={device} isActive photo />;
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    height: 300,
    borderRadius: 14,
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
  },
});
