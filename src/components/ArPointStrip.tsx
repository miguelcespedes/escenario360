import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  total: number;
  activeIndex: number;
  completed: number;
};

export const ArPointStrip = ({ total, activeIndex, completed }: Props) => {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => {
        const index = i + 1;
        const isDone = index <= completed;
        const isActive = index === activeIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isDone && styles.done,
              isActive && styles.active,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(234, 242, 255, 0.35)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  active: {
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: '#FF7E7E',
  },
  done: {
    backgroundColor: colors.ok,
  },
});
