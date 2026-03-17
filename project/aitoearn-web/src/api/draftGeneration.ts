/**
 * AI 草稿批量生成 API
 * 包含创建批量生成任务、查询生成状态统计、获取生成任务列表
 */

import type { DraftGenerationPricingVo } from '@/api/types/draftGeneration'
import http from '@/utils/request'

// ==================== 类型定义 ====================

/** 生成任务状态 */
export type DraftTaskStatus = 'generating' | 'success' | 'failed'

/** 生成任务 response 数据 */
export interface DraftGenerationResponse {
  materialId: string
  title: string
  description: string
  topics: string[]
  videoUrl?: string
  coverUrl?: string
  imageUrls?: string[]
}

/** 生成任务详情 */
export interface DraftGenerationTask {
  id: string
  status: DraftTaskStatus
  points: number
  errorMessage?: string
  response?: DraftGenerationResponse
  createdAt: string
  updatedAt: string
}

/** 生成状态统计 */
export interface DraftGenerationStats {
  generatingCount: number
}

/** 创建批量生成任务返回值 */
export interface CreateDraftGenerationVo {
  taskIds: string[]
}

/** 生成任务列表返回值 */
export interface DraftGenerationTaskListVo {
  page: number
  pageSize: number
  totalPages: number
  total: number
  list: DraftGenerationTask[]
}

// ==================== API 调用 ====================

/** 视频生成模型类型 */
export type VideoModelType = string

/** 图片生成模型类型 */
export type ImageModelType = string

/** 草稿内容类型 */
export type DraftContentType = 'video' | 'image_text'

/** 创建 AI 批量生成草稿任务 */
export function apiCreateDraftGeneration(data: {
  quantity: number
  groupId: string
  model: VideoModelType
  prompt?: string
  imageUrls?: string[]
  videoUrls?: string[]
  duration?: number
  aspectRatio?: string
  platforms?: string[]
}) {
  return http.post<CreateDraftGenerationVo>('ai/draft-generation/v2', data)
}

/** 创建 AI 图文草稿生成任务 */
export function apiCreateImageTextDraft(data: {
  quantity: number
  groupId: string
  prompt: string
  imageModel: ImageModelType
  imageCount?: number
  imageUrls?: string[]
  aspectRatio?: string
  imageSize?: string
  platforms?: string[]
}) {
  return http.post<CreateDraftGenerationVo>('ai/draft-generation/image-text', data)
}

/** 获取图片模型定价信息 */
export function apiGetDraftGenerationPricing() {
  return http.get<DraftGenerationPricingVo>('ai/draft-generation/pricing')
}

/**
 * 获取生成中任务数量统计（轮询用，静默模式不弹错误提示）
 */
export function apiGetDraftGenerationStats() {
  return http.get<DraftGenerationStats>('ai/draft-generation/stats', undefined, true)
}

/**
 * 获取生成任务列表（分页）
 * @param page 页码
 * @param pageSize 每页数量
 */
export function apiGetDraftGenerationList(page: number = 1, pageSize: number = 10) {
  return http.get<DraftGenerationTaskListVo>(
    'ai/draft-generation/',
    { page, pageSize },
  )
}
