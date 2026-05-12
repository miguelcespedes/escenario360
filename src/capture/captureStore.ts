import { useMemo, useState } from 'react';

import { buildPanelPlan, TOTAL_PANELS } from './capturePlan';
import { buildArEquatorPoints, type ArPoint } from './arGuide';
import { createManifest, type ManifestShot, type StageManifest } from './manifestBuilder';

export type PanelState = {
  panel: number;
  filename?: string;
  thumbnailUri?: string;
  imagePath?: string;
};

export const useCaptureStore = () => {
  const [panels, setPanels] = useState<PanelState[]>(
    Array.from({ length: TOTAL_PANELS }, (_, idx) => ({ panel: idx + 1 })),
  );
  const [shots, setShots] = useState<ManifestShot[]>([]);
  const [currentPanel, setCurrentPanel] = useState(1);
  const [statusText, setStatusText] = useState('Listo para capturar.');
  const [yawAnchor, setYawAnchor] = useState<number | null>(null);
  const [pitchAnchor, setPitchAnchor] = useState<number | null>(null);
  const [rollAnchor, setRollAnchor] = useState<number | null>(null);
  const [arPoints, setArPoints] = useState<ArPoint[]>([]);
  const [anchorReady, setAnchorReady] = useState(false);
  const [captureMode, setCaptureMode] = useState<StageManifest['captureMode']>('cylindrical-panel-segments');

  const plan = useMemo(() => buildPanelPlan(), []);

  const normalizeYaw = (yaw: number) => {
    const normalized = yaw % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  };

  const getTargetForPanel = (panel: number) => {
    const point = arPoints[Math.max(0, panel - 1)];
    if (point) {
      return {
        plannedYaw: point.targetYaw,
        plannedPitch: point.targetPitch,
        plannedRoll: rollAnchor ?? 0,
      };
    }
    const planItem = plan[Math.max(0, panel - 1)];
    const targetYaw = normalizeYaw((yawAnchor ?? 0) + planItem.plannedYaw);
    return {
      plannedYaw: targetYaw,
      plannedPitch: (pitchAnchor ?? 0) + planItem.plannedPitch,
      plannedRoll: rollAnchor ?? 0,
    };
  };

  const setAnchorFromOrientation = (yaw: number, pitch: number, roll: number) => {
    setYawAnchor(yaw);
    setPitchAnchor(pitch);
    setRollAnchor(roll);
    setArPoints(buildArEquatorPoints(yaw, pitch));
    setAnchorReady(true);
    setCaptureMode('ar-guided');
    setStatusText('Punto fijo creado. Sigue el punto 01.');
  };

  const registerShot = (shot: ManifestShot, imagePath: string) => {
    if (shot.index === 1 && !anchorReady) {
      setAnchorFromOrientation(shot.capturedYaw, shot.capturedPitch, shot.capturedRoll);
    }
    setShots(prev => [...prev, shot]);
    setPanels(prev =>
      prev.map(item =>
        item.panel === shot.panel
          ? { ...item, filename: shot.filename, thumbnailUri: `file://${imagePath}`, imagePath }
          : item,
      ),
    );
    setCurrentPanel(prev => Math.min(prev + 1, TOTAL_PANELS));
    setStatusText(shot.index === TOTAL_PANELS ? 'Captura completa.' : 'Panel guardado.');
  };

  const resetCapture = () => {
    setPanels(Array.from({ length: TOTAL_PANELS }, (_, idx) => ({ panel: idx + 1 })));
    setShots([]);
    setCurrentPanel(1);
    setStatusText('Listo para capturar.');
    setYawAnchor(null);
    setPitchAnchor(null);
    setRollAnchor(null);
    setArPoints([]);
    setAnchorReady(false);
    setCaptureMode('cylindrical-panel-segments');
  };

  const manifest = createManifest(TOTAL_PANELS, shots, captureMode);

  return {
    totalPanels: TOTAL_PANELS,
    currentPanel,
    panels,
    shots,
    manifest,
    plan,
    yawAnchor,
    pitchAnchor,
    rollAnchor,
    arPoints,
    anchorReady,
    captureMode,
    setAnchorFromOrientation,
    getTargetForPanel,
    statusText,
    registerShot,
    resetCapture,
    setStatusText,
  };
};
