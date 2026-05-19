/**
 * 导航共享常量
 * MobileNav 和 LayoutSidebar 共用的常量配置
 */

import { isChina } from '@/constant'

/** GitHub 仓库地址 */
export const GITHUB_REPO = 'yikart/AiToEarn'

/** 文档网站地址 */
export const DOCS_URL = 'https://docs.aitoearn.ai'

/** 站点切换地址 */
export const SITE_SWITCH_URL = isChina
  ? process.env.NEXT_PUBLIC_ABROAD_DOMAIN || 'https://aitoearn.ai/'
  : process.env.NEXT_PUBLIC_CHINA_DOMAIN || 'https://aitoearn.cn/'

/** 站点切换文案 key */
export const SITE_SWITCH_TRANSLATION_KEY = isChina ? 'switchToInternational' : 'switchToChina'

/**
 * 导航菜单分组配置
 * MobileNav 中 "More" 折叠菜单包含的路由项
 */
export const NAV_GROUP_KEYS = [
  'tasksHistory',
  'header.materialLibrary',
] as const
