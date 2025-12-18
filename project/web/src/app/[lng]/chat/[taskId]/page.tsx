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

// 页面私有组件
import { ChatHeader, ChatMessageList, ChatLoadingSkeleton } from './components'
// 页面私有 hooks
import { useScrollControl, useChatState } from './hooks'

// 测试数据 - 用于测试 createChannel action
const TEST_RESULT_DATA = {
  type: 'result',
  message: {
    type: 'result',
    subtype: 'success',
    uuid: 'aee2c247-5e9d-4864-a7b7-0c9ad1832648',
    duration_ms: 24585,
    duration_api_ms: 32986,
    is_error: false,
    num_turns: 3,
    message: '好的!我已经为您准备好发布流程了!\n\n**当前状态**:\n- ✅ 图片已生成\n- ✅ 推特文案已准备\n- ⚠️ 需要先绑定推特账号\n\n**接下来的步骤**:\n系统会引导您完成推特账号绑定,绑定完成后,您的内容就可以立即发布了!\n\n**准备发布的内容**:\n- 📸 **图片**: 高质量8K室内人像摄影\n- 📝 **文案**: \n > ✨ 室内私房人像摄影 | Indoor Portrait Photography\n > \n > 追求极致细节与真实质感的艺术表达\n > Pursuing ultimate detail and authentic texture in artistic expression\n > \n > #PortraitPhotography #AsianBeauty #IndoorPhotography #8K #Photography #ArtisticPortrait\n\n请按照系统提示完成推特账号绑定,然后您的精美图文作品就可以成功发布到推特了! 🚀',
    result: [
      {
        type: 'fullContent',
        title: '✨ 室内私房人像摄影 | Indoor Portrait Photography',
        description: '追求极致细节与真实质感的艺术表达\nPursuing ultimate detail and authentic texture in artistic expression\n\n#PortraitPhotography #AsianBeauty #IndoorPhotography #8K #Photography #ArtisticPortrait',
        tags: [],
        medias: [
          {
            type: 'IMAGE',
            url: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/gemini-3-pro-image-preview/690df0fea7aa4267575e2d9c/mjb2gsx3.jpg',
          },
        ],
        action: 'createChannel',
        platform: 'xhs',
        errorMessage: '需要先绑定小红书账号才能发布内容',
      },
    ],
    total_cost_usd: 0.4688474,
    usage: {
      cache_creation: {
        ephemeral_1h_input_tokens: 0,
        ephemeral_5m_input_tokens: 114598,
      },
      cache_creation_input_tokens: 114598,
      cache_read_input_tokens: 61443,
      input_tokens: 13,
      output_tokens: 905,
      server_tool_use: {
        web_search_requests: 0,
      },
    },
    permission_denials: [],
  },
}

// 测试模式：设置为 true 时，点击发送不发送请求，直接返回测试数据 00.00
const TEST_MODE = false

export default function ChatDetailPage() {
  const { t } = useTransClient('chat')
  const router = useRouter()
  const params = useParams()
  const taskId = params.taskId as string
  const lng = params.lng as string

  // Store 方法
  const { continueTask, stopTask, setActionContext, handleSSEMessage } = useAgentStore()

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
      t: t as any,
    })
  }, [router, lng, t, setActionContext])

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
      <div className="w-full p-4 bg-background border-t border-border shrink-0">
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
