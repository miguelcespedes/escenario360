export const TOTAL_PANELS = 12;

export const buildPanelPlan = () =>
  Array.from({ length: TOTAL_PANELS }, (_, idx) => ({
    panel: idx + 1,
    plannedYaw: idx * (360 / TOTAL_PANELS),
    plannedPitch: 0,
  }));
