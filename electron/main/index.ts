import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { update } from './update';
import { SystemTray } from '../tray/systemTray';
import { views } from './views';
import App from './app';
import { getAssetPath } from '../util/index';
import windowOperate from '../util/windowOperate';
import { logger } from '../global/log';
import { SplashWindow } from './splash';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '../..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration();
// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

// 单例锁
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
let splashWindow: SplashWindow | null = null;
const preload = path.join(__dirname, '../preload/index.mjs');
const indexHtml = path.join(RENDERER_DIST, 'index.html');

async function createWindow() {
  // 创建启动窗口
  splashWindow = new SplashWindow();
  splashWindow.create();

  // 等待一会儿确保启动窗口显示
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 创建主窗口但先不显示
  win = new BrowserWindow({
    title: '爱团团AiToEarn',
    icon: path.join(getAssetPath('favicon.ico')),
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 800,
    show: false,
    webPreferences: {
      preload,
      webviewTag: true,
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  try {
    const tray = new SystemTray(win);
    tray.create();
  } catch (error) {
    logger.error('系统托盘启动失败', error);
  }

  // 等待主窗口加载完成
  if (VITE_DEV_SERVER_URL) {
    await win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    await win.loadFile(indexHtml);
  }

  // 延长启动窗口显示时间
  setTimeout(() => {
    if (splashWindow) {
      win?.show();
      // 在主窗口显示后再打开开发者工具
      if (VITE_DEV_SERVER_URL) {
        win?.webContents.openDevTools({ mode: 'right' });
      }
      setTimeout(() => {
        if (splashWindow) {
          splashWindow.close();
          splashWindow = null;
        }
      }, 500);
    }
  }, 2000);

  // 隐藏菜单栏
  win.setMenu(null);

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

app.whenReady().then(async () => {
  try {
    // 创建应用实例,挂载功能
    new App();

    // 创建窗口
    const bWin = await createWindow();

    // 挂载其他功能
    update(bWin);
    views(bWin);
    windowOperate.init(bWin);
  } catch (error) {
    logger.error('Failed to start application:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

// 处理第二个实例
app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// 处理激活
app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// 打开新窗口
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
