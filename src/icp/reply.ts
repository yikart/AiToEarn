/*
 * @Author: nevin
 * @Date: 2025-01-23 15:48:14
 * @LastEditTime: 2025-02-14 22:36:25
 * @LastEditors: nevin
 * @Description:
 */

/**
 * 获取作品列表
 */
export async function ipcCreatorList(accountId: number) {
  const res = await window.ipcRenderer.invoke('ICP_CREATOR_LIST', accountId);
  return res;
}
