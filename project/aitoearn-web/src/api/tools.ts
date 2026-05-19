/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 22:21:01
 * @LastEditors: nevin
 * @Description: 工具
 */
import http from '@/utils/request'

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
