import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: string;
};

export const AppButton = ({ label, onPress, disabled, icon }: Props) => {
  return (
    <Button
      mode="contained"
      onPress={onPress}
      disabled={disabled}
      icon={icon}
      contentStyle={styles.content}
      labelStyle={styles.label}
      style={styles.btn}>
      {label}
    </Button>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderRadius: 999,
  },
  content: {
    minHeight: 58,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
