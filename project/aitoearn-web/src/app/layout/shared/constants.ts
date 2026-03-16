/**
 * 导航共享常量
 * MobileNav 和 LayoutSidebar 共用的常量配置
 */

/** GitHub 仓库地址 */
export const GITHUB_REPO = 'yikart/AiToEarn'

/** 文档网站地址 */
export const DOCS_URL = 'https://docs.aitoearn.ai'

/** 推广注册地址 */
// export const AFFILIATES_URL = 'https://geddle.com/affiliate-program/aitoearn'
export const AFFILIATES_URL
  = 'https://aitoearn.getrewardful.com/signup?_gl=1*15wk8k8*_gcl_au*MjAzNTIwODgyMi4xNzY1MjkwMjc2LjExMjI2NzUyNDguMTc2NjE1MjM5OS4xNzY2MTUzODYz*_ga*OTk1MTc5MzQzLjE3NjUyOTAyNzY.*_ga_YJYFH7ZS27*czE3NjYxNTIzOTIkbzckZzEkdDE3NjYxNTM4OTQkajQ3JGwwJGgxODk3OTAxMTc1'

/**
 * 导航菜单分组配置
 * MobileNav 中 "More" 折叠菜单包含的路由项
 */
export const NAV_GROUP_KEYS = [
  'tasksHistory',
  'header.materialLibrary',
  'uptime',
] as const
