export type ArPoint = {
  index: number;
  targetYaw: number;
  targetPitch: number;
};

export const TOTAL_AR_POINTS = 12;
export const STEP_DEGREES = 360 / TOTAL_AR_POINTS;

const normalizeYaw = (yaw: number) => {
  const normalized = yaw % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

export const buildArEquatorPoints = (anchorYaw: number, anchorPitch: number): ArPoint[] =>
  Array.from({ length: TOTAL_AR_POINTS }, (_, i) => ({
    index: i + 1,
    targetYaw: normalizeYaw(anchorYaw + i * STEP_DEGREES),
    targetPitch: anchorPitch,
  }));

export const deltaYaw = (target: number, current: number) => {
  let delta = (target - current + 540) % 360 - 180;
  if (delta === -180) {
    delta = 180;
  }
  return delta;
};
