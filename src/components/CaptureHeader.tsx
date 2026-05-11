import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  onMenuPress: () => void;
};

export const CaptureHeader = ({ onMenuPress }: Props) => {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.title}>Stage360</Text>
        <Text style={styles.version}>v0.1.0</Text>
      </View>
      <Pressable onPress={onMenuPress} style={styles.menuBtn}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  version: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  line: {
    width: 18,
    height: 2,
    backgroundColor: colors.text,
    borderRadius: 2,
  },
});
