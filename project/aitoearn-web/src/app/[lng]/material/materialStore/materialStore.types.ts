/**
 * materialStore.types.ts - 素材库 Store 类型定义
 * 定义素材库页面所有相关的类型
 */

/**
 * 媒体资源元数据
 */
export interface MediaMetadata {
  /** 文件大小（字节） */
  size: number
  /** MIME 类型 */
  mimeType: string
}

/**
 * 媒体项类型（API 返回的完整结构）
 */
export interface MediaItem {
  _id: string
  userId: string
  userType: string
  groupId: string
  type: 'video' | 'img'
  /** 媒体资源 URL */
  url: string
  /** 缩略图 URL（视频封面/图片缩略图） */
  thumbUrl: string
  /** 文件标题 */
  title: string
  /** 描述 */
  desc: string
  /** 使用次数 */
  useCount: number
  /** 元数据 */
  metadata: MediaMetadata
  createdAt: string
  updatedAt: string
}

/**
 * 媒体资源组类型（API 返回的完整结构）
 */
export interface MediaGroup {
  _id: string
  userId: string
  userType: string
  /** 分组类型：视频或图片 */
  type: 'video' | 'img'
  /** 分组名称 */
  title: string
  /** 分组描述（API 可能不返回） */
  desc?: string
  /** 是否为默认分组 */
  isDefault?: boolean
  createdAt: string
  updatedAt: string
  /** 媒体列表信息（分组列表 API 返回） */
  mediaList?: {
    total: number
    list: MediaItem[]
  }

  // ===== 前端处理后添加的字段 =====
  /** 封面图片 URL（前端处理后） */
  cover?: string
  /** 资源数量（前端处理后） */
  count?: number
  /** 预览媒体（用于封面展示，前端处理后） */
  previewMedia?: {
    type: 'video' | 'img'
    url: string
    thumbUrl: string
  } | null
}

/**
 * 筛选类型
 */
export type FilterType = 'all' | 'video' | 'img'

/**
 * 创建/更新分组的数据类型
 */
export interface CreateGroupData {
  title: string
  desc: string
  type: 'video' | 'img'
}

/**
 * 更新分组的数据类型
 */
export interface UpdateGroupData {
  title?: string
  desc?: string
  type?: 'video' | 'img'
}

/**
 * materialStore 状态类型
 */
export interface IMaterialStore {
  // ===== 数据 =====
  /** 分组列表 */
  groups: MediaGroup[]
  /** 总数 */
  total: number
  /** 默认图片分组 */
  defaultImgGroup: MediaGroup | null
  /** 默认视频分组 */
  defaultVideoGroup: MediaGroup | null

  // ===== 加载状态 =====
  /** 列表加载中 */
  isLoading: boolean
  /** 提交中（创建/更新） */
  isSubmitting: boolean
  /** 删除中 */
  isDeleting: boolean

  // ===== 分页 =====
  /** 当前页码 */
  currentPage: number
  /** 每页数量 */
  pageSize: number

  // ===== 筛选 =====
  /** 类型筛选 */
  filterType: FilterType
  /** 搜索文本 */
  searchText: string

  // ===== 弹窗状态 =====
  /** 创建/编辑弹窗是否打开 */
  createModalOpen: boolean
  /** 正在编辑的分组（null 表示创建模式） */
  editingGroup: MediaGroup | null
}
