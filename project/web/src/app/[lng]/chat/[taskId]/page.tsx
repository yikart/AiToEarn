/**
 * 对话详情页 - Chat Detail
 * 功能：支持实时模式（从 HomeChat 跳转）和历史模式（刷新或从任务列表进入）
 * 工作流状态实时显示在对应消息上
 */
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { ChatInput } from '@/components/Chat/ChatInput'
import { ChatMessage } from '@/components/Chat/ChatMessage'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import type { IWorkflowStep, IMessageStep } from '@/store/agent'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { agentApi, type TaskDetail, type TaskMessage } from '@/api/agent'
import { useAgentStore, type IDisplayMessage } from '@/store/agent'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useTransClient } from '@/app/i18n/client'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import logo from '@/assets/images/logo.png'

/**
 * 将后端消息转换为显示格式
 * 数据结构说明：
 * - user: { type: 'user', content: [{ type: 'text', text: '...' }] }
 * - assistant: { type: 'assistant', uuid: '...', message: { content: [{ type: 'text', text: '...' }] } }
 * - stream_event: 流式事件，用于提取工具调用信息
 * - result: { type: 'result', message: { message: '...' } }
 *
 * 改进：解析多步骤和工作流步骤
 * - message_start 事件标识新步骤开始
 * - tool_use 事件标识工具调用
 * - tool_result 事件标识工具结果
 */
