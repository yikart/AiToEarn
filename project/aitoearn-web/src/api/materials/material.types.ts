import type { MaterialMedia } from '../_shared/material.types'
import type { DraftGenerationRequest, ImageTextDraftType, VideoDraftType } from '@/api/ai/ai.types'
import type { PlatType } from '@/app/config/platConfig'
import type { PubType } from '@/app/config/publishConfig'

// Source: types/assets.ts

/**
 * ThumbnailVo 响应数据。
 */
export interface ThumbnailVo {
  thumbnailUrl: string
}

// Source: types/oss.ts

/**
 * UploadToOssOptions 数据结构。
 */
export interface UploadToOssOptions {
  onProgress?: (prog: number) => void
  publicUploadId?: string
  signal?: AbortSignal
}

/**
 * UploadSignData 数据结构。
 */
export interface UploadSignData {
  id: string
  url: string
  uploadUrl: string
}

/**
 * ConfirmUploadData 数据结构。
 */
export interface ConfirmUploadData {
  url?: string
}

// Source: types/media.ts

/**
 * MediaMetadata 类型。
 */
export interface MediaMetadata {
  size: number

  mimeType: string

  duration?: number
}

/**
 * MediaItem 数据结构。
 */
export interface MediaItem {
  _id: string
  userId: string
  userType: string
  groupId: string
  type: 'video' | 'img'

  url: string

  thumbUrl: string

  title: string

  desc: string

  useCount: number

  metadata: MediaMetadata
  createdAt: string
  updatedAt: string
}

/**
 * MediaGroup 类型。
 */
export interface MediaGroup {
  _id: string
  userId: string
  userType: string

  type: 'video' | 'img'

  title: string

  desc?: string

  isDefault?: boolean
  createdAt: string
  updatedAt: string

  mediaList?: {
    total: number
    list: MediaItem[]
  }

  // ===== 前端处理后添加的字段 =====

  cover?: string

  count?: number

  previewMedia?: {
    type: 'video' | 'img'
    url: string
    thumbUrl: string
  } | null
}

// Source: types/material.ts

/**
 * MaterialGroupUseScene 类型。
 */
export type MaterialGroupUseScene = string

/**
 * CreateMaterialGroupParams 请求参数。
 */
export interface CreateMaterialGroupParams {
  name: string
  desc?: string
  platforms?: PlatType[]
  useScene?: MaterialGroupUseScene
  useSceneRelId?: string
}

/**
 * MaterialGroupListFilters 类型。
 */
export interface MaterialGroupListFilters {
  title?: string
  useScene?: MaterialGroupUseScene
  useSceneRelId?: string
}

/**
 * MaterialGroupSceneVo 响应数据。
 */
export interface MaterialGroupSceneVo {
  id: string
  name: string
  useScene?: MaterialGroupUseScene
  useSceneRelId?: string
}

/**
 * PlanStatistics 数据结构。
 */
export interface PlanStatistics {
  materialCount: number
  publishCount: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  favoriteCount: number
}

/**
 * PromotionPlan 类型。
 */
export interface PromotionPlan {
  id: string
  name: string
  title?: string
  type: PubType
  platform?: PlatType
  desc?: string
  createdAt?: string
  updatedAt?: string
  mediaCount?: number
  isDefault?: boolean
  useScene?: MaterialGroupUseScene
  useSceneRelId?: string
  statistics?: PlanStatistics
}

/**
 * MaterialGenerationParams 请求参数。
 */
export interface MaterialGenerationParams extends DraftGenerationRequest {
  platforms?: PlatType[]
  draftType?: VideoDraftType | ImageTextDraftType
  videoUrls?: string[]
  audioUrls?: string[]
}

/**
 * PromotionMaterial 类型。
 */
export interface PromotionMaterial {
  id: string
  groupId: string
  title: string
  desc?: string
  coverUrl?: string
  mediaList: MaterialMedia[]
  type?: PubType
  status: 0 | 1
  location?: [number, number]
  option?: Record<string, unknown>
  createdAt?: string
  useCount?: number
  useCountByAccountType?: Partial<Record<PlatType, number>>
  maxUseCount?: number
  maxUseCountByAccountType?: Partial<Record<PlatType, number>>
  topics?: string[]
  model?: string
  generationParams?: MaterialGenerationParams
  accountTypes?: string[]
}

