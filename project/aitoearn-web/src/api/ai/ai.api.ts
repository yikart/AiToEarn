import type { AgentTaskRatingResponse, AgentTaskShareVo, AiChatStreamParams, AiLogListParams, AiPaginationParams, ChatModel, CreateAgentTaskParams, CreateDraftFromVideoUrlDto, CreateDraftFromVideoUrlVo, CreateDraftGenerationVo, CreateImageTextDraftGenerationParams, CreateTaskResponse, CreateVideoDraftGenerationParams, DraftGenerationPricingVo, DraftGenerationStats, DraftGenerationTask, DraftGenerationTaskListVo, GetTaskListParams, SSEMessage, SubmitAgentTaskRatingPayload, TaskDetail, TaskListResponse, TaskMessagesVo, VideoGenerationHistoryListVo } from './ai.types'
import type { AssetListVo } from '@/types/agent-asset'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useAgentStore } from '@/store/agent'
import { useUserStore } from '@/store/user'
import http from '@/utils/request'

/** AI 生成任务、草稿生成、模型配置与任务消息接口。 */
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
    params: CreateAgentTaskParams,
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

    // Debug 模式拦截: 如果处于 debug 模式且还有文件可用，使用本地文件回放
    try {
      const store = useAgentStore.getState()
      if (store.debugFiles.length > 0 && store.debugMessageIndex < store.debugFiles.length) {
        const debugFilePath = useAgentStore.getState().consumeDebugFile()

        if (debugFilePath) {
          let isAborted = false
          const abort = () => {
            isAborted = true
          }

          ;(async () => {
            try {
              const resp = await fetch(debugFilePath)
              if (!resp.ok) {
                console.warn('[SSE] Debug replay: failed to fetch file:', debugFilePath)
                onDone?.()
                return
              }

              const raw = await resp.text()

              // 解析 SSE 格式的数据块
              const blocks = raw
                .split(/\r?\n\r?\n+/)
                .map(b => b.trim())
                .filter(Boolean)

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
                  onMessage(data as SSEMessage)
                }
                catch (e) {
                  console.warn('[SSE] Debug replay: failed to parse block', e)
                }
                // 模拟流式推送的小延迟
                await new Promise(r => setTimeout(r, 40))
              }

              if (!isAborted) {
                onDone?.()
              }
            }
            catch (e) {
              console.error('[SSE] Debug replay error:', e)
              onDone?.()
            }
          })()

          return abort
        }
      }
    }
    catch (e) {
      console.warn('[SSE] Debug mode check failed', e)
    }

    try {
      // 获取语言设置
      const lng = useUserStore.getState().lang || 'en'

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
            return
          }

          // 如果没有数据，跳过
          if (!event.data) {
            return
          }

          try {
            const data = JSON.parse(event.data)

            // 消息去重：基于 uuid 或生成唯一标识
            const messageId
              = data.uuid
                || data.message?.uuid
                || `${data.type}-${JSON.stringify(data).slice(0, 100)}`
            if (processedMessageIds.has(messageId)) {
              return
            }
            processedMessageIds.add(messageId)

            // 保存 sessionId
            if (data.sessionId) {
              sessionId = data.sessionId
            }

            // 调用消息回调
            onMessage(data)

            // 如果收到结束信号，关闭连接
            if (data.type === 'done' || data.type === 'error') {
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
  async createTask(params: CreateAgentTaskParams) {
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
    const res = await http.get<AgentTaskRatingResponse>(
      `agent/tasks/${taskId}/rating`,
    )
    return res
  },

  /**
   * 提交或更新任务评分
   * @param taskId 任务ID
   * @param payload 评分内容
   * @param payload.rating 评分值
   * @param payload.comment 评分备注
   */
  async submitTaskRating(taskId: string, payload: SubmitAgentTaskRatingPayload) {
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
   * @param params 查询参数
   */
  async getTaskList(params: GetTaskListParams = {}) {
    const { page = 1, pageSize = 10, keyword, favoriteOnly } = params
    const queryParams: Record<string, string | number | boolean> = { page, pageSize }

    // 添加搜索关键词（截取前100字符）
    if (keyword?.trim()) {
      queryParams.keyword = keyword.trim().slice(0, 100)
    }
    // 添加收藏筛选
    if (favoriteOnly) {
      queryParams.favoriteOnly = true
    }

    const res = await http.get<TaskListResponse>('agent/tasks', queryParams)
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
    const res = await http.post<AgentTaskShareVo>(
      `agent/tasks/${taskId}/share`,
      body,
    )
    return res
  },

  /**
   * Get task by public share token (no authentication required)
   * @param token Share token
   */
  async getTaskByShareToken(token: string) {
    const res = await http.get<TaskDetail>(`agent/tasks/shared/${token}`)
    return res
  },

  /**
   * 收藏任务
   * @param taskId 任务ID
   */
  async favoriteTask(taskId: string) {
    const res = await http.post(`agent/tasks/${taskId}/favorite`)
    return res
  },

  /**
   * 取消收藏任务
   * @param taskId 任务ID
   */
  async unfavoriteTask(taskId: string) {
    const res = await http.delete(`agent/tasks/${taskId}/favorite`)
    return res
  },
}

// Source: ai.ts
/**
 * Get Chat Model Parameters
 */
export function getChatModels(scene?: 'comment' | 'web', silent?: boolean) {
  return http.get<ChatModel[]>(`ai/models/chat?scene=${scene || 'web'}`, undefined, silent)
}

/**
 * List Video Tasks
 */
export function getVideoGenerations(params?: AiPaginationParams) {
  return http.get<VideoGenerationHistoryListVo>('ai/video/generations', params)
}

/**
 * 获取用户 AI 活动日志
 */
export function getLogs(params?: AiLogListParams) {
  return http.get('ai/logs', params)
}

/**
 * AI聊天接口 - 支持流式和非流式响应
 */
export async function aiChatStream(data: AiChatStreamParams) {
  const token = useUserStore.getState().token
  const lang = useUserStore.getState().lang

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/chat`, {
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
 * @param params.page - 页码
 * @param params.pageSize - 每页数量
 * @returns 素材列表
 */
export function getAgentAssets(params?: AiPaginationParams) {
  return http.get<AssetListVo>('ai/assets', params)
}

/** 创建 AI 批量生成草稿任务 */
export function apiCreateDraftGeneration(data: CreateVideoDraftGenerationParams) {
  return http.post<CreateDraftGenerationVo>('ai/draft-generation/v2', data)
}

/** 创建 AI 图文草稿生成任务 */
export function apiCreateImageTextDraft(data: CreateImageTextDraftGenerationParams) {
  return http.post<CreateDraftGenerationVo>('ai/draft-generation/image-text', data)
}

/** 获取图片模型定价信息 */
export function apiGetDraftGenerationPricing() {
  return http.get<DraftGenerationPricingVo>('ai/draft-generation/pricing')
}

/** 根据视频 URL 生成草稿 */
export function apiCreateDraftFromVideoUrl(data: CreateDraftFromVideoUrlDto) {
  return http.post<CreateDraftFromVideoUrlVo>('ai/draft-generation/from-video-url', data)
}

/**
 * 获取生成中任务数量统计（轮询用，静默模式不弹错误提示）
 */
export function apiGetDraftGenerationStats() {
  return http.get<DraftGenerationStats>('ai/draft-generation/stats', undefined, true)
}

/**
 * 根据任务 ID 批量查询生成任务状态（轮询用，静默模式不弹错误提示）
 */
export function apiQueryDraftGenerationTasks(taskIds: string[]) {
  return http.post<DraftGenerationTask[]>('ai/draft-generation/query', { taskIds }, true)
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
