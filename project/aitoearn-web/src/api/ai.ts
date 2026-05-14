import type { AdaptMaterialDto, MaterialAdaptationVo } from './types/ai'
import type { AssetListVo } from '@/types/agent-asset'
import { useUserStore } from '@/store/user'
import http from '@/utils/request'

// 获取聊天大模型列表
export function getChatModels() {
  return http.get('ai/models/chat')
}

// 保存用户AI配置项（设置默认模型等）
export function putUserAiConfigItem(data: {
  type: 'agent' | 'edit' | 'image' | 'video'
  value: {
    defaultModel: string
    option?: Record<string, any>
    [key: string]: any
  }
  [key: string]: any
}) {
  return http.put('user/ai/config/item', data)
}

// 文生图 - 异步接口
export function generateImage(data: {
  prompt: string
  model?: string
  n?: number
  quality?: 'standard' | 'hd'
  response_format?: 'url' | 'b64_json'
  size?: string
  style?: 'vivid' | 'natural'
  user?: string
}) {
  return http.post('ai/image/generate/async', data)
}

// 查询图片任务状态
export function getImageTaskStatus(logId: string) {
  return http.get(`ai/image/task/${logId}`)
}

// 获取图片生成模型参数
export function getImageGenerationModels() {
  return http.get('ai/models/image/generation')
}

// 获取图片编辑模型参数
export function getImageEditModels() {
  return http.get('ai/models/image/edit')
}

// 获取视频生成模型参数
export function getVideoGenerationModels() {
  return http.get('ai/models/video/generation')
}

// 视频生成
export function generateVideo(data: {
  model: string
  prompt: string
  image?: any
  image_tail?: string
  size?: string
  duration?: number
  metadata?: Record<string, any>
}) {
  // if (data.image) {
  //   if (typeof data.image === 'string') {
  //     data.image = getOssUrl(data.image);
  //   } else {
  //     data.image = data.image.map((item: any) => getOssUrl(item));
  //   }
  // }
  // if (data.image_tail) {
  //   data.image_tail = getOssUrl(data.image_tail);
  // }
  return http.post('ai/video/generations', data)
}

// 查询视频任务状态
export function getVideoTaskStatus(taskId: string) {
  return http.get(`ai/video/generations/${taskId}`)
}

// 获取视频生成历史记录
export function getVideoGenerations(params?: { page?: number, pageSize?: number }) {
  return http.get('ai/video/generations', params)
}

// 保留旧的接口以保持向后兼容性（可选）
// 文生图 - 旧接口（已废弃）
export function textToImage(data: {
  prompt: string
  width: number
  height: number
  sessionIds: string[]
}) {
  return http.post('tools/ai/jm/task', data)
}

// 获取文生图任务结果 - 旧接口（已废弃）
export function getTextToImageTaskResult(id: string) {
  return http.get<{
    imgList: string[]
    status: string
    taskId: string
  }>(`tools/ai/jm/task/${id}`)
}

// AI回复评论
export function createAiReplyTask(data: {
  accountId: string
  postId: string
  prompt: string
  platform: string
  model: string
}) {
  return http.post('channel/engagement/comment/ai/replies/tasks', data)
}

// 图片编辑 - 异步接口
export function editImage(data: {
  model: string
  image: string[]
  prompt: string
  mask?: string
  n?: number
  size?: string
  response_format?: 'url' | 'b64_json'
  user?: string
}) {
  return http.post('ai/image/edit/async', data)
}

// 查询图片编辑任务状态
export function getImageEditTaskStatus(logId: string) {
  return http.get(`ai/image/task/${logId}`)
}

// 获取用户使用日志
export function getLogs(params?: {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}) {
  return http.get('ai/logs', params)
}

// AI聊天接口 - 支持流式和非流式响应
export async function aiChatStream(data: {
  messages: Array<{ role: string, content: string }>
  stream?: boolean
  model?: string
  temperature?: number
  presence_penalty?: number
  frequency_penalty?: number
  top_p?: number
  max_tokens?: number
}) {
  const token = useUserStore.getState().token
  const lang = useUserStore.getState().lang

  // 使用环境变量，保持 SSR 兼容性与 request.ts 一致
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const response = await fetch(`${apiBaseUrl}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept-Language': lang || 'en',
    },
    body: JSON.stringify({
      stream: false, // 使用非流式响应
      model: 'gpt-5.1-all',
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1,
      max_tokens: 8000, // 增加到8000以支持更长的响应（包括base64图片）
      ...data,
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response
}

/**
 * 获取 Agent 生成的素材列表
 * @param params - 分页参数
 * @returns 素材列表
 */
export function getAgentAssets(params?: { page?: number, pageSize?: number }) {
  return http.get<AssetListVo>('ai/assets', params)
}

/**
 * 适配素材到指定平台
 * 调用 AI 生成针对目标平台优化的标题、描述和话题
 * @param data - 素材 ID 和目标平台列表
 * @returns 适配后的素材内容
 */
export function apiAdaptMaterial(data: AdaptMaterialDto) {
  return http.post<MaterialAdaptationVo[]>('ai/material-adaptation', data)
}
