jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Camera: Object.assign(
      React.forwardRef((props, ref) => React.createElement(View, { ...props, ref })),
      { requestCameraPermission: jest.fn().mockResolvedValue('granted') },
    ),
    useCameraDevice: () => ({ id: 'mock-device' }),
  };
});

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
  exists: jest.fn().mockResolvedValue(true),
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  copyFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ name }) => React.createElement(Text, null, name || 'icon');
});
