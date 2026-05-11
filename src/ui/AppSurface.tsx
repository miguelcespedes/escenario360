import React, { PropsWithChildren } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Surface } from 'react-native-paper';

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export const AppSurface = ({ style, children }: Props) => {
  return <Surface style={style}>{children}</Surface>;
};
