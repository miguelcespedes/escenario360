import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AppButton } from '../ui/AppButton';

type Props = {
  onCapture: () => void;
  panelLabel: string;
  disabled?: boolean;
};

export const CaptureControls = ({ onCapture, panelLabel, disabled }: Props) => (
  <View style={styles.wrap}>
    <Text style={styles.info}>{panelLabel}</Text>
    <AppButton label="Capturar panel" onPress={onCapture} disabled={disabled} />
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
