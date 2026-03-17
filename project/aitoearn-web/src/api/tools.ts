import type { AiCreateType } from './types/tools'
/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 22:21:01
 * @LastEditors: nevin
 * @Description: 工具
 */
import http from '@/utils/request'

export const toolsApi = {
  /**
   * 获取智能标题
   * @param url
   * @param type 1=标题 2=描述
   * @param max
   */
  async apiVideoAiTitle(url: string, type: AiCreateType, max: number) {
    const res = await http.post<string>('tools/ai/video/title', {
      url,
      type,
      max: max - 10,
    })
    return res!.data
  },

  /**
   * 智能图文
   */
  async apiReviewImgAi(data: { imgUrl: string, title?: string, desc?: string, max?: number }) {
    const res = await http.post<string>('tools/ai/reviewImg', data)
    return res!.data
  },

  /**
   * 智能评论
   */
  async apiReviewAi(data: { title: string, desc?: string, max?: number }) {
    const res = await http.post<string>('tools/ai/review', data)
    return res!.data
  },

  /**
   * 智能评论回复
   */
  async apiReviewAiRecover(data: { content: string, title?: string, desc?: string, max?: number }) {
    const res = await http.post<string>('tools/ai/recover/review', data)
    return res!.data
  },

  /**
   * 生成AI的html图文 弃用: 时间太长得走sse
   */
  async aiArticleHtml(content: string) {
    const res = await http.post<string>('tools/ai/article/html', {
      content,
    })
    return res!.data
  },

  // TODO: sse生成AI的html图文

  /**
   * 文本内容安全
   */
  async textModeration(content: string) {
    const res = await http.post<string>('aliGreen/textGreen', {
      content,
    })
    return res
  },
}

// ==================== 二维码艺术图 ====================

export interface GenerateQrCodeArtParams {
  content: string
  referenceImageUrl?: string
  prompt: string
  model?: string
  size?: string
}

export interface GenerateQrCodeArtResult {
  logId: string
  status: string
}

export interface CreateQrCodeArtImageParams {
  relId: string
  relType: string
  logId: string
  content: string
  referenceImageUrl?: string
  prompt: string
  model: string
  size?: string
  status: string
  imageUrl?: string
}

export interface QrCodeArtImage {
  id: string
  relId: string
  relType: string
  logId: string
  content: string
  referenceImageUrl?: string
  prompt: string
  model: string
  size?: string
  status: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface QrCodeArtImageList {
  list: QrCodeArtImage[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function apiGenerateQrCodeArt(data: GenerateQrCodeArtParams) {
  return http.post<GenerateQrCodeArtResult>('tools/qrcode-art/generate', data)
}

export function apiCreateQrCodeArtImage(data: CreateQrCodeArtImageParams) {
  return http.post<QrCodeArtImage>('tools/qrcode-art/images', data)
}

export function apiListQrCodeArtImages(params: {
  relId: string
  relType: string
  page?: number
  pageSize?: number
}) {
  return http.get<QrCodeArtImageList>('tools/qrcode-art/images', params)
}

export function apiGetQrCodeArtImageById(id: string) {
  return http.get<QrCodeArtImage>(`tools/qrcode-art/images/${id}`)
}

export interface QrCodeArtTaskStatus {
  logId: string
  status: string
  startedAt: string
  duration?: number
  points: number
  images?: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export function apiGetQrCodeArtTaskStatus(logId: string) {
  return http.get<QrCodeArtTaskStatus>('tools/qrcode-art/task/status', { logId })
}
