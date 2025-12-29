/**
 * LayoutSidebar - 侧边栏共享类型定义
 */

import type { SettingsTab } from '@/components/SettingsModal'

/** 侧边栏通用 Props */
export interface SidebarCommonProps {
  /** 是否收缩状态 */
  collapsed: boolean
}

/** 底部功能区回调 Props */
export interface BottomSectionCallbacks {
  /** 打开设置弹框 */
  onOpenSettings: (defaultTab?: SettingsTab) => void
}

/** 底部功能区 Props */
export interface BottomSectionProps extends SidebarCommonProps, BottomSectionCallbacks {}

/** 用户区域 Props */
export interface UserSectionProps extends SidebarCommonProps {
  /** 登录回调 */
  onLogin: () => void
  /** 打开设置弹框 */
  onOpenSettings: (defaultTab?: SettingsTab) => void
}

/** Logo 区域 Props */
export interface LogoSectionProps extends SidebarCommonProps {
  /** 展开/收缩回调 */
  onToggle: () => void
}

/** 导航项数据类型 */
export interface NavItemData {
  path: string
  translationKey: string
  icon?: React.ReactNode
}

/** 导航区域 Props */
export interface NavSectionProps extends SidebarCommonProps {
  /** 导航项列表 */
  items: NavItemData[]
  /** 当前激活的路由 */
  currentRoute: string
}

/** 图标栏 Props */
export interface IconBarProps extends SidebarCommonProps {
  /** 是否已登录 */
  isLoggedIn: boolean
  /** 未读通知数 */
  unreadCount: number
  /** 打开通知面板 */
  onOpenNotification: () => void
  /** 打开设置弹框 */
  onOpenSettings: (defaultTab?: SettingsTab) => void
}
