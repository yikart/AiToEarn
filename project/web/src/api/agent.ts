/*
 * @Description: AI Agent 内容生成任务接口
 */
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useAgentStore } from '@/store/agent'
import { useUserStore } from '@/store/user'
import http from '@/utils/request'

// 任务状态枚举
export enum TaskStatus {
  Thinking = 'THINKING',
  Waiting = 'WAITING', // 等待
  GeneratingContent = 'GENERATING_CONTENT', // 内容生成中
  GeneratingImage = 'GENERATING_IMAGE', // 图片生成中
  GeneratingVideo = 'GENERATING_VIDEO', // 视频生成中
  GeneratingText = 'GENERATING_TEXT', // 文本生成中
  Running = 'running', // 运行中
  Completed = 'COMPLETED', // 完成
  RequiresAction = 'requires_action', // 需要用户操作（如绑定频道等）
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
  updatedAt: string
  messages?: TaskMessage[]
  rating?: number | null
  ratingComment?: string | null
}

// 任务消息类型
export interface TaskMessage {
  type: 'user' | 'assistant' | 'result' | 'system' | 'stream_event'
  uuid?: string
  message?: any
  content?: string | any[]
  parent_tool_use_id?: string | null
  subtype?: string
}

// 任务列表项
export interface TaskListItem {
  id: string
  userId: string
  /** 任务标题 */
  title?: string
  /** 任务创建时间 */
  createdAt: string
  /** 任务最近更新时间 */
  updatedAt: string
  /** 任务状态（后端英文原始状态字符串，直接展示） */
  status?: string
  /** 任务评分（1-5） */
  rating?: number | null
  /** 任务评价文本 */
  ratingComment?: string | null
}

// 任务列表响应
export interface TaskListResponse {
  page: number
  pageSize: number
  totalPages: number
  total: number
  list: TaskListItem[]
}

// 创建任务请求参数
export interface CreateTaskParams {
  prompt: string | any[] // 支持字符串或 Claude Prompt 格式数组
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

// 任务增量消息响应
export interface TaskMessagesVo {
  messages: TaskMessage[]
  status?: TaskStatus // 任务状态，可选
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const url = `${apiUrl}/agent/tasks`

    let sessionId: string | undefined
    const abortController = new AbortController()
    // 用于消息去重，防止重复处理
    const processedMessageIds = new Set<string>()
    // 标记是否已经完成，防止重复调用 onDone
    let isCompleted = false

    // 返回 abort 函数
    const abort = () => {
      abortController.abort()
    }

    console.log('[SSE] Starting fetchEventSource...')

    // Debug replay interception: if debugReplayActive is enabled in the store,
    // replay events from a local .txt file instead of opening a network SSE.
    try {
      const debugActive = useAgentStore.getState().debugReplayActive
      if (debugActive) {
        console.log('[SSE] Debug replay active - replaying from public .txt')
        const abortController = { aborted: false }
        let isAborted = false
        const abort = () => {
          isAborted = true
          abortController.aborted = true
        }

        (async () => {
          // try common paths
          const candidates = ['/en/agentTasks_api.txt']
          let raw = ''
          for (const p of candidates) {
            try {
              const resp = await fetch(p)
              if (!resp.ok)
                continue
              raw = await resp.text()
              break
            }
            catch (e) {
              // continue
            }
          }
          if (!raw) {
            console.warn('[SSE] Debug replay: no local file found to replay')
            onDone?.()
            return
          }

          const blocks = raw.split(/\r?\n\r?\n+/).map(b => b.trim()).filter(Boolean)
          for (let i = 0; i < blocks.length; i++) {
            if (isAborted)
              break
            const block = blocks[i]
            const dataLine = block.split(/\r?\n/).find(l => l.startsWith('data:'))
            if (!dataLine)
              continue
            const jsonPart = dataLine.replace(/^data:\s*/, '')
            try {
              const data = JSON.parse(jsonPart)
              // call callback
              onMessage(data as any)
            }
            catch (e) {
              console.warn('[SSE] Debug replay: failed to parse block', e)
            }
            // small delay between events to simulate streaming
            await new Promise(r => setTimeout(r, 40))
          }

          if (!isAborted) {
            onDone?.()
          }
        })()

        return abort
      }
    }
    catch (e) {
      console.warn('[SSE] Debug replay check failed', e)
    }

