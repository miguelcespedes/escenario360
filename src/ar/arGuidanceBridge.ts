import { DeviceEventEmitter, NativeEventSubscription, NativeModules } from 'react-native';

export type ArGuidanceStatus = {
  sessionActive: boolean;
  activeAnchorIndex: number;
  totalAnchors: number;
  anchorYaw?: number;
  anchorPitch?: number;
  targetYaw?: number;
  targetPitch?: number;
  targetX?: number;
  targetY?: number;
  targetZ?: number;
  anchorMode?: 'synthetic' | 'world';
  worldAnchorsSupported?: boolean;
  modeReason?: string;
  floorDetected?: boolean;
  wallsDetected?: boolean;
  sessionQuality?: 'idle' | 'initializing' | 'scanning' | 'ready' | 'unavailable';
};

export type ArAnchorPoint = {
  index: number;
  yaw: number;
  pitch: number;
  x?: number;
  y?: number;
  z?: number;
};

type ArGuidanceNativeModule = {
  isSupported?: () => Promise<boolean>;
  startSession?: () => Promise<boolean>;
  stopSession?: () => Promise<void>;
  createEquatorAnchors?: (count: number, baseYaw: number, basePitch: number) => Promise<boolean>;
  setAnchorMode?: (mode: 'synthetic' | 'world') => Promise<'synthetic' | 'world'>;
  getAnchors?: () => Promise<ArAnchorPoint[]>;
  advanceToNextAnchor?: () => Promise<boolean>;
  getStatus?: () => Promise<ArGuidanceStatus>;
};

const arModule = NativeModules.Stage360ArGuidance as ArGuidanceNativeModule | undefined;
const AR_STATUS_EVENT = 'stage360_ar_status';

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

export const createArEquatorAnchors = async (count: number, baseYaw: number, basePitch: number) => {
  if (!isArModuleAvailable()) {
    return false;
  }
  return arModule!.createEquatorAnchors!(count, baseYaw, basePitch);
};

export const setArAnchorMode = async (mode: 'synthetic' | 'world') => {
  if (!isArModuleAvailable() || typeof arModule!.setAnchorMode !== 'function') {
    return 'synthetic' as const;
  }
  return arModule!.setAnchorMode!(mode);
};

export const advanceArAnchor = async () => {
  if (!isArModuleAvailable() || typeof arModule!.advanceToNextAnchor !== 'function') {
    return false;
  }
  return arModule!.advanceToNextAnchor!();
};

export const getArStatus = async (): Promise<ArGuidanceStatus | null> => {
  if (!isArModuleAvailable() || typeof arModule!.getStatus !== 'function') {
    return null;
  }
  return arModule!.getStatus!();
};

export const getArAnchors = async (): Promise<ArAnchorPoint[]> => {
  if (!isArModuleAvailable() || typeof arModule!.getAnchors !== 'function') {
    return [];
  }
  return arModule!.getAnchors!();
};

export const subscribeArStatus = (
  callback: (status: ArGuidanceStatus) => void,
): NativeEventSubscription =>
  DeviceEventEmitter.addListener(AR_STATUS_EVENT, payload => {
    callback(payload as ArGuidanceStatus);
  });

export const stopArSession = async () => {
  if (!isArModuleAvailable()) {
    return;
  }
  await arModule!.stopSession!();
};
