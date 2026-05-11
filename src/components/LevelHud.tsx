import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = { isLevel: boolean };

export const LevelHud = ({ isLevel }: Props) => {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.equatorLine} />
      <View style={styles.reticle} />
      <Text style={[styles.label, { color: isLevel ? colors.ok : colors.warn }]}>
        {isLevel ? 'Mantén el celular recto.' : 'Celular inclinado.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equatorLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 2,
    backgroundColor: colors.active,
    opacity: 0.8,
  },
  reticle: {
    width: 28,
    height: 28,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: 'transparent',
  },
  label: {
    position: 'absolute',
    bottom: 14,
    fontSize: 12,
    fontWeight: '600',
  },
});
