/*
 * @Author: nevin
 * @Date: 2025-02-27 12:12:19
 * @LastEditTime: 2025-02-27 16:38:08
 * @LastEditors: nevin
 * @Description:
 */
import { BrowserWindow } from 'electron';
import path from 'node:path';
import { VITE_DEV_SERVER_URL, RENDERER_DIST } from './index';

export class SplashWindow {
  private window: BrowserWindow | null = null;

  create() {
    this.window = new BrowserWindow({
      width: 400,
      height: 400,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      center: true,
      // backgroundColor: 'var(--whiteColor1)', // 添加背景色
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // 根据开发环境和生产环境使用不同的加载方式
    const splashPath = VITE_DEV_SERVER_URL
      ? path.join(process.env.VITE_PUBLIC!, 'splash.html')
      : path.join(RENDERER_DIST, 'splash.html');

    console.log('Splash path:', splashPath); // 调试路径

    this.window.loadFile(splashPath).catch((err) => {
      console.error('Failed to load splash window:', err);
    });

    // 只在开发环境打印日志
    if (VITE_DEV_SERVER_URL) {
      this.window.webContents.on('did-finish-load', () => {
        console.log('Splash window loaded');
      });

      this.window.webContents.on('did-fail-load', (_, code, description) => {
        console.error('Splash window failed to load:', code, description);
      });
    }
  }

  close() {
    if (this.window) {
      this.window.close();
      this.window = null;
    }
  }
}
