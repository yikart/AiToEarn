/**
 * 浏览器插件模块统一导出
 */

// Utils
export { getWxSphLoginStatus, getXhsLoginStatus, isPluginPlatformAccountReady } from './account.utils'

// Constants
export {
  DEFAULT_POLLING_INTERVAL,
  ERROR_MESSAGE_I18N_KEY,
  PLUGIN_DOWNLOAD_LINKS,
  PLUGIN_STATUS_I18N_KEY,
  PUBLISH_STAGE_I18N_KEY,
  TASK_STATUS_I18N_KEY,
} from './constants'

// Hooks
export { usePlugin, usePluginLogin, usePluginPublish, usePluginWorkflow } from './hooks'

// Platform Interaction (平台交互模块 - 点赞、评论、收藏等)
export { douyinInteraction, platformManager, xhsInteraction } from './plats'
export type {
  BaseResult,
  CommentParams,
  CommentResult,
  FavoriteResult,
  IPlatformInteraction,
  LikeResult,
  SupportedPlatformType,
} from './plats'
export { proxyRequest } from './request'

// Store
export { usePluginStore } from './store'

export type { ExecutePluginPublishParams, PlatformAccountsMap, PlatformProgressMap, PluginPublishItem } from './store'

// Types
export type {
  AIToEarnPluginAPI,
  OperationResult,
  PermissionCheckResult,
  PlatAccountInfo,
  PlatformPublishTask,
  PluginPlatformType,
  PluginProxyRequestParams,
  PluginProxyResponse,
  PluginStore,
  ProgressCallback,
  ProgressEvent,
  PublishParams,
  PublishResult,
  PublishTask,
  PublishTaskListConfig,
  WxSphEventInfo,
  WxSphLinkAnchor,
  WxSphLocationItem,
  WxSphLocationSearchParams,
  WxSphLoginStatus,
  WxSphStartLinkPollingParams,
  WxSphStartLinkPollingResult,
  XhsLoginStatus,
} from './types/baseTypes'

export {
  PlatformTaskStatus,
  PLUGIN_SUPPORTED_PLATFORMS,
  PluginStatus,
  WX_SPH_LOGIN_EXPIRED_CODE,
} from './types/baseTypes'
export {
  formatFileSize,
  formatProgress,
  getPluginStatusI18nKey,
  getPublishStageI18nKey,
  isPluginConnected,
  isPluginInstalledNoPermission,
  isPluginNotInstalled,
  isPluginReady,
  isValidImageFile,
  isValidVideoFile,
  validateFileSize,
  validateFileType,
  withRetry,
} from './utils'
