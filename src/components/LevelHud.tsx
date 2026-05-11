import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = { isLevel: boolean };

export const LevelHud = ({ isLevel }: Props) => {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.equatorLine} />
      <View style={styles.reticleOuter}>
        <View style={styles.reticleInner} />
      </View>
      <View style={styles.tipWrap}>
        <Text style={[styles.label, { color: isLevel ? colors.ok : colors.warn }]}>
          {isLevel ? 'Mantén el celular recto.' : 'Celular inclinado.'}
        </Text>
      </View>
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
    left: 22,
    right: 22,
    height: 2,
    backgroundColor: colors.active,
    opacity: 0.7,
  },
  reticleOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(234, 242, 255, 0.84)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleInner: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: colors.text,
  },
  tipWrap: {
    position: 'absolute',
    bottom: 14,
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
