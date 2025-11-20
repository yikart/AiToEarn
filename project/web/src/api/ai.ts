import { getOssUrl } from '@/utils/oss'
import http from '@/utils/request'
import { useUserStore } from '@/store/user'

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

// 流光卡片生成 - 新的接口
export function generateFireflyCard(data: {
  content: string
  temp?: string
  title?: string
  style?: {
    align?: string
    backgroundName?: string
    backShadow?: string
    font?: string
    width?: number
    ratio?: string
    height?: number
    fontScale?: number
    padding?: string
    borderRadius?: string
    color?: string
    opacity?: number
    blur?: number
    backgroundAngle?: string
    lineHeights?: {
      content?: string
      title?: string
    }
  }
}) {
  return http.post('ai/fireflycard', data)
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
  mode?: string
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
export function getVideoGenerations(params?: {
  page?: number
  pageSize?: number
}) {
  return http.get('ai/video/generations', { params })
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

// 文生图文（流光卡片）- 旧接口（已废弃）
export function textToFireflyCard(data: {
  content: string
  temp: string
  title: string
}) {
  return http.post('tools/ai/fireflycard', data)
}

// Markdown转卡片图片
export function generateMd2Card(data: {
  markdown: string
  theme: string
  themeMode?: string
  width?: number
  height?: number
  splitMode?: string
  mdxMode?: boolean
  overHiddenMode?: boolean
}) {
  return http.post('ai/md2card', data)
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
  
  const response = await fetch('https://aitoearn.ai/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept-Language': lang || 'zh-CN',
    },
    body: JSON.stringify({
      stream: false, // 使用非流式响应 
      model: 'gemini-3-pro-preview',
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