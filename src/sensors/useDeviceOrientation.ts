import { useEffect, useState } from 'react';
import { DeviceEventEmitter, NativeModules } from 'react-native';

import { defaultOrientation, type DeviceOrientation } from './orientationStore';

type OrientationPayload = {
  yaw?: number;
  pitch?: number;
  roll?: number;
};

const ORIENTATION_EVENT = 'stage360_orientation';

const toNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const toOrientation = (payload: OrientationPayload): DeviceOrientation => {
  const yaw = toNumber(payload.yaw, 0);
  const pitch = toNumber(payload.pitch, 0);
  const roll = toNumber(payload.roll, 0);
  return {
    yaw,
    pitch,
    roll,
    isLevel: Math.abs(roll) <= 3,
    source: 'sensor',
  };
};

export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState<DeviceOrientation>(defaultOrientation);

  useEffect(() => {
    const module = NativeModules.Stage360Orientation;
    if (!module || typeof module.start !== 'function' || typeof module.stop !== 'function') {
      return;
    }

    module.start();
    const subscription = DeviceEventEmitter.addListener(ORIENTATION_EVENT, payload => {
      setOrientation(toOrientation(payload as OrientationPayload));
    });

    return () => {
      subscription.remove();
      module.stop();
    };
  }, []);

  return orientation;
};
