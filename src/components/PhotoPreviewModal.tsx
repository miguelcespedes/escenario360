import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { IconButton, Modal, Portal, Surface, Text, useTheme } from 'react-native-paper';

type Props = {
  visible: boolean;
  imageUri?: string;
  label?: string;
  onClose: () => void;
};

export const PhotoPreviewModal = ({ visible, imageUri, label, onClose }: Props) => {
  const theme = useTheme();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
        <Surface style={[styles.frame, { backgroundColor: theme.colors.surface }]} elevation={4}>
          <View style={styles.topRow}>
            <Text variant="titleMedium" style={styles.label}>
              {label}
            </Text>
            <IconButton icon="close" mode="contained-tonal" size={20} onPress={onClose} />
          </View>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="contain" /> : null}
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 14,
  },
  frame: {
    borderRadius: 18,
    overflow: 'hidden',
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
  photo: {
    width: '100%',
    minHeight: 520,
  },
});
