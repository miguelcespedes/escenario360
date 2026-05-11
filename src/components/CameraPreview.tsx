import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

import { colors } from '../theme/colors';

type Props = {
  hasPermission: boolean;
  cameraRef?: React.RefObject<Camera | null>;
  style?: StyleProp<ViewStyle>;
};

export const CameraPreview = ({ hasPermission, cameraRef, style }: Props) => {
  const device = useCameraDevice('back');

  if (!hasPermission || !device) {
    return (
      <View style={[styles.base, styles.placeholder, style]}>
        <Text style={styles.placeholderText}>Permiso de camara pendiente</Text>
      </View>
    );
  }

  return <Camera ref={cameraRef} style={[styles.base, style]} device={device} isActive photo />;
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
