import { MD3DarkTheme, configureFonts } from 'react-native-paper';

export const paperTheme = {
  ...MD3DarkTheme,
  roundness: 18,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#56B4FF',
    secondary: '#5BD3A3',
    tertiary: '#5BD3A3',
    background: '#060B14',
    surface: '#0E1726',
    surfaceVariant: '#17263B',
    outline: '#2A425E',
    onPrimary: '#021424',
    onSurface: '#EAF2FF',
    onSurfaceVariant: '#9AB0C8',
    backdrop: 'rgba(4, 10, 19, 0.74)',
  },
  fonts: configureFonts({
    config: {
      fontFamily: 'sans-serif',
    },
  }),
};

export type AppPaperTheme = typeof paperTheme;
