/**
 * 浏览器插件相关常量定义
 */

/**
 * 默认轮询间隔（毫秒）
 */
export const DEFAULT_POLLING_INTERVAL = 2000

/**
 * 插件状态文本映射
 */
export const PLUGIN_STATUS_TEXT = {
  UNKNOWN: '未检测',
  CHECKING: '检测中...',
  CONNECTED: '已连接',
  NOT_INSTALLED: '未安装',
} as const

/**
 * 发布阶段文本映射
 */
export const PUBLISH_STAGE_TEXT = {
  download: '下载资源',
  upload: '上传文件',
  publish: '发布中',
  complete: '完成',
  error: '错误',
} as const

/**
 * 错误消息
 */
export const ERROR_MESSAGES = {
  PLUGIN_NOT_INSTALLED: '请先安装 AIToEarn 浏览器插件',
  PUBLISHING_IN_PROGRESS: '当前正在发布中，请稍后再试',
  LOGIN_FAILED: '登录失败',
  PUBLISH_FAILED: '发布失败',
} as const
