import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { Button, IconButton, Modal, Portal, Surface, Text, useTheme } from 'react-native-paper';

type PhotoItem = {
  panel: number;
  uri?: string;
  filename?: string;
  capturedAt?: string;
};

type Props = {
  visible: boolean;
  photos: PhotoItem[];
  initialIndex: number;
  onDismiss?: () => void;
  onClose?: () => void;
};

export const PhotoPreviewModal = ({ visible, photos, initialIndex, onDismiss, onClose }: Props) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<PhotoItem>>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const handleClose = onDismiss ?? onClose ?? (() => {});

  useEffect(() => {
    if (visible) {
      setActiveIndex(initialIndex);
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 0);
    }
  }, [initialIndex, visible]);

  const current = useMemo(() => photos[activeIndex], [activeIndex, photos]);

  const step = (delta: number) => {
    const next = Math.min(photos.length - 1, Math.max(0, activeIndex + delta));
    setActiveIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleClose} contentContainerStyle={styles.modalContainer}>
        <Surface style={[styles.frame, { backgroundColor: theme.colors.surface }]} elevation={4}>
          <View style={styles.topRow}>
            <Text variant="titleMedium" style={styles.label}>
              {`Panel ${String((current?.panel ?? 1)).padStart(2, '0')} de ${String(photos.length).padStart(2, '0')}`}
            </Text>
            <View style={styles.closeWrap}>
              <Button mode="text" compact onPress={handleClose} icon="close">
                Cerrar
              </Button>
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => String(item.panel)}
            onScrollToIndexFailed={() => {}}
            onMomentumScrollEnd={event => {
              const width = event.nativeEvent.layoutMeasurement.width;
              const x = event.nativeEvent.contentOffset.x;
              const index = Math.round(x / width);
              setActiveIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={[styles.page, { width: width - 24 }] }>
                {item.uri ? (
                  <Image source={{ uri: item.uri }} style={styles.photo} resizeMode="contain" />
                ) : (
                  <Surface style={[styles.placeholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text variant="titleMedium">Panel pendiente</Text>
                    <Text variant="bodySmall" style={styles.pendingSub}>
                      Captura este panel para visualizarlo aqui.
                    </Text>
                  </Surface>
                )}
              </View>
            )}
          />

          <View style={styles.arrowLayer} pointerEvents="box-none">
            <IconButton
              icon="chevron-left"
              mode="contained-tonal"
              size={24}
              onPress={() => step(-1)}
              disabled={activeIndex === 0}
            />
            <IconButton
              icon="chevron-right"
              mode="contained-tonal"
              size={24}
              onPress={() => step(1)}
              disabled={activeIndex === photos.length - 1}
            />
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 12,
  },
  frame: {
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 580,
  },
  topRow: {
    paddingTop: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: '700',
  },
  closeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  page: {
    width: '100%',
    minHeight: 500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    minHeight: 500,
  },
  placeholder: {
    width: '88%',
    minHeight: 260,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  pendingSub: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  arrowLayer: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -20,
  },
});
