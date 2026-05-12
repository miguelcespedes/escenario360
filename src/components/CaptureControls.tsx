import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AppButton } from '../ui/AppButton';

type Props = {
  onCapture: () => void;
  onSetAnchor?: () => void;
  panelLabel: string;
  disabled?: boolean;
  anchorReady?: boolean;
};

export const CaptureControls = ({ onCapture, onSetAnchor, panelLabel, disabled, anchorReady }: Props) => (
  <View style={styles.wrap}>
    <Text style={styles.info}>{panelLabel}</Text>
    {!anchorReady && onSetAnchor ? (
      <AppButton label="Fijar punto base" icon="crosshairs-gps" onPress={onSetAnchor} />
    ) : null}
    <AppButton label="Capturar panel" icon="camera-iris" onPress={onCapture} disabled={disabled} />
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  info: {
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 0.2,
    opacity: 0.8,
  },
});
