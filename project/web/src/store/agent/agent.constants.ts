/**
 * Agent Store - 常量定义
 * 状态配置、进度配置等常量
 */

/** 状态显示配置 */
export const STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  THINKING: { text: 'thinking', color: '#a66ae4' },
  WAITING: { text: 'waiting', color: '#b78ae9' },
  GENERATING_CONTENT: { text: 'generatingContent', color: '#a66ae4' },
  GENERATING_IMAGE: { text: 'generatingImage', color: '#8b4fd9' },
  GENERATING_VIDEO: { text: 'generatingVideo', color: '#9558de' },
  GENERATING_TEXT: { text: 'generatingText', color: '#a66ae4' },
  COMPLETED: { text: 'completed', color: '#52c41a' },
  FAILED: { text: 'failed', color: '#ff4d4f' },
  CANCELLED: { text: 'cancelled', color: '#8c8c8c' },
}

/** 基础进度配置 */
export const BASE_PROGRESS: Record<string, number> = {
  THINKING: 10,
  WAITING: 20,
  GENERATING_CONTENT: 30,
  GENERATING_TEXT: 40,
  GENERATING_IMAGE: 50,
  GENERATING_VIDEO: 60,
  COMPLETED: 100,
}

/** 生成中的状态列表 */
export const GENERATING_STATUSES = [
  'GENERATING_CONTENT',
  'GENERATING_IMAGE',
  'GENERATING_VIDEO',
  'GENERATING_TEXT',
]

