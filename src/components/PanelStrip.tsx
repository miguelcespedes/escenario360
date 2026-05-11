import React, { useEffect, useMemo, useRef } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Panel = { panel: number; thumbnailUri?: string };

type Props = {
  panels: Panel[];
  currentPanel: number;
  highlightedPanel: number;
  onPressItem: (panel: Panel) => void;
};

export const PanelStrip = ({ panels, currentPanel, highlightedPanel, onPressItem }: Props) => {
  const listRef = useRef<FlatList<Panel>>(null);
  const targetIndex = useMemo(
    () => Math.max(0, panels.findIndex(item => item.panel === highlightedPanel)),
    [highlightedPanel, panels],
  );

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: targetIndex, animated: true, viewPosition: 0.5 });
  }, [targetIndex]);

  return (
    <View>
      <FlatList
        ref={listRef}
        data={panels}
        horizontal
        contentContainerStyle={styles.row}
        keyExtractor={item => String(item.panel)}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: 78, offset: 78 * index, index })}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => {
          const isCurrent = item.panel === currentPanel;
          const isCaptured = Boolean(item.thumbnailUri);
          return (
            <Pressable onPress={() => onPressItem(item)} style={[styles.slot, isCurrent && styles.current]}>
              {item.thumbnailUri ? (
                <Image source={{ uri: item.thumbnailUri }} style={styles.thumb} />
              ) : (
                <View style={styles.placeholder} />
              )}
              <View style={styles.badge}>
                <Text style={[styles.slotText, isCaptured && styles.captured]}>
                  {String(item.panel).padStart(2, '0')}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingHorizontal: 2,
  },
  slot: {
    width: 68,
    height: 102,
    borderRadius: 12,
    backgroundColor: colors.slot,
    borderWidth: 1,
    borderColor: colors.slotBorder,
    overflow: 'hidden',
  },
  current: {
    borderColor: colors.active,
    borderWidth: 2,
    shadowColor: colors.active,
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  placeholder: { flex: 1, backgroundColor: '#172334' },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 11, 20, 0.72)',
  },
  slotText: {
    color: '#C5D2E4',
    fontSize: 11,
    fontWeight: '700',
  },
  captured: { color: colors.text },
  thumb: {
    width: '100%',
    height: '100%',
  },
});
