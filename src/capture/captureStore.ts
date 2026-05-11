import { useMemo, useState } from 'react';

import { buildPanelPlan, TOTAL_PANELS } from './capturePlan';
import { createManifest, type ManifestShot } from './manifestBuilder';

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

  const plan = useMemo(() => buildPanelPlan(), []);

  const registerShot = (shot: ManifestShot, imagePath: string) => {
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
  };

  const manifest = createManifest(TOTAL_PANELS, shots);

  return {
    totalPanels: TOTAL_PANELS,
    currentPanel,
    panels,
    shots,
    manifest,
    plan,
    statusText,
    registerShot,
    resetCapture,
    setStatusText,
  };
};
