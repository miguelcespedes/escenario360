import React from 'react';
import { Divider, Menu } from 'react-native-paper';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  anchor: React.ReactNode;
  onReset: () => void;
  onExport: () => void;
  onHelp: () => void;
  onDebug: () => void;
  onAbout: () => void;
};

export const AppMenu = ({
  visible,
  onDismiss,
  anchor,
  onReset,
  onExport,
  onHelp,
  onDebug,
  onAbout,
}: Props) => {
  return (
    <Menu visible={visible} onDismiss={onDismiss} anchor={anchor} contentStyle={{ borderRadius: 14 }}>
      <Menu.Item onPress={onReset} title="Reiniciar captura" leadingIcon="restart" />
      <Menu.Item onPress={onExport} title="Exportar manifest" leadingIcon="file-export" />
      <Divider />
      <Menu.Item onPress={onHelp} title="Ver ayuda" leadingIcon="help-circle-outline" />
      <Menu.Item onPress={onDebug} title="Ver debug" leadingIcon="bug-outline" />
      <Menu.Item onPress={onAbout} title="Acerca de Stage360" leadingIcon="information-outline" />
    </Menu>
  );
};
