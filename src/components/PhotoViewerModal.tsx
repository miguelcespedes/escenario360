import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  visible: boolean;
  imageUri?: string;
  label?: string;
  onClose: () => void;
};

export const PhotoViewerModal = ({ visible, imageUri, label, onClose }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Cerrar</Text>
        </Pressable>
        <View style={styles.frame}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="contain" /> : null}
          {label ? <Text style={styles.label}>{label}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 2,
    backgroundColor: colors.overlay,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  closeText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  frame: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.black,
  },
  photo: {
    width: '100%',
    height: '88%',
    minHeight: 420,
  },
  label: {
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
