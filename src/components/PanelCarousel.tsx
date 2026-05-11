import React, { useEffect, useMemo, useRef } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';

type Panel = { panel: number; thumbnailUri?: string };

type Props = {
  panels: Panel[];
  currentPanel: number;
  highlightedPanel: number;
  onPressItem: (panel: Panel) => void;
};

export const PanelCarousel = ({ panels, currentPanel, highlightedPanel, onPressItem }: Props) => {
  const theme = useTheme();
  const listRef = useRef<FlatList<Panel>>(null);
  const targetIndex = useMemo(
    () => Math.max(0, panels.findIndex(item => item.panel === highlightedPanel)),
    [highlightedPanel, panels],
  );

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: targetIndex, animated: true, viewPosition: 0.5 });
  }, [targetIndex]);

  return (
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
          <TouchableRipple
            onPress={() => onPressItem(item)}
            borderless
            style={[
              styles.slot,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: isCurrent ? theme.colors.primary : theme.colors.outline,
              },
              isCurrent && styles.current,
            ]}>
            <View style={styles.inner}>
              {item.thumbnailUri ? (
                <Image source={{ uri: item.thumbnailUri }} style={styles.thumb} />
              ) : (
                <View style={[styles.placeholder, { backgroundColor: '#1A2638' }]} />
              )}
              <View style={[styles.badge, { backgroundColor: 'rgba(6, 11, 20, 0.72)' }]}>
                <Text variant="labelSmall" style={[styles.slotText, { color: isCaptured ? theme.colors.onSurface : '#C5D2E4' }]}>
                  {String(item.panel).padStart(2, '0')}
                </Text>
              </View>
            </View>
          </TouchableRipple>
        );
      }}
    />
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
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: { flex: 1 },
  current: {
    borderWidth: 2,
  },
  placeholder: { flex: 1 },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  slotText: {
    fontWeight: '700',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
});
