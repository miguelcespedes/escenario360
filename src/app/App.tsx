import React from 'react';
import { StatusBar } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { CaptureScreen } from '../screens/CaptureScreen';
import { paperTheme } from '../theme/paperTheme';

const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider
        theme={paperTheme}
        settings={{
          icon: props => <MaterialCommunityIcons {...props} />,
        }}>
        <StatusBar barStyle="light-content" backgroundColor="#060B14" />
        <CaptureScreen />
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;