function convertMessages(messages: TaskMessage[]): IDisplayMessage[] {
  const displayMessages: IDisplayMessage[] = []

  // 临时存储当前 assistant 消息的步骤
  let currentSteps: IMessageStep[] = []
  let currentStepContent = ''
  let currentStepWorkflow: IWorkflowStep[] = []
  let stepIndex = 0
  let lastAssistantMsgIndex = -1

  // 用于追踪工具调用的 Map
  const toolCallMap = new Map<string, string>()

  /** 保存当前步骤到步骤列表 */
  const saveCurrentStep = () => {
    if (currentStepContent.trim() || currentStepWorkflow.length > 0) {
      currentSteps.push({
        id: `step-${stepIndex}`,
        content: currentStepContent.trim(),
        workflowSteps: [...currentStepWorkflow],
        isActive: false,
        timestamp: Date.now(),
      })
      stepIndex++
    }
    currentStepContent = ''
    currentStepWorkflow = []
  }

  /** 将步骤保存到最后一个 assistant 消息 */
  const saveStepsToMessage = () => {
    saveCurrentStep()
    if (currentSteps.length > 0 && lastAssistantMsgIndex >= 0) {
      const lastMsg = displayMessages[lastAssistantMsgIndex]
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.steps = [...currentSteps]
      }
    }
    currentSteps = []
    stepIndex = 0
  }

  messages.forEach((msg, index) => {
    if (msg.type === 'user') {
      // 用户消息处理
      let content = ''
      const medias: IUploadedMedia[] = []
      let isToolResult = false

      if (Array.isArray(msg.content)) {
        msg.content.forEach((item: any) => {
          if (item.type === 'text') {
            content = item.text || ''
          } else if (item.type === 'image') {
            medias.push({
              url: item.source?.url || '',
              type: 'image',
            })
          } else if (item.type === 'tool_result') {
            isToolResult = true
          }
        })
      } else if (typeof msg.content === 'string') {
        content = msg.content
      }

      // 只有非工具结果的用户消息才显示
      if (content && !isToolResult) {
        // 保存之前的 assistant 步骤
        saveStepsToMessage()

        displayMessages.push({
          id: msg.uuid || `user-${index}`,
          role: 'user',
          content,
          medias: medias.length > 0 ? medias : undefined,
          status: 'done',
        })
      }

      // 处理工具结果（添加到工作流）
      // 支持两种数据路径：msg.message.content 和 msg.message.message.content
      if ((msg as any).message) {
        const userMsg = (msg as any).message as any
        // 尝试两种数据路径
        const contentArray = userMsg?.content || userMsg?.message?.content
        if (contentArray && Array.isArray(contentArray)) {
          contentArray.forEach((item: any) => {
            if (item.type === 'tool_result' && item.tool_use_id) {
              const toolName = toolCallMap.get(item.tool_use_id) || 'Tool'
              let resultText = ''
              if (Array.isArray(item.content)) {
                item.content.forEach((rc: any) => {
                  if (rc.type === 'text') {
                    resultText = rc.text || ''
                  }
                })
              } else if (typeof item.content === 'string') {
                resultText = item.content
              }

              if (resultText) {
                currentStepWorkflow.push({
                  id: `result-${item.tool_use_id}`,
                  type: 'tool_result',
                  toolName,
                  content: resultText,
                  isActive: false,
                  timestamp: Date.now(),
                })
              }
            }
          })
        }
      }

      // 从 tool_use_result 字段获取工具结果
      if ((msg as any).tool_use_result) {
        const results = (msg as any).tool_use_result
        if (Array.isArray(results)) {
          results.forEach((result: any) => {
            if (result.type === 'text' && result.text) {
              // 查找最近的工具调用名称
              const lastToolCall = [...currentStepWorkflow].reverse().find(s => s.type === 'tool_call')
              const toolName = lastToolCall?.toolName || 'Tool'

              currentStepWorkflow.push({
                id: `result-${Date.now()}-${Math.random()}`,
                type: 'tool_result',
                toolName,
                content: result.text,
                isActive: false,
                timestamp: Date.now(),
              })
            }
          })
        }
      }
    } else if (msg.type === 'stream_event') {
      // 流式事件处理：提取工具调用和步骤信息
      const streamEvent = msg as any
      const event = streamEvent.event

      // message_start 表示新的一轮消息开始（新步骤）
      if (event?.type === 'message_start') {
        saveCurrentStep()
      }

      // 工具调用开始
      if (event?.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
        const toolName = event.content_block.name || 'Unknown Tool'
        const toolId = event.content_block.id || `tool-${Date.now()}`

        // 记录工具调用 ID 和名称的映射
        toolCallMap.set(toolId, toolName)

        currentStepWorkflow.push({
          id: toolId,
          type: 'tool_call',
          toolName,
          content: '',
          isActive: false,
          timestamp: Date.now(),
        })
      }

      // 工具调用参数
      if (event?.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
        const lastToolCall = currentStepWorkflow.findLast(s => s.type === 'tool_call')
        if (lastToolCall) {
          lastToolCall.content = (lastToolCall.content || '') + (event.delta.partial_json || '')
        }
      }
    } else if (msg.type === 'assistant') {
      // AI 回复消息
      let content = ''
      const messageData = (msg as any).message as any

      if (messageData?.content && Array.isArray(messageData.content)) {
        messageData.content.forEach((item: any) => {
          if (item.type === 'text') {
            content += item.text || ''
          } else if (item.type === 'tool_use') {
            // 工具调用信息（完整的）
            const toolName = item.name || 'Unknown Tool'
            const toolId = item.id || `tool-${Date.now()}`
            const toolInput = item.input ? JSON.stringify(item.input, null, 2) : ''

            toolCallMap.set(toolId, toolName)

            // 检查是否已存在该工具调用
            const existingCall = currentStepWorkflow.find(s => s.id === toolId)
            if (existingCall) {
              existingCall.content = toolInput
              existingCall.isActive = false
            } else {
              currentStepWorkflow.push({
                id: toolId,
                type: 'tool_call',
                toolName,
                content: toolInput,
                isActive: false,
                timestamp: Date.now(),
              })
            }
          }
        })
      }

      // 累积当前步骤的文本内容
      if (content) {
        currentStepContent += (currentStepContent ? '\n\n' : '') + content
      }

      // 检查是否需要创建新的 assistant 消息
      const lastMsg = displayMessages[displayMessages.length - 1]
      if (!lastMsg || lastMsg.role !== 'assistant') {
        // 创建新的 assistant 消息
        displayMessages.push({
          id: (msg as any).uuid || `assistant-${index}`,
          role: 'assistant',
          content: '',
          status: 'done',
          steps: [],
        })
        lastAssistantMsgIndex = displayMessages.length - 1
      }
    } else if (msg.type === 'result') {
      // 结果消息
      const messageData = (msg as any).message as any
      const content = messageData?.message || ''

      if (content && typeof content === 'string') {
        // 检查上一条是否也是 assistant 消息
        const lastMsg = displayMessages[displayMessages.length - 1]
        if (lastMsg && lastMsg.role === 'assistant') {
          // 添加到当前步骤内容（避免重复）
          if (!currentStepContent.includes(content)) {
            currentStepContent += (currentStepContent ? '\n\n' : '') + content
          }
        } else {
          displayMessages.push({
            id: (msg as any).uuid || `result-${index}`,
            role: 'assistant',
            content,
            status: 'done',
          })
          lastAssistantMsgIndex = displayMessages.length - 1
        }
      }
    }
  })

  // 保存最后的步骤
  saveStepsToMessage()

  // 后处理：确保每条 assistant 消息都有正确的 content
  displayMessages.forEach(msg => {
    if (msg.role === 'assistant' && msg.steps && msg.steps.length > 0) {
      // 用所有步骤的内容拼接作为总内容
      const totalContent = msg.steps.map(s => s.content).filter(Boolean).join('\n\n')
      if (totalContent && !msg.content) {
        msg.content = totalContent
      }
    }
  })

  return displayMessages
}

