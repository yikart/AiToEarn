// api url
export const APP_HOT_URL = "https://att-contents.yikart.cn/api";

// 快手API代理地址
export const KwaiApiProxyUrl = process.env.NEXT_PUBLIC_API_PROXY;
// 快手API 上传 代理地址
export const KwaiApiUploadProxyUrl = process.env.NEXT_PUBLIC_API_UPLOAD_PROXY;

// 代理地址
export const ProxyUrls = [
  process.env.NEXT_PUBLIC_API_URL_PROXY,
  KwaiApiProxyUrl,
  KwaiApiUploadProxyUrl,
];
