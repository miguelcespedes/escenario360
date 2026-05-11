import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  panel: number;
  total: number;
  statusText: string;
};

export const StatusCard = ({ panel, total, statusText }: Props) => {
  return (
    <View style={styles.card}>
      <Text style={styles.brand}>Stage360</Text>
      <Text style={styles.title}>Captura panoramica</Text>
      <Text style={styles.body}>{`Panel ${String(panel).padStart(2, '0')} de ${String(total).padStart(2, '0')}`}</Text>
      <Text style={styles.body}>Gira lentamente.</Text>
      <Text style={styles.body}>{statusText}</Text>
      <Text style={styles.version}>v0.1.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  brand: { color: colors.text, fontSize: 18, fontWeight: '700' },
  title: { color: colors.muted, fontWeight: '600' },
  body: { color: colors.text },
  version: { color: colors.muted, marginTop: 4, fontSize: 12 },
});
