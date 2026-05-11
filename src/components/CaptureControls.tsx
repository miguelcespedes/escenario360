import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  onCapture: () => void;
  onReset: () => void;
  onExport: () => void;
  disabled?: boolean;
};

const Btn = ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
  <Pressable disabled={disabled} onPress={onPress} style={[styles.btn, disabled && styles.disabled]}>
    <Text style={styles.btnText}>{label}</Text>
  </Pressable>
);

export const CaptureControls = ({ onCapture, onReset, onExport, disabled }: Props) => (
  <View style={styles.wrap}>
    <Btn label="Capturar panel" onPress={onCapture} disabled={disabled} />
    <View style={styles.row}>
      <Btn label="Reiniciar" onPress={onReset} />
      <Btn label="Exportar manifest" onPress={onExport} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.active,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  btnText: { color: colors.text, fontWeight: '700' },
});
