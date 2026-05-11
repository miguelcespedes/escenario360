import React from 'react';
import { StatusBar } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CaptureScreen } from '../screens/CaptureScreen';
import { paperTheme } from '../theme/paperTheme';

const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar barStyle="light-content" backgroundColor="#060B14" />
        <CaptureScreen />
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;
