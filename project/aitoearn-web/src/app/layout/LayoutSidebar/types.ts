/**
 * LayoutSidebar - 侧边栏共享类型定义
 */

import type { SettingsTab } from '@/store/settingsModal'

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
  path?: string
  translationKey: string
  icon?: React.ReactNode
  children?: NavItemData[]
}

/** 导航区域 Props */
export interface NavSectionProps extends SidebarCommonProps {
  /** 导航项列表 */
  items: NavItemData[]
  /** 当前激活的路由 */
  currentRoute: string
}

/** 用户下拉菜单 Props */
export interface UserDropdownMenuProps extends SidebarCommonProps {
  /** 打开设置弹框 */
  onOpenSettings: (defaultTab?: SettingsTab) => void
}
