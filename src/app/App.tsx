import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CaptureScreen } from '../screens/CaptureScreen';

const App = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0B111A" />
      <CaptureScreen />
    </SafeAreaProvider>
  );
};

export default App;
