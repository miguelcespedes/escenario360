import RNFS from 'react-native-fs';

export const CAPTURE_DIR = `${RNFS.DocumentDirectoryPath}/stage360/captures`;

export const ensureCaptureDirectory = async () => {
  const exists = await RNFS.exists(CAPTURE_DIR);
  if (!exists) {
    await RNFS.mkdir(CAPTURE_DIR);
  }
};

export const saveManifestFile = async (json: string) => {
  await ensureCaptureDirectory();
  const target = `${CAPTURE_DIR}/manifest.json`;
  await RNFS.writeFile(target, json, 'utf8');
  return target;
};

export const savePanelImage = async (sourcePath: string, panelNumber: number) => {
  await ensureCaptureDirectory();
  const filename = `panel_${String(panelNumber).padStart(2, '0')}.jpg`;
  const target = `${CAPTURE_DIR}/${filename}`;
  await RNFS.copyFile(sourcePath, target);
  return { filename, path: target };
};
