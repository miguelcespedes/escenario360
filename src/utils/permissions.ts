import { PermissionsAndroid, Platform } from 'react-native';
import { Camera } from 'react-native-vision-camera';

export const requestCameraAndStoragePermissions = async () => {
  const camera = await Camera.requestCameraPermission();
  if (Platform.OS !== 'android') {
    return camera === 'granted';
  }

  const androidVersion = Number(Platform.Version);
  if (androidVersion <= 28) {
    const storage = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    );
    return camera === 'granted' && storage === PermissionsAndroid.RESULTS.GRANTED;
  }

  return camera === 'granted';
};
