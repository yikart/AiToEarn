/**
 * 浏览器插件模块统一导出
 */

// Constants
export {
  DEFAULT_POLLING_INTERVAL,
  ERROR_MESSAGES,
  PLUGIN_STATUS_TEXT,
  PUBLISH_STAGE_TEXT,
} from './constants'

// Hooks
export {
  usePlugin,
  usePluginLogin,
  usePluginPublish,
  usePluginWorkflow,
} from './hooks'

// Store
export { usePluginStore } from './store'

// Types
export type {
  AIToEarnPluginAPI,
  OperationResult,
  PlatAccountInfo,
  PlatformType,
  PluginStore,
  ProgressCallback,
  ProgressEvent,
  PublishParams,
  PublishResult,
} from './types/types'

export { PluginStatus } from './types/types'

// Utils
export {
  formatFileSize,
  formatProgress,
  getPluginStatusText,
  getPublishStageText,
  isPluginConnected,
  isPluginNotInstalled,
  isValidImageFile,
  isValidVideoFile,
  validateFileSize,
  validateFileType,
  withRetry,
} from './utils'
