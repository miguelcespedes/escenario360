import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = { isLevel: boolean };

type AlignmentStatus = 'fuera' | 'cerca' | 'alineado';

type ExtendedProps = Props & {
  alignmentStatus?: AlignmentStatus;
  targetOffsetX?: number;
  targetOffsetY?: number;
  showTarget?: boolean;
};

export const LevelHud = ({
  isLevel,
  alignmentStatus = 'fuera',
  targetOffsetX = 0,
  targetOffsetY = 0,
  showTarget = true,
}: ExtendedProps) => {
  const reticleColor =
    alignmentStatus === 'alineado' ? colors.ok : alignmentStatus === 'cerca' ? '#EAC45A' : '#EAF2FF';
  const targetColor =
    alignmentStatus === 'alineado' ? colors.ok : alignmentStatus === 'cerca' ? '#EAC45A' : '#FF7E7E';

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.equatorLine} />
      <View style={[styles.reticleOuter, { borderColor: reticleColor }]}>
        <View style={styles.reticleInner} />
      </View>
      {showTarget ? (
        <View
          style={[
            styles.targetOuter,
            {
              borderColor: targetColor,
              transform: [{ translateX: targetOffsetX }, { translateY: targetOffsetY }],
            },
          ]}
        >
          <View style={[styles.targetInner, { backgroundColor: targetColor }]} />
        </View>
      ) : null}
      <View style={styles.tipWrap}>
        <Text style={[styles.label, { color: isLevel ? colors.ok : colors.warn }]}> 
          {isLevel ? 'Mantén el celular recto.' : 'Nivela el telefono.'}
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
  targetOuter: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 20, 35, 0.25)',
  },
  targetInner: {
    width: 8,
    height: 8,
    borderRadius: 5,
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