export default function ChatDetailPage() {
  const { t } = useTransClient('chat')
  const router = useRouter()
  const params = useParams()
  const taskId = params.taskId as string
  const lng = params.lng as string

  // 全局 Store 状态
  const {
    currentTaskId,
    isGenerating: storeIsGenerating,
    messages: storeMessages,
    workflowSteps: storeWorkflowSteps,
    progress,
  } = useAgentStore(
    useShallow((state) => ({
      currentTaskId: state.currentTaskId,
      isGenerating: state.isGenerating,
      messages: state.messages,
      workflowSteps: state.workflowSteps,
      progress: state.progress,
    })),
  )

  // Store 方法
  const { continueTask, stopTask, setMessages } = useAgentStore()

  // 判断是否为活跃任务：Store 中的 taskId 匹配当前页面
  // 一旦在此页面发起对话，就一直使用 Store 消息（避免切换导致消息丢失）
  const isActiveTask = currentTaskId === taskId

  // 判断是否正在实时生成
  const isRealtimeGenerating = isActiveTask && storeIsGenerating

  // 本地状态
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [localMessages, setLocalMessages] = useState<IDisplayMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [localIsGenerating, setLocalIsGenerating] = useState(false)

  // 使用媒体上传 Hook
  const {
    medias,
    setMedias,
    isUploading,
    handleMediasChange,
    handleMediaRemove,
    clearMedias,
  } = useMediaUpload({
    onError: () => toast.error(t('media.uploadFailed' as any)),
  })

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasLoadedRef = useRef(false)

  // 当前显示的消息：
  // - 活跃任务（已在此页面发起过对话）→ 使用 Store 消息
  // - 非活跃任务（刷新或从历史进入）→ 使用本地消息
  const displayMessages = isActiveTask ? storeMessages : localMessages

  // 是否正在生成
  const isGenerating = isRealtimeGenerating || localIsGenerating

  // 当前工作流步骤列表（仅在实时生成时有效）
  const workflowSteps: IWorkflowStep[] = isActiveTask ? storeWorkflowSteps : []

  /** 滚动消息列表到底部 */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  /**
   * 加载任务详情（仅在初始加载时）
   * - 只在页面首次加载或刷新时从 API 获取历史消息
   * - 对话过程中不会重新加载（避免覆盖新消息）
   */
  useEffect(() => {
    // 如果已经加载过，不再重复加载
    if (hasLoadedRef.current) {
      setIsLoading(false)
      return
    }

    // 如果是活跃任务（Store 中已有消息），不需要从 API 加载
    if (isActiveTask && storeMessages.length > 0) {
      setIsLoading(false)
      hasLoadedRef.current = true
      return
    }

    const loadTask = async () => {
      if (!taskId) return

      setIsLoading(true)
      try {
        const result = await agentApi.getTaskDetail(taskId)
        if (!result) {
          toast.error(t('message.error' as any))
          return
        }
        if (result.code === 0 && result.data) {
          setTask(result.data)
          // 转换消息格式
          if (result.data.messages) {
            const converted = convertMessages(result.data.messages)
            setLocalMessages(converted)
            // 同步到 Store（用于后续继续对话）
            setMessages(converted)
          }
          hasLoadedRef.current = true
        } else {
          toast.error(result.message || t('message.error' as any))
        }
      } catch (error) {
        console.error('Load task detail failed:', error)
        toast.error(t('message.error' as any))
      } finally {
        setIsLoading(false)
      }
    }

    loadTask()
  }, [taskId, isActiveTask, storeMessages.length, t, setMessages])

  /** 滚动消息列表到底部 */
  useEffect(() => {
    scrollToBottom()
  }, [displayMessages, workflowSteps, scrollToBottom])

  /** 处理发送消息（继续对话） */
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isGenerating) return

    // 保存当前输入
    const currentPrompt = inputValue
    const currentMedias = [...medias]

    // 清空输入
    setInputValue('')
    clearMedias()
    setLocalIsGenerating(true)

    try {
      // 使用全局 Store 继续对话
      await continueTask({
        prompt: currentPrompt,
        medias: currentMedias,
        t: t as (key: string) => string,
        taskId,
      })
    } catch (error: any) {
      console.error('Continue task failed:', error)
      toast.error(error.message || t('message.error' as any))
      // 恢复输入
      setInputValue(currentPrompt)
      setMedias(currentMedias)
    } finally {
      setLocalIsGenerating(false)
    }
  }, [inputValue, medias, isGenerating, taskId, t, continueTask, clearMedias, setMedias])

  /** 停止生成 */
  const handleStop = useCallback(() => {
    stopTask()
    setLocalIsGenerating(false)
  }, [stopTask])

  /** 返回 */
  const handleBack = () => {
    router.push(`/${lng}`)
  }

  // 加载骨架屏（仅在初始加载时显示，活跃任务不显示）
  if (isLoading && !isActiveTask) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* 顶部导航 */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-32 h-5" />
        </header>

        {/* 消息区域骨架 */}
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'flex-row-reverse' : '')}>
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="w-48 h-16 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>

        {/* 底部输入区域骨架 */}
        <div className="p-4 bg-white border-t border-gray-200">
          <Skeleton className="w-full h-14 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <Button variant="ghost" size="icon" onClick={handleBack} className="w-8 h-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
            <Image
              src={logo}
              alt="AiToEarn"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-base font-medium text-gray-900 line-clamp-1">
            {task?.title || t('task.newChat' as any)}
          </h1>
        </div>

        {/* 实时模式显示进度 */}
        {isGenerating && (
          <div className="ml-auto flex items-center gap-2 text-sm text-purple-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('message.thinking' as any)}</span>
            {progress > 0 && progress < 100 && (
              <span className="text-xs text-gray-500">({progress}%)</span>
            )}
          </div>
        )}
      </header>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages
          .filter((message): message is IDisplayMessage & { role: 'user' | 'assistant' } =>
            message.role === 'user' || message.role === 'assistant')
          .map((message, index, filteredMessages) => {
          // 判断是否为最后一条 assistant 消息（用于显示工作流）
          const isLastAssistant = message.role === 'assistant' &&
            index === filteredMessages.length - 1

          return (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              medias={message.medias}
              status={message.status}
              errorMessage={message.errorMessage}
              createdAt={message.createdAt}
              // 传递消息步骤（优先使用 steps）
              steps={message.steps}
              // 只在最后一条 AI 消息上显示工作流步骤（兼容无 steps 的情况）
              workflowSteps={isLastAssistant && isGenerating ? workflowSteps : undefined}
            />
          )
        })}

        {/* 如果正在生成但还没有 assistant 消息，显示一个空的 AI 消息 */}
        {isGenerating && displayMessages.every(m => m.role === 'user') && (
          <ChatMessage
            role="assistant"
            content=""
            status="streaming"
            workflowSteps={workflowSteps}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区域 */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          onStop={handleStop}
          medias={medias}
          onMediasChange={handleMediasChange}
          onMediaRemove={handleMediaRemove}
          isGenerating={isGenerating}
          isUploading={isUploading}
          placeholder={t('detail.continuePlaceholder' as any)}
          mode="compact"
        />
      </div>
    </div>
  )
}
