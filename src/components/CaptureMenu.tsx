import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  onExport: () => void;
  onHelp: () => void;
  onDebug: () => void;
};

const MenuItem = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={styles.item}>
    <Text style={styles.itemText}>{label}</Text>
  </Pressable>
);

export const CaptureMenu = ({ visible, onClose, onReset, onExport, onHelp, onDebug }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Opciones</Text>
          <MenuItem label="Reiniciar" onPress={onReset} />
          <MenuItem label="Exportar manifest" onPress={onExport} />
          <MenuItem label="Ayuda" onPress={onHelp} />
          <MenuItem label="Debug" onPress={onDebug} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 16,
  },
  sheet: {
    width: 220,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    paddingVertical: 8,
  },
  title: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
