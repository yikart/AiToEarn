/*
 * @Description: AI Agent 内容生成任务接口
 */
import { fetchEventSource } from '@microsoft/fetch-event-source'
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
  taskId?: string // 可选，传入则继续上一次对话
  messageUuid?: string // 可选，重置到对应的消息继续
  includePartialMessages?: boolean // 使用流式消息
}

// 创建任务响应
export interface CreateTaskResponse {
  id: string
}

// Result type 类型
export type ResultType = 'imageOnly' | 'videoOnly' | 'fullContent'

// Result action 类型
export type ResultAction = 'draft' | 'publish' | 'createChannel' | 'updateChannel' | 'loginChannel' | 'platformNotSupported'

// Platform 枚举
export type Platform = 'douyin' | 'xhs' | 'wxSph' | 'KWAI' | 'youtube' | 'wxGzh' | 'bilibili' | 'twitter' | 'tiktok' | 'facebook' | 'instagram' | 'threads' | 'pinterest' | 'linkedin'

// Result 消息数据
export interface ResultData {
  taskId: string
  title: string
  description: string
  tags: string[]
  medias: Media[]
  type?: ResultType // 结果类型
  action?: ResultAction // 操作类型
  platform?: Platform // 平台类型
  accountType?: string[] // 账户类型数组，如 ['douyin', 'xhs']
}

// Result 消息
export interface ResultMessage {
  type: 'result'
  subtype?: string // 保留兼容性
  uuid: string
  duration_ms: number
  duration_api_ms: number
  is_error: boolean
  num_turns: number
  message: string
  result: ResultData
  total_cost_usd: number
  usage: any
  permission_denials: any[]
}

// Stream Event 类型
export interface StreamEvent {
  type: 'stream_event'
  uuid: string
  event: {
    type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop'
    index?: number
    content_block?: any
    delta?: {
      type: 'text_delta' | 'input_json_delta'
      text?: string
      partial_json?: string
    }
    message?: any
    usage?: any
  }
  parent_tool_use_id?: string | null
}

// SSE 消息类型
export interface SSEMessage {
  type: 'init' | 'keep_alive' | 'stream_event' | 'message' | 'status' | 'error' | 'done' | 'text' | 'result'
  taskId?: string
  message?: string | ResultMessage | StreamEvent
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
   * @returns 返回一个 abort 函数，用于中断 SSE 连接
   */
  async createTaskWithSSE(
    params: CreateTaskParams,
    onMessage: (message: SSEMessage) => void,
    onError: (error: Error) => void,
    onDone: (sessionId?: string) => void,
  ): Promise<() => void> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const url = `${'https://pr-211.preview.aitoearn.ai/api'}/agent/tasks`
    
    let sessionId: string | undefined
    let abortController = new AbortController()
    
    // 返回 abort 函数
    const abort = () => {
      abortController.abort()
    }

    console.log('[SSE] Starting fetchEventSource...')

    try {
      await fetchEventSource(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useUserStore.getState().token || ''}`,
        },
        body: JSON.stringify(params),
        signal: abortController.signal,
        
        // 当连接打开时
        async onopen(response) {
          console.log('[SSE] Connection opened, status:', response.status)
          
          if (response.ok) {
            return // 一切正常，继续处理消息
          }
          
          // 处理错误响应
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            // 客户端错误，不重试
            const errorText = await response.text()
            console.error('[SSE] Client error:', response.status, errorText)
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }
          else {
            // 服务器错误或其他问题，会自动重试
            console.error('[SSE] Server error:', response.status)
            throw new Error(`HTTP ${response.status}`)
          }
        },
        
        // 当收到消息时
        onmessage(event) {
          console.log('[SSE] Received message:', event)
          
          // 如果没有数据，跳过
          if (!event.data) {
            console.log('[SSE] Empty message, skipping')
            return
          }
          
          try {
            const data = JSON.parse(event.data)
            console.log('[SSE] Parsed data:', data)
            
            // 保存 sessionId
            if (data.sessionId) {
              sessionId = data.sessionId
              console.log('[SSE] Got sessionId:', sessionId)
            }
            
            // 调用消息回调
            onMessage(data)
            
            // 如果收到结束信号，关闭连接
            if (data.type === 'done' || data.type === 'error') {
              console.log('[SSE] Received end signal:', data.type)
              abortController.abort()
            }
          }
          catch (error) {
            console.error('[SSE] Failed to parse message:', event.data, error)
          }
        },
        
        // 当连接关闭时
        onclose() {
          console.log('[SSE] Connection closed')
          onDone(sessionId)
        },
        
        // 当发生错误时
        onerror(error) {
          console.error('[SSE] Error occurred:', error)
          
          // 如果是手动中止，不抛出错误
          if (abortController.signal.aborted) {
            console.log('[SSE] Connection aborted by user')
            return
          }
          
          // 其他错误，调用错误回调
          onError(error instanceof Error ? error : new Error(String(error)))
          
          // 抛出错误以停止重试
          throw error
        },
      })
    }
    catch (error) {
      console.error('[SSE] fetchEventSource failed:', error)
      
      // 如果不是手动中止的错误，调用错误回调
      if (!abortController.signal.aborted) {
        onError(error instanceof Error ? error : new Error(String(error)))
      }
    }
    
    // 返回 abort 函数
    return abort
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

  /**
   * 停止/取消任务
   * @param taskId 任务ID
   */
  async stopTask(taskId: string) {
    const res = await http.delete(`agent/tasks/${taskId}`)
    return res
  },
}

