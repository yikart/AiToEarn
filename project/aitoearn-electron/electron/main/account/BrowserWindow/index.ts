import { ICreateBrowserWindowParams } from './browserWindow';
import BrowserWindowItem from './BrowserWindowItem';

class BrowserWindowController {
  browserWindowMap: Map<number, BrowserWindowItem> = new Map();

  // 创建 BrowserWindow
  createBrowserWindow(data: ICreateBrowserWindowParams) {
    return new Promise(async (resolve) => {
      try {
        const browserWindowItem = new BrowserWindowItem(data.webViewId);
        this.browserWindowMap.set(data.webViewId, browserWindowItem);
        await browserWindowItem.create(data);
        resolve(null);
      } catch (e) {
        console.error(e);
      }
    });
  }

  // 销毁 BrowserWindow
  destroyBrowserWindow(webViewId: number) {
    // @ts-ignore
    this.browserWindowMap.get(webViewId)?.webview.destroy();
    this.browserWindowMap.delete(webViewId);
  }
}

export const browserWindowController = new BrowserWindowController();
