import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

import { AppMenu } from './AppMenu';
import { AppSurface } from './AppSurface';

type Props = {
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
  onReset: () => void;
  onExport: () => void;
  onHelp: () => void;
  onDebug: () => void;
  onAbout: () => void;
};

export const AppHeader = ({
  menuVisible,
  setMenuVisible,
  onReset,
  onExport,
  onHelp,
  onDebug,
  onAbout,
}: Props) => {
  const anchor = (
    <IconButton icon="menu" size={22} onPress={() => setMenuVisible(true)} mode="contained-tonal" />
  );

  return (
    <AppSurface style={styles.wrap}>
      <View style={styles.brandRow}>
        <Image source={require('../../assets/brand/stage360-logo-dark.png')} style={styles.logo} />
        <View>
          <Text variant="headlineSmall" style={styles.title}>
            Stage360
          </Text>
          <Text variant="bodySmall" style={styles.version}>
            v0.1.0
          </Text>
        </View>
      </View>

      <AppMenu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={anchor}
        onReset={onReset}
        onExport={onExport}
        onHelp={onHelp}
        onDebug={onDebug}
        onAbout={onAbout}
      />
    </AppSurface>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  version: {
    opacity: 0.8,
  },
});
