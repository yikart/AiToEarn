/*
 * @Author: nevin
 * @Date: 2025-02-21 21:10:01
 * @LastEditTime: 2025-02-21 21:12:28
 * @LastEditors: nevin
 * @Description: 存储
 */
import { ipcMain } from 'electron';
import Store from 'electron-store';

export const store: any = new Store();
// 定义ipcRenderer监听事件
ipcMain.handle('setStore', (_, key, value) => {
  store.set(key, value);
});
ipcMain.handle('getStore', async (_, key) => {
  const value = store.get(key);
  return value || '';
});
