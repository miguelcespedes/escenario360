import { PermissionsAndroid, Platform } from 'react-native';
import { Camera } from 'react-native-vision-camera';

export const requestCameraAndStoragePermissions = async () => {
  const camera = await Camera.requestCameraPermission();
  if (Platform.OS !== 'android') {
    return camera === 'granted';
  }

  const storage = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  );

  return camera === 'granted' && storage === PermissionsAndroid.RESULTS.GRANTED;
};
