/**
 * Agent 素材类型定义
 * 定义 Agent 生成的图片/视频资源类型
 */

/**
 * Asset 类型枚举
 * - aiImage: AI 生成的图片
 * - aiVideo: AI 生成的视频
 * - aiCard: AI 生成的卡片
 * - aiChatImage: AI 聊天中生成的图片
 * - aideoOutput: AI 视频输出
 * - videoEdit: 视频编辑
 * - dramaRecap: 剧情回顾
 * - styleTransfer: 风格迁移
 */
export type AssetType
  = | 'aiImage'
    | 'aiVideo'
    | 'aiCard'
    | 'aiChatImage'
    | 'aideoOutput'
    | 'videoEdit'
    | 'dramaRecap'
    | 'styleTransfer'
    | string // 支持扩展其他类型

/**
 * Asset 元数据
 */
export interface AssetMetadata {
  /** 图片/视频宽度 */
  width?: number
  /** 图片/视频高度 */
  height?: number
  /** 视频时长（秒） */
  duration?: number
  /** 视频封面 URL */
  cover?: string
  /** 其他扩展字段 */
  [key: string]: unknown
}

/**
 * Asset 单项
 */
export interface AssetVo {
  /** 资源 ID */
  id: string
  /** 资源 URL */
  url: string
  /** 资源类型 */
  type: AssetType
  /** MIME 类型 */
  mimeType: string
  /** 文件名 */
  filename?: string
  /** 元数据 */
  metadata?: AssetMetadata
  /** 文件路径 */
  path?: string
  /** 文件大小（字节） */
  size?: number
  /** 状态 */
  status?: string
  /** 用户类型 */
  userType?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt?: string
  /** 用户 ID */
  userId?: string
}

/**
 * Asset 列表响应
 */
export interface AssetListVo {
  /** 当前页码 */
  page: number
  /** 每页数量 */
  pageSize: number
  /** 总数 */
  total: number
  /** 资源列表 */
  list: AssetVo[]
}

/**
 * 视频类型的 AssetType 列表
 */
export const VIDEO_ASSET_TYPES: AssetType[] = [
  'aiVideo',
  'aideoOutput',
  'videoEdit',
  'dramaRecap',
  'styleTransfer',
]

/**
 * 图片类型的 AssetType 列表
 */
export const IMAGE_ASSET_TYPES: AssetType[] = ['aiImage', 'aiCard', 'aiChatImage']
