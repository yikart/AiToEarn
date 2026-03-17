import type { SettingsTab } from '@/components/SettingsModal'

/** 抽屉关闭回调 */
export interface MobileCloseProps {
  onClose: () => void
}

/** 顶部栏 Props */
export interface MobileTopBarProps {
  onOpen: () => void
}

/** 导航项 Props */
export interface MobileNavItemProps extends MobileCloseProps {
  path: string
  translationKey: string
  icon?: React.ReactNode
  isActive: boolean
}

/** 我的频道按钮 Props */
export interface MobileMyChannelsButtonProps extends MobileCloseProps {
  onOpenMyChannels: () => void
}

/** 导航列表 Props */
export interface MobileNavListProps extends MobileCloseProps {
  currentRoute: string
  onOpenMyChannels: () => void
}

/** 用户区域 Props */
export interface MobileUserSectionProps extends MobileCloseProps {
  onOpenSettings: (tab?: SettingsTab) => void
}

/** 底部功能区 Props */
export interface MobileBottomSectionProps extends MobileCloseProps {
  onOpenSettings: (tab?: SettingsTab) => void
}
