/*
 * @Author: nevin
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: nevin
 * @Description: TikTok模块常量定义
 */

// 时间常量（秒）
export const TIKTOK_TIME_CONSTANTS = {
  AUTH_TASK_EXPIRE: 5 * 60, // 认证任务过期时间：5分钟
  AUTH_TASK_EXTEND: 3 * 60, // 认证任务延长时间：3分钟
  TOKEN_EXPIRE_BUFFER: 10 * 60, // token过期缓冲时间：10分钟
  TOKEN_REFRESH_THRESHOLD: 15 * 60, // token刷新阈值：15分钟
} as const

// 默认权限范围
export const TIKTOK_DEFAULT_SCOPES = [
  'user.info.basic',
  'user.info.profile',
  'video.upload',
  'video.publish',
  'user.info.stats',
  'video.list',
]
