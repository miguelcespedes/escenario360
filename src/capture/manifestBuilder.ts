export type ManifestShot = {
  index: number;
  filename: string;
  panel: number;
  band: 'equator';
  plannedYaw: number;
  plannedPitch: number;
  capturedYaw: number;
  capturedPitch: number;
  capturedRoll: number;
  capturedAt: string;
};

export type StageManifest = {
  type: 'guided-cylindrical-panel-capture';
  version: '1.0.0';
  appVersion: '0.1.0';
  appName: 'stage360';
  platform: 'react-native-android';
  captureMode: 'cylindrical-panel-segments';
  stitching: 'backend';
  total: number;
  shots: ManifestShot[];
};

export const createManifest = (total: number, shots: ManifestShot[]): StageManifest => ({
  type: 'guided-cylindrical-panel-capture',
  version: '1.0.0',
  appVersion: '0.1.0',
  appName: 'stage360',
  platform: 'react-native-android',
  captureMode: 'cylindrical-panel-segments',
  stitching: 'backend',
  total,
  shots,
});
