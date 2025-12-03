/*
 * @Description: AI Agent 内容生成任务接口
 */
import http from '@/utils/request'
import { useUserStore } from '@/store/user'

// 任务状态枚举
export enum TaskStatus {
  Thinking = 'THINKING',
  Waiting = 'WAITING', // 等待
  GeneratingContent = 'GENERATING_CONTENT', // 内容生成中
  GeneratingImage = 'GENERATING_IMAGE', // 图片生成中
  GeneratingVideo = 'GENERATING_VIDEO', // 视频生成中
  GeneratingText = 'GENERATING_TEXT', // 文本生成中
  Completed = 'COMPLETED', // 完成
  Failed = 'FAILED', // 失败
  Cancelled = 'CANCELLED', // 取消
}

// 媒体类型
export enum MediaType {
  Video = 'VIDEO',
  Image = 'IMAGE',
}

// 媒体文件
export interface Media {
  type: MediaType
  url: string
  coverUrl?: string // 视频封面URL（可选）
}

// 任务详情
export interface TaskDetail {
  id: string
  userId: string
  prompt: string
  title: string
  description: string
  tags: string[]
  status: TaskStatus
  medias: Media[]
  errorMessage: string
  createdAt: string
}

// 创建任务请求参数
export interface CreateTaskParams {
  prompt: string
}

// 创建任务响应
export interface CreateTaskResponse {
  id: string
}

// SSE 消息类型
export interface SSEMessage {
  type: 'message' | 'status' | 'error' | 'done'
  message?: string
  sessionId?: string
  status?: TaskStatus
  data?: any
}

export const agentApi = {
  /**
   * 创建AI生成任务并通过 SSE 接收实时消息
   * @param params 
   * @param onMessage SSE 消息回调
   * @param onError 错误回调
   * @param onDone 完成回调
   */
  async createTaskWithSSE(
    params: CreateTaskParams,
    onMessage: (message: SSEMessage) => void,
    onError: (error: Error) => void,
    onDone: (sessionId?: string) => void,
  ) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const url = `${'https://pr-211.preview.aitoearn.ai/api'}/agent/tasks`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useUserStore.getState().token || ''}`,
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Response body is null')
      }

      let buffer = ''
      let sessionId: string | undefined

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          onDone(sessionId)
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              // 保存 sessionId
              if (data.sessionId) {
                sessionId = data.sessionId
              }

              onMessage(data)

              // 如果收到错误消息，停止处理
              if (data.type === 'error') {
                reader.cancel()
                return
              }
            }
            catch (e) {
              console.error('Failed to parse SSE message:', e)
            }
          }
        }
      }
    }
    catch (error) {
      onError(error as Error)
    }
  },

  /**
   * 创建AI生成任务（旧方法，保留兼容性）
   * @param params 
   */
  async createTask(params: CreateTaskParams) {
    const res = await http.post<CreateTaskResponse>('agent/tasks', params)
    return res
  },

  /**
   * 获取任务详情
   * @param taskId 任务ID
   */
  async getTaskDetail(taskId: string) {
    const res = await http.get<TaskDetail>(`agent/tasks/${taskId}`)
    return res
  },
}

