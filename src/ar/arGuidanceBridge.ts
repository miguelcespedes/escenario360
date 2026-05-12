import { NativeModules } from 'react-native';

type ArGuidanceNativeModule = {
  isSupported?: () => Promise<boolean>;
  startSession?: () => Promise<boolean>;
  stopSession?: () => Promise<void>;
  createEquatorAnchors?: (count: number) => Promise<boolean>;
};

const arModule = NativeModules.Stage360ArGuidance as ArGuidanceNativeModule | undefined;

export const isArModuleAvailable = () =>
  !!arModule &&
  typeof arModule.isSupported === 'function' &&
  typeof arModule.startSession === 'function' &&
  typeof arModule.stopSession === 'function' &&
  typeof arModule.createEquatorAnchors === 'function';

export const startArSession = async () => {
  if (!isArModuleAvailable()) {
    return false;
  }
  const supported = await arModule!.isSupported!();
  if (!supported) {
    return false;
  }
  return arModule!.startSession!();
};

export const createArEquatorAnchors = async (count: number) => {
  if (!isArModuleAvailable()) {
    return false;
  }
  return arModule!.createEquatorAnchors!(count);
};

export const stopArSession = async () => {
  if (!isArModuleAvailable()) {
    return;
  }
  await arModule!.stopSession!();
};
