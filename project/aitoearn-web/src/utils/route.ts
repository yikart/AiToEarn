/**
 * route - 路由相关工具函数
 */

import { languages } from '@/app/i18n/settings'

/** 公开页面白名单（不需要登录即可访问） */
const PUBLIC_PATHS = [
  '/auth', // 认证相关页面（登录、注册、忘记密码等）
  '/websit', // 网站公共页面（条款、隐私政策等）
  '/blog', // 博客页面
  '/chat', // 分享页面
  '/promo', // 推广页面
  '/welcome', // 欢迎页面
]

/**
 * 判断路径是否是公开页面（不需要登录）
 * 包括：首页、认证页面、网站公共页面（条款、隐私政策等）
 */
export function isPublicPage(pathname: string): boolean {
  // 移除语言前缀，获取实际路径
  let path = pathname
  for (const lang of languages) {
    if (pathname === `/${lang}` || pathname.startsWith(`/${lang}/`)) {
      path = pathname.slice(lang.length + 1) || '/'
      break
    }
  }

  // 首页
  if (path === '/' || path === '') {
    return true
  }

  return PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath))
}
