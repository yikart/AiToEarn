/**
 * 对话详情页 - Chat Detail
 * 功能：支持实时模式（从 HomeChat 跳转）和历史模式（刷新或从任务列表进入）
 * 工作流状态实时显示在对应消息上
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChatInput } from '@/components/Chat/ChatInput'
import { useAgentStore } from '@/store/agent'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useTransClient } from '@/app/i18n/client'
import { toast } from '@/lib/toast'
/* rating entry moved into ChatHeader */

// 页面私有组件
import { ChatHeader, ChatMessageList, ChatLoadingSkeleton } from './components'
// 页面私有 hooks
import { useScrollControl, useChatState } from './hooks'

// 测试数据 - 用于测试 createChannel action
const TEST_RESULT_DATA = {"type":"result","message":{"type":"result","subtype":"success","uuid":"507f3578-d539-43dd-8214-67eee1613e87","duration_ms":198689,"duration_api_ms":41362,"is_error":false,"num_turns":9,"message":"完成！我已经生成了三张竖屏狗狗图片，并准备好发布到推特。由于你的账户还未绑定推特，系统会引导你进入发布页面，在那里你可以：\n\n1. **绑定推特账户**（如果还未绑定）\n2. **查看三条准备好的推文**：\n - 推文1：陪你看过海 + 海边图片\n - 推文2：陪你爬过山 + 山上图片\n - 推文3：你怎么忍心割我蛋蛋 + 傍晚图片\n\n3. **发布到推特**\n\n所有图片和文案都已准备就绪，你只需要完成账户连接并确认发布即可！🐕","result":[
  {"type":"fullContent","title":"陪你看过海","description":"陪你看过海","tags":["狗狗","陪伴","回忆"],"medias":[{"type":"IMAGE","url":"https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/gemini-3-pro-image-preview/690df0fea7aa4267575e2d9c/mjcqx6ux.png"}],
  "action":"navigateToPublish","platform":"twitter"},
  // {"type":"fullContent","title":"陪你爬过山","description":"陪你爬过山","tags":["狗狗","陪伴","冒险"],"medias":[{"type":"IMAGE","url":"https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/gemini-3-pro-image-preview/690df0fea7aa4267575e2d9c/mjcqykej.png"}],
  // "action":"navigateToPublish","platform":"twitter"},
  // {"type":"fullContent","title":"你怎么忍心割我蛋蛋","description":"你怎么忍心割我蛋蛋","tags":["狗狗","可爱","搞笑"],"medias":[{"type":"IMAGE","url":"https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/gemini-3-pro-image-preview/690df0fea7aa4267575e2d9c/mjcqzehm.png"}],
  // "action":"navigateToPublish","platform":"twitter"}
],"total_cost_usd":0.2299501,"usage":{"cache_creation":{"ephemeral_1h_input_tokens":0,"ephemeral_5m_input_tokens":164958},"cache_creation_input_tokens":164958,"cache_read_input_tokens":63716,"input_tokens":34,"output_tokens":1922,"server_tool_use":{"web_search_requests":0}},"permission_denials":[]}}



// {"type":"result","message":{"type":"result","subtype":"success","uuid":"653d19f6-b1a4-4bc6-910b-f813c68c65a0","duration_ms":23024,"duration_api_ms":28454,"is_error":false,"num_turns":5,"message":"完成！我已经为你准备好了小红书发布内容。系统已引导你进入小红书发布页面，你可以：\n\n1. **绑定小红书账户**（如果还未绑定）\n2. **查看准备好的内容**：\n - 标题：陪你看过海，陪你爬过山\n - 描述：包含三分图的完整文案\n - 标签：#狗狗 #陪伴 #回忆 #搞笑 #宠物\n\n3. **上传并发布**这张精美的三分图到小红书\n\n所有内容都已准备就绪，你只需要完成账户连接并确认发布即可！🐕✨","result":[{"type":"fullContent","title":"陪你看过海，陪你爬过山","description":"上方小狗在海边眺望远方 陪你看过海，中方小狗在山上眺望远方 陪你爬过山，下方傍晚天气小狗正脸 你怎么忍心割我蛋蛋。三分图设计，温馨搞笑兼具的狗狗陪伴主题。","tags":["狗狗","陪伴","回忆","搞笑","宠物"],"medias":[{"type":"IMAGE","url":"https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/gemini-3-pro-image-preview/690df0fea7aa4267575e2d9c/mjcrjbr6.png"}],
// "action":"navigateToPublish","platform":"xhs"}],"total_cost_usd":0.1240453,"usage":{"cache_creation":{"ephemeral_1h_input_tokens":0,"ephemeral_5m_input_tokens":82734},"cache_creation_input_tokens":82734,"cache_read_input_tokens":94298,"input_tokens":21,"output_tokens":844,"server_tool_use":{"web_search_requests":0}},"permission_denials":[]}}

// 测试模式：设置为 true 时，点击发送不发送请求，直接返回测试数据 00.00
const TEST_MODE = false

