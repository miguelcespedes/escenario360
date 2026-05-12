import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type AnchorPoint = {
  index: number;
  x?: number;
  y?: number;
  z?: number;
};

type Props = {
  total: number;
  activeIndex: number;
  completed: number;
  anchors?: AnchorPoint[];
};

export const ArPointStrip = ({ total, activeIndex, completed, anchors = [] }: Props) => {
  const hasWorldPoints = anchors.length === total && anchors.every(item => item.x !== undefined && item.z !== undefined);

  const minX = hasWorldPoints ? Math.min(...anchors.map(item => item.x as number)) : 0;
  const maxX = hasWorldPoints ? Math.max(...anchors.map(item => item.x as number)) : 1;
  const minZ = hasWorldPoints ? Math.min(...anchors.map(item => item.z as number)) : 0;
  const maxZ = hasWorldPoints ? Math.max(...anchors.map(item => item.z as number)) : 1;

  const normalize = (value: number, min: number, max: number) => {
    if (max - min < 0.001) {
      return 0.5;
    }
    return (value - min) / (max - min);
  };

  const points = Array.from({ length: total }, (_, i) => {
    const index = i + 1;
    const anchor = anchors.find(item => item.index === index);
    const x = hasWorldPoints && anchor?.x !== undefined ? normalize(anchor.x, minX, maxX) : i / Math.max(1, total - 1);
    const z = hasWorldPoints && anchor?.z !== undefined ? normalize(anchor.z, minZ, maxZ) : 0.5;
    return { index, x, z };
  });

  return (
    <View style={styles.row}>
      <View style={styles.baseLine} />
      {points.map(point => {
        const isDone = point.index <= completed;
        const isActive = point.index === activeIndex;
        const left = `${point.x * 100}%`;
        const topOffset = (point.z - 0.5) * 22;
        return (
          <View key={point.index} style={[styles.itemWrap, { left, transform: [{ translateX: -10 }, { translateY: topOffset }] }]}> 
            <View
              style={[
                styles.dot,
                isDone && styles.done,
                isActive && styles.active,
              ]}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{String(point.index).padStart(2, '0')}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    top: '50%',
    left: 28,
    right: 28,
    marginTop: -6,
    zIndex: 9,
    height: 30,
  },
  baseLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 13,
    height: 2,
    backgroundColor: 'rgba(138, 180, 224, 0.6)',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: 'rgba(234, 242, 255, 0.25)',
    borderWidth: 2,
    borderColor: colors.line,
  },
  itemWrap: {
    position: 'absolute',
    width: 20,
    alignItems: 'center',
  },
  label: {
    marginTop: 2,
    fontSize: 8,
    color: '#9AB0C8',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#FFD4D4',
  },
  active: {
    width: 16,
    height: 16,
    borderRadius: 9,
    backgroundColor: '#FF7E7E',
    borderColor: '#FFD4D4',
  },
  done: {
    backgroundColor: colors.ok,
    borderColor: '#C9FFE8',
  },
});
