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
