/**
 * 浏览器插件模块统一导出
 */

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
export {
  usePlugin,
  usePluginLogin,
  usePluginPublish,
  usePluginWorkflow,
} from './hooks'

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

// Store
export { usePluginStore } from './store'

export type {
  ExecutePluginPublishParams,
  PlatformAccountsMap,
  PlatformProgressMap,
  PluginPublishItem,
} from './store'

// Types
export type {
  AIToEarnPluginAPI,
  OperationResult,
  PermissionCheckResult,
  PlatAccountInfo,
  PlatformPublishTask,
  PluginPlatformType,
  PluginStore,
  ProgressCallback,
  ProgressEvent,
  PublishParams,
  PublishResult,
  PublishTask,
  PublishTaskListConfig,
} from './types/baseTypes'

export {
  PlatformTaskStatus,
  PLUGIN_SUPPORTED_PLATFORMS,
  PluginStatus,
} from './types/baseTypes'
// Utils
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