export default function ChatDetailPage() {
  const { t } = useTransClient('chat')
  const { t: tHome } = useTransClient('home')
  const router = useRouter()
  const params = useParams()
  const taskId = params.taskId as string
  const lng = params.lng as string

  // Store 方法
  const { createTask, continueTask, stopTask, setActionContext, handleSSEMessage, consumePendingTask } = useAgentStore()

  // 聊天状态管理
  const {
    task,
    displayMessages,
    workflowSteps,
    isLoading,
    isGenerating,
    progress,
    isActiveTask,
    setLocalIsGenerating,
  } = useChatState({
    taskId,
    t: t as (key: string) => string,
  })

  // 滚动控制
  const {
    containerRef,
    bottomRef,
    isNearBottom,
    showScrollButton,
    scrollToBottom,
    handleScroll,
  } = useScrollControl()

  // 输入状态
  const [inputValue, setInputValue] = useState('')
  // rating handled in ChatHeader

  // 媒体上传
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

  /**
   * 设置 Action 上下文（用于处理任务结果的 action） 
   */
  useEffect(() => {
    setActionContext({
      router,
      lng,
      t: tHome as any,
    })
  }, [router, lng, tHome, setActionContext])

  /**
   * 处理新任务：当 taskId 为 "new" 时，从 store 获取待处理任务并发起请求
   */
  useEffect(() => {
    if (taskId !== 'new') return

    const pendingTask = consumePendingTask()
    if (!pendingTask) {
      // 没有待处理任务，返回首页
      router.replace(`/${lng}`)
      return
    }

    // 发起任务创建
    const startTask = async () => {
      setLocalIsGenerating(true)
      try {
        await createTask({
          prompt: pendingTask.prompt,
          medias: pendingTask.medias,
          t: t as (key: string) => string,
          onTaskIdReady: (newTaskId) => {
            console.log('[ChatPage] Task ID ready:', newTaskId)
            // 使用 replace 替换 URL，不添加历史记录
            router.replace(`/${lng}/chat/${newTaskId}`)
          },
        })
      } catch (error: any) {
        console.error('[ChatPage] Create task failed:', error)
        toast.error(error.message || t('message.error' as any))
        // 出错时返回首页
        router.replace(`/${lng}`)
      }
    }

    startTask()
  }, [taskId, lng, router, consumePendingTask, createTask, t, setLocalIsGenerating])

  /**
   * 智能滚动：用户在底部附近时自动滚动
   */
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom()
    }
  }, [displayMessages, workflowSteps, isNearBottom, scrollToBottom])

  /**
   * 发送消息（继续对话）
   */
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isGenerating) return

    const currentPrompt = inputValue
    const currentMedias = [...medias]

    // 清空输入
    setInputValue('')
    clearMedias()
    setLocalIsGenerating(true)

    // 强制滚动到底部
    scrollToBottom(true)

    try {
      // 测试模式：直接返回测试数据，不发送真实请求
      if (TEST_MODE) {
        // 先正常调用 continueTask 来添加消息和设置状态
        // 但我们需要拦截 API 调用，所以先设置状态，然后立即模拟返回
        const store = useAgentStore.getState()
        
        // 添加用户消息
        const userMessage = {
          id: `user-${Date.now()}`,
          role: 'user' as const,
          content: currentPrompt,
          medias: currentMedias,
          createdAt: Date.now(),
        }
        store.setMessages([...store.messages, userMessage])
        
        // 添加 AI 待回复消息
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: '',
          status: 'streaming' as const,
          createdAt: Date.now(),
        }
        store.setMessages([...store.messages, assistantMessage])
        
        // 设置生成状态（通过 set 方法）
        useAgentStore.setState({
          isGenerating: true,
          progress: 10,
          currentTaskId: taskId,
        })
        
        // 模拟 SSE 消息处理（延迟一点以模拟真实请求）
        setTimeout(() => {
          if (handleSSEMessage) {
            handleSSEMessage(TEST_RESULT_DATA as any)
          }
        }, 500)
        
        return
      }

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
  }, [
    inputValue,
    medias,
    isGenerating,
    taskId,
    t,
    continueTask,
    clearMedias,
    setMedias,
    scrollToBottom,
    setLocalIsGenerating,
  ])

  /**
   * 停止生成
   */
  const handleStop = useCallback(() => {
    stopTask()
    setLocalIsGenerating(false)
  }, [stopTask, setLocalIsGenerating])

  /**
   * 返回首页
   */
  const handleBack = useCallback(() => {
    router.push(`/${lng}`)
  }, [router, lng])

  // 加载中状态（仅非活跃任务显示骨架屏）
  if (isLoading && !isActiveTask) {
    return <ChatLoadingSkeleton />
  }

  return (
    <div className="flex flex-col h-screen bg-muted">
      {/* 顶部导航 */}
      <ChatHeader
        title={task?.title}
        defaultTitle={t('task.newChat' as any)}
        isGenerating={isGenerating}
        progress={progress}
        thinkingText={t('message.thinking' as any)}
        taskId={taskId}
        rating={task?.rating ?? null}
        onBack={handleBack}
      />

      {/* 消息列表 */}
      <ChatMessageList
        messages={displayMessages}
        workflowSteps={workflowSteps}
        isGenerating={isGenerating}
        containerRef={containerRef}
        bottomRef={bottomRef}
        showScrollButton={showScrollButton}
        onScroll={handleScroll}
        onScrollToBottom={() => scrollToBottom(true)}
        scrollToBottomText={t('detail.scrollToBottom')}
      />

      {/* 底部输入区域 */}
      <div className="p-4 bg-background border-t border-border shrink-0">
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

      {/* 评分入口已移动到顶部 ChatHeader */}
    </div>
  )
}
