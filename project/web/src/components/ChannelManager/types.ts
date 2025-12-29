/**
 * ChannelManager - 频道管理器类型定义
 * 包含三页面视图状态、授权状态、侧边栏状态等类型
 */

import type { SocialAccount } from '@/api/types/account.type'
import type { PlatType } from '@/app/config/platConfig'
import type { PluginPlatformType } from '@/store/plugin'

/** 频道管理器视图类型 */
export type ChannelManagerView = 'main' | 'connect-list' | 'auth-loading'

/** 授权状态 */
export interface AuthState {
  /** 正在授权的平台 */
  platform: PlatType | null
  /** 授权任务ID */
  taskId: string | null
  /** 授权URL */
  authUrl: string | null
  /** 倒计时秒数（默认300秒 = 5分钟） */
  countdown: number
  /** 是否正在轮询 */
  isPolling: boolean
  /** 授权错误信息 */
  error: string | null
  /** 是否授权超时 */
  isTimeout: boolean
}

/** 频道管理器状态 */
export interface ChannelManagerState {
  /** 弹窗是否打开 */
  open: boolean
  /** 当前页面视图 */
  currentView: ChannelManagerView
  /** 侧边栏选中的频道类型，'all' 表示全部频道 */
  selectedPlatform: PlatType | 'all'
  /** 授权相关状态 */
  authState: AuthState
  /** 目标空间ID（授权成功后账号添加到哪个空间） */
  targetSpaceId: string | null
  /** 授权成功回调（外部设置） */
  onAuthSuccess: ((account: SocialAccount, platform: PlatType) => void) | null
  /** 是否为新用户（没有任何账号） */
  isNewUser: boolean
}

/** 频道管理器方法 */
export interface ChannelManagerMethods {
  /** 打开弹框（默认显示主页） */
  openModal: () => void
  /** 关闭弹框 */
  closeModal: () => void
  /** 直接打开并进入指定平台的授权流程 */
  openAndAuth: (platform: PlatType, spaceId?: string) => void
  /** 设置授权成功回调 */
  setOnAuthSuccess: (
    callback: ((account: SocialAccount, platform: PlatType) => void) | null,
  ) => void
  /** 切换视图 */
  setCurrentView: (view: ChannelManagerView) => void
  /** 设置侧边栏选中的平台 */
  setSelectedPlatform: (platform: PlatType | 'all') => void
  /** 设置目标空间ID */
  setTargetSpaceId: (spaceId: string | null) => void
  /** 开始授权流程 */
  startAuth: (platform: PlatType, spaceId?: string) => Promise<void>
  /** 处理插件平台的授权（小红书、抖音等） */
  handlePluginPlatformAuth: (platform: PluginPlatformType, spaceId?: string) => Promise<void>
  /** 停止授权（取消/超时） */
  stopAuth: () => void
  /** 重新打开授权页面 */
  reopenAuthWindow: () => void
  /** 授权成功处理 */
  handleAuthSuccess: (account: SocialAccount) => void
  /** 重置状态 */
  reset: () => void
  /** 检查是否为新用户 */
  checkIsNewUser: () => void
}

/** 授权URL响应 */
export interface AuthUrlResponse {
  url: string
  taskId: string
}

/** 默认授权倒计时时间（秒） */
export const DEFAULT_AUTH_COUNTDOWN = 300

/** 轮询间隔（毫秒） */
export const POLLING_INTERVAL = 2000
