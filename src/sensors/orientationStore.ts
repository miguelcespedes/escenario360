export type DeviceOrientation = {
  yaw: number;
  pitch: number;
  roll: number;
  isLevel: boolean;
  source: 'mock' | 'sensor';
};

export const defaultOrientation: DeviceOrientation = {
  yaw: 0,
  pitch: 0,
  roll: 0,
  isLevel: true,
  source: 'mock',
};
