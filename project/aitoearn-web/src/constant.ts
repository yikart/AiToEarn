// 代理地址
export const ProxyUrls = [
  '/api/',
  process.env.NEXT_PUBLIC_BILI_OSS_PROXY,
  process.env.NEXT_PUBLIC_OSS_URL_PROXY,
]

// OSS URL
export const OSS_URL = process.env.NEXT_PUBLIC_OSS_URL!

// 联系方式
export const CONTACT = 'agent@aiearn.ai'

// true=国内
export const isChina = process.env.NEXT_PUBLIC_REGION === 'Domestic'

// 浏览器插件最新版本号
export const PluginVersionLast = '3.0.3'
