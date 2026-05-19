import { APP_BRAND } from '@/config/brand'

/**
 * 导航共享常量
 * MobileNav 和 LayoutSidebar 共用的常量配置
 */

/** GitHub 仓库地址 */
export const GITHUB_REPO = ''

/** 文档网站地址 */
export const DOCS_URL = APP_BRAND.siteUrl

/**
 * 导航菜单分组配置
 * MobileNav 中 "More" 折叠菜单包含的路由项
 */
export const NAV_GROUP_KEYS = [
  'tasksHistory',
  'header.materialLibrary',
] as const
