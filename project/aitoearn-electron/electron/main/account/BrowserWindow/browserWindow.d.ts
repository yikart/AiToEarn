// 设置cookie参数
export interface ICookieParams {
  // 创建时是否设置cookies
  cookies: Electron.Cookie[];
}

export interface ICreateBrowserWindowParams {
  // webview 的id
  webViewId: number;
  // cookie参数，这个参数不为空会在创建的时候设置cookie
  cookieParams?: ICookieParams;
}
