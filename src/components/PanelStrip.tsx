import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Panel = { panel: number; thumbnailUri?: string };

type Props = {
  panels: Panel[];
  currentPanel: number;
};

export const PanelStrip = ({ panels, currentPanel }: Props) => {
  return (
    <View style={styles.row}>
      {panels.map(item => {
        const isCurrent = item.panel === currentPanel;
        return (
          <View key={item.panel} style={[styles.slot, isCurrent && styles.current]}>
            {item.thumbnailUri ? (
              <Image source={{ uri: item.thumbnailUri }} style={styles.thumb} />
            ) : (
              <Text style={styles.slotText}>{String(item.panel).padStart(2, '0')}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  slot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.slot,
    borderWidth: 1,
    borderColor: colors.slotBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  current: {
    borderColor: colors.active,
    borderWidth: 2,
  },
  slotText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
});
