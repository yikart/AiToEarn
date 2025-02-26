/*
 * @Author: nevin
 * @Date: 2025-01-23 15:48:14
 * @LastEditTime: 2025-02-14 22:36:25
 * @LastEditors: nevin
 * @Description:
 */

/**
 * 获取应用信息
 */
export async function ipcAppInfo() {
  const res: {
    version: string;
    chromiumPath: string;
  } = await window.ipcRenderer.invoke('ICP_APP_GET_INFO');
  return res;
}