    try {
      // 获取语言设置
      const lng = useUserStore.getState().lang || 'zh-CN'

      await fetchEventSource(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useUserStore.getState().token || ''}`,
          'Accept-Language': lng,
        },
        body: JSON.stringify(params),
        signal: abortController.signal,
        openWhenHidden: true,

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
            // 服务器错误或其他问题，不自动重试，直接抛出错误
            console.error('[SSE] Server error:', response.status)
            throw new Error(`HTTP ${response.status}`)
          }
        },

        // 当收到消息时
        onmessage(event) {
          // 如果已完成，忽略后续消息
          if (isCompleted) {
            console.log('[SSE] Already completed, ignoring message')
            return
          }

          console.log('[SSE] Received message:', event)

          // 如果没有数据，跳过
          if (!event.data) {
            console.log('[SSE] Empty message, skipping')
            return
          }

          try {
            const data = JSON.parse(event.data)
            console.log('[SSE] Parsed data:', data)

            // 消息去重：基于 uuid 或生成唯一标识
            const messageId = data.uuid || data.message?.uuid || `${data.type}-${JSON.stringify(data).slice(0, 100)}`
            if (processedMessageIds.has(messageId)) {
              console.log('[SSE] Duplicate message, skipping:', messageId)
              return
            }
            processedMessageIds.add(messageId)

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
              isCompleted = true
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
          if (!isCompleted) {
            isCompleted = true
            onDone(sessionId)
          }
        },

        // 当发生错误时
        onerror(error) {
          console.error('[SSE] Error occurred:', error)

          // 如果是手动中止，不抛出错误
          if (abortController.signal.aborted) {
            console.log('[SSE] Connection aborted by user')
            return
          }

          // 标记为已完成，防止重复处理
          if (!isCompleted) {
            isCompleted = true
            // 其他错误，调用错误回调
            onError(error instanceof Error ? error : new Error(String(error)))
          }

          // 抛出错误以停止重试
          throw error
        },
      })
    }
    catch (error) {
      console.error('[SSE] fetchEventSource failed:', error)

      // 如果不是手动中止的错误且未完成，调用错误回调
      if (!abortController.signal.aborted && !isCompleted) {
        isCompleted = true
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
   * 获取任务消息（增量）
   * @param taskId 任务ID
   * @param lastMessageId 上次获取的最后一条消息 UUID，可选
   */
  async getTaskMessages(taskId: string, lastMessageId?: string) {
    const params = lastMessageId ? { lastMessageId } : undefined
    const res = await http.get<TaskMessagesVo>(`agent/tasks/${taskId}/messages`, params)
    return res
  },

  /**
   * 获取任务评分
   * @param taskId 任务ID
   */
  async getTaskRating(taskId: string) {
    const res = await http.get<{ data: { rating?: number | null, comment?: string | null } }>(`agent/tasks/${taskId}/rating`)
    return res
  },

  /**
   * 提交或更新任务评分
   * @param taskId 任务ID
   * @param payload { rating: number, comment?: string }
   */
  async submitTaskRating(taskId: string, payload: { rating: number, comment?: string }) {
    const res = await http.post(`agent/tasks/${taskId}/rating`, payload)
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

  /**
   * 中断内容生成任务
   * @param taskId 任务ID
   */
  async abortTask(taskId: string) {
    const res = await http.post(`agent/tasks/${taskId}/abort`)
    return res
  },

  /**
   * 获取任务列表
   * @param page 页码，默认1
   * @param pageSize 每页数量，默认10
   */
  async getTaskList(page = 1, pageSize = 10) {
    const res = await http.get<TaskListResponse>('agent/tasks', { page, pageSize })
    return res
  },

  /**
   * 删除任务
   * @param taskId 任务ID
   */
  async deleteTask(taskId: string) {
    const res = await http.delete(`agent/tasks/${taskId}`)
    return res
  },

  /**
   * 更新任务标题
   * @param taskId 任务ID
   * @param title 新标题
   */
  async updateTaskTitle(taskId: string, title: string) {
    const res = await http.patch(`agent/tasks/${taskId}`, { title })
    return res
  },
  /**
   * 为任务创建或更新评分
   * @param taskId 任务ID
   * @param rating 评分值（1-5）
   * @param comment 可选评论
   */
  async createRating(taskId: string, rating: number, comment?: string) {
    const res = await http.post(`agent/tasks/${taskId}/rating`, { rating, comment })
    return res
  },
  /**
   * Create a public share token for a task
   * @param taskId
   * @param ttlSeconds optional validity in seconds
   */
  async createPublicShare(taskId: string, ttlSeconds?: number) {
    const body = typeof ttlSeconds === 'number' ? { ttlSeconds } : undefined
    const res = await http.post<{ token: string, expiresAt: string, urlPath: string }>(`agent/tasks/${taskId}/share`, body)
    return res
  },
}
