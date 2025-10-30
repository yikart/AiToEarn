import { webContents, WebContents } from 'electron';
import { ICookieParams, ICreateBrowserWindowParams } from './browserWindow';

export default class BrowserWindowItem {
  webViewId: number;
  webview!: WebContents;

  constructor(webViewId: number) {
    this.webViewId = webViewId;
  }

  /**
   * 创建 webview
   * @param data
   */
  async create(data: ICreateBrowserWindowParams) {
    this.webview = webContents.fromId(this.webViewId)!;
    if (!this.webview)
      return console.error(`无法找到id为 ‘${this.webViewId}’ 的webview`);

    // this.webview.openDevTools();
    // this.webview.setWindowOpenHandler((data) => {
    //   console.log(data.url);
    //   return {
    //     action: 'deny',
    //   };
    // });
    if (data.cookieParams) {
      await this.setCookies(data.cookieParams);
    }
    return true;
  }

  /**
   * 设置cookies
   * @param cookieParams
   */
  async setCookies(cookieParams: ICookieParams) {
    for (const v of cookieParams.cookies) {
      let url: string;
      if (v.domain![0] === '.') {
        url = `https://www.${v.domain?.substring(1, v.domain?.length)}`;
      } else {
        url = `https://${v.domain}`;
      }
      await this.webview.session.cookies.set({
        url: url,
        name: v.name,
        value: v.value,
        domain: v.domain,
        path: v.path,
        secure: v.secure,
        httpOnly: v.httpOnly,
      });
    }
    return true;
  }
}
