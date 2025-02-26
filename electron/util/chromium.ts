/*
 * @Author: nevin
 * @Date: 2025-02-21 21:28:10
 * @LastEditTime: 2025-02-24 14:42:05
 * @LastEditors: nevin
 * @Description:
 */
import { dialog } from 'electron';
import { store } from '../global/store';
import os from 'os';
import fs from 'fs';

// 获取默认浏览器路径
const getDefaultChromiumPath = () => {
  const platform = process.platform;
  // 常用安装路径
  let bArr: string[] = [];

  if (platform === 'win32') {
    bArr = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ];
  } else if (platform === 'darwin') {
    bArr = ['/Applications/Safari.app'];
  } else if (platform === 'linux') {
    bArr = [
      '/usr/bin/chromium',
      '/usr/local/bin/chromium',
      '/opt/chromium/chromium',
    ];
  }

  for (const p of bArr) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
};

const platform = os.platform();
export function getChromiumPath() {
  let bPath = store.get('chromiumPath');
  // 取默认浏览器路径
  if (!bPath) {
    bPath = getDefaultChromiumPath();
    store.set('chromiumPath', bPath);
  }
  return bPath;
}

export async function setChromiumPath() {
  let path = '';
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    title: '请选择chrome应用',
    filters: [
      {
        name: 'Applications',
        extensions: platform === 'darwin' ? ['app'] : ['exe'],
      },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    path = result.filePaths[0]; // 返回用户选择的目录
    // 判断选择的应用是否是Chromium应用，用名称匹配
    if (platform === 'darwin') path += '/Contents/MacOS/Chromium';

    store.set('chromiumPath', path);
  }
  return path;
}
