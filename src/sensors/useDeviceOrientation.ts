import { useMemo } from 'react';

import { defaultOrientation } from './orientationStore';

export const useDeviceOrientation = () => {
  return useMemo(() => defaultOrientation, []);
};