/**
 * PublishRecord 数据结构。
 */
export interface PublishRecord {
  id: string
  materialGroupId: string
  dataId: string
  accountId: string
  accountType: string
  uid: string
  title: string
  desc: string
  coverUrl: string
  videoUrl: string
  imgUrlList?: string[]
  workLink: string
  publishTime: string
  status: number
  createdAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  favoriteCount: number
  insightUpdatedAt: string
  platformName?: string
  platformIcon?: string
}

/**
 * 素材分页信息。
 */
export interface MaterialPagination {
  current: number
  pageSize: number
  total: number
  hasMore: boolean
}

/**
 * TransferMediaParams 请求参数。
 */
export interface TransferMediaParams {
  ids: string[]
  targetGroupId: string
  mode: 'move' | 'copy'
}

/**
 * MaterialListFilters 类型。
 */
export interface MaterialListFilters {
  title?: string
  useCount?: number
}

/**
 * MaterialFilterDeleteParams 请求参数。
 */
export interface MaterialFilterDeleteParams {
  title?: string
  groupId?: string
  useCount?: number
}

/**
 * TransferMaterialParams 请求参数。
 */
export interface TransferMaterialParams {
  ids: string[]
  targetGroupId: string
  mode: 'move' | 'copy'
}

/**
 * 公开推广码最优素材响应数据。
 */
export interface OptimalMaterialVo {
  _id: string
  groupId?: string
  title?: string
  desc?: string
  topics?: string[]
  coverUrl?: string
  mediaList?: MaterialMedia[]
  useCount: number
  useCountByAccountType?: Partial<Record<PlatType, number>>
  maxUseCount?: number
  maxUseCountByAccountType?: Partial<Record<PlatType, number>>
  option: any
  platform: PlatType
}

/**
 * 公开素材接口响应包装。
 */
export type MaterialOpenApiResponse<T> = {
  code: string | number
  data: T
  message: string
  url: string
} | null

/**
 * 按使用场景查询素材组请求参数。
 */
export interface GetMaterialGroupBySceneParams {
  useScene: MaterialGroupUseScene
  useSceneRelId: string
}

/**
 * 按使用场景查询素材组原始响应数据。
 */
export type MaterialGroupBySceneData = MaterialGroupSceneVo | MaterialGroupSceneVo[] | null

/**
 * 素材转移结果。
 */
export interface TransferMediaResult {
  count: number
}

/**
 * 媒体列表查询参数。
 */
export interface MediaListFilters {
  groupId?: string
  materialGroupId?: string
}

/**
 * 媒体列表响应。
 */
export interface MediaListResponse {
  list: MediaItem[]
  total: number
}

/**
 * 创建素材组响应。
 */
export interface CreateMaterialGroupVo {
  id: string
}

/**
 * 素材组更新请求参数。
 */
export interface UpdateMaterialGroupParams {
  name?: string
}

/**
 * 素材组列表响应。
 */
export interface MaterialGroupListVo {
  list: PromotionPlan[]
  total: number
}

/**
 * 创建草稿请求参数。
 */
export interface CreateMaterialParams {
  groupId: string
  coverUrl?: string
  mediaList: MaterialMedia[]
  title: string
  desc?: string
  topics?: string[]
  type: PubType
  option?: Record<string, unknown>
  location?: number[]
  accountTypes?: string[]
  maxUseCountByAccountType?: Partial<Record<PlatType, number>>
}

/**
 * 素材列表查询参数。
 */
export interface MaterialListQueryParams {
  groupId: string
  title?: string
  useCount?: number
}

/**
 * 素材列表响应。
 */
export interface MaterialListVo {
  list: PromotionMaterial[]
  total: number
}

/**
 * 更新草稿请求参数。
 */
export interface UpdateMaterialParams {
  coverUrl?: string
  mediaList?: MaterialMedia[]
  title?: string
  desc?: string
  topics?: string[]
  location?: number[]
  option?: Record<string, unknown>
  accountTypes?: string[]
  maxUseCountByAccountType?: Partial<Record<PlatType, number>>
}
