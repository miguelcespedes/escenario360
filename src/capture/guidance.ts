import { type DeviceOrientation } from '../sensors/orientationStore';

type GuidanceTarget = {
  plannedYaw: number;
  plannedPitch: number;
  plannedRoll: number;
};

export type AlignmentStatus = 'fuera' | 'cerca' | 'alineado';

export type GuidanceResult = {
  isCaptureAllowed: boolean;
  status: AlignmentStatus;
  message: string;
  deltas: {
    yaw: number;
    pitch: number;
    roll: number;
  };
};

export const STEP_DEGREES = 360 / 12;

const TOLERANCE = {
  yawNear: 10,
  yawOk: 5,
  pitchNear: 6,
  pitchOk: 3,
  rollNear: 6,
  rollOk: 3,
};

const normalizeDeltaYaw = (target: number, current: number) => {
  let delta = (target - current + 540) % 360 - 180;
  if (delta === -180) {
    delta = 180;
  }
  return delta;
};

const abs = Math.abs;

export const buildGuidance = (
  orientation: DeviceOrientation,
  target: GuidanceTarget,
  isFirstPanel: boolean,
): GuidanceResult => {
  if (isFirstPanel) {
    const allowAnchor = orientation.isLevel;
    return {
      isCaptureAllowed: allowAnchor,
      status: allowAnchor ? 'alineado' : 'fuera',
      message: allowAnchor ? 'Toma la foto ancla.' : 'Nivela el telefono antes de anclar.',
      deltas: { yaw: 0, pitch: 0, roll: orientation.roll },
    };
  }

  const yawDelta = normalizeDeltaYaw(target.plannedYaw, orientation.yaw);
  const pitchDelta = target.plannedPitch - orientation.pitch;
  const rollDelta = target.plannedRoll - orientation.roll;

  const absYaw = abs(yawDelta);
  const absPitch = abs(pitchDelta);
  const absRoll = abs(rollDelta);

  const isAligned =
    absYaw <= TOLERANCE.yawOk && absPitch <= TOLERANCE.pitchOk && absRoll <= TOLERANCE.rollOk;

  const isNear =
    absYaw <= TOLERANCE.yawNear && absPitch <= TOLERANCE.pitchNear && absRoll <= TOLERANCE.rollNear;

  let message = 'Alineado, captura ahora.';
  if (!isAligned) {
    if (absRoll > TOLERANCE.rollOk) {
      message = rollDelta > 0 ? 'Nivela: gira un poco a la izquierda.' : 'Nivela: gira un poco a la derecha.';
    } else if (absPitch > TOLERANCE.pitchOk) {
      message = pitchDelta > 0 ? 'Sube un poco.' : 'Baja un poco.';
    } else {
      message = yawDelta > 0 ? 'Gira ligeramente a la derecha.' : 'Te pasaste, vuelve a la izquierda.';
    }
  }

  return {
    isCaptureAllowed: isAligned,
    status: isAligned ? 'alineado' : isNear ? 'cerca' : 'fuera',
    message,
    deltas: {
      yaw: yawDelta,
      pitch: pitchDelta,
      roll: rollDelta,
    },
  };
};

export const estimateOverlapFromStep = (stepDeltaYaw: number) => {
  const normalized = Math.max(0, 1 - Math.abs(stepDeltaYaw - STEP_DEGREES) / STEP_DEGREES);
  return Number(normalized.toFixed(2));
};

export const projectTargetOffset = (
  deltas: { yaw: number; pitch: number },
  viewport: { width: number; height: number },
) => {
  const horizontalFov = 58;
  const verticalFov = 45;

  const pxPerDegX = viewport.width / horizontalFov;
  const pxPerDegY = viewport.height / verticalFov;

  const rawX = -deltas.yaw * pxPerDegX;
  const rawY = -deltas.pitch * pxPerDegY;

  const maxX = viewport.width * 0.35;
  const maxY = viewport.height * 0.28;

  return {
    x: Math.max(-maxX, Math.min(maxX, rawX)),
    y: Math.max(-maxY, Math.min(maxY, rawY)),
  };
};
