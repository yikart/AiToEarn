/*
 * @Author: nevin
 * @Date: 2025-01-18 20:28:01
 * @LastEditTime: 2025-02-19 02:11:04
 * @LastEditors: nevin
 * @Description:
 */
import { app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const isDev = !app.isPackaged || process.env.ELECTRON_DEBUG === 'true';

import os from 'os';

const platform = os.platform();
const arch = os.arch();

// 检查平台支持
if (platform !== 'darwin' && platform !== 'linux' && platform !== 'win32') {
  console.error('ffprobe unsupported platform.');
  // process.exit(1);
}

// 检查 macOS 架构支持
if (platform === 'darwin' && arch !== 'x64' && arch !== 'arm64') {
  console.error('ffprobe unsupported architecture.');
  // process.exit(1);
}

/**
 * 获取静态文件目录
 * @param paths
 * @returns
 */
export const getAssetPath = (...paths: string[]): string => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../public/assets');

  return path.join(RESOURCES_PATH, ...paths);
};
