/*
 * @Author: nevin
 * @Date: 2025-01-23 15:48:14
 * @LastEditTime: 2025-02-14 22:36:25
 * @LastEditors: nevin
 * @Description:
 */

/**
 * 视频截帧
 * @param path
 * @param time
 */
export async function ipcGetVideoCover(path: string, time?: string) {
  const res: string = await window.ipcRenderer.invoke(
    'ICP_GET_VIDEO_COVER',
    path,
    time,
  );
  return res;
}

/**
 * 下载文件到本地
 * @param url
 * @param name
 */
export async function ipcDownFile(url: string, name?: string) {
  const res: string = await window.ipcRenderer.invoke(
    'ICP_TOOL_DOWN_FILE',
    url,
    name,
  );
  return res;
}

/**
 * 日志路径获取
 * @param log
 */
export async function ipcGetLogFlies() {
  const res: string[] = await window.ipcRenderer.invoke('GLOBAL_LOG_GET_FLIES');
  return res;
}

/**
 * 本地文件上传
 * @param path
 */
export async function ipcUpFlie(path: string) {
  const res: string[] = await window.ipcRenderer.invoke(
    'ICP_TOOL_UP_FILE',
    path,
  );
  return res;
}
