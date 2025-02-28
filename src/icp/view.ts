// 根据文件获取硬盘上的文件流
import { ISaveFileParams } from '../../electron/main/views';

export async function icpGetFileStream(path: string) {
  const res: Uint8Array = await window.ipcRenderer.invoke(
    'ICP_VIEWS_GET_FILE_STREAM',
    path,
  );
  return res;
}

// 保存文件
export async function icpSaveFile(params: ISaveFileParams) {
  const res: string = await window.ipcRenderer.invoke(
    'ICP_VIEWS_SAVE_FILE',
    params,
  );
  return res;
}

// 获取经纬度
export async function icpGetLocation() {
  const res: {
    bd09: number[];
    wgs84: number[];
    gcj02: number[];
  } = await window.ipcRenderer.invoke('GET_LOCATION');
  return res;
}
