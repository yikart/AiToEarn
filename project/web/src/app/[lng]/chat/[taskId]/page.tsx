/**
 * 对话详情页 - Chat Detail
 * 功能：支持实时模式（从 HomeChat 跳转）和历史模式（刷新或从任务列表进入）
 * 工作流状态实时显示在对应消息上
 */
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { ChatInput } from '@/components/Chat/ChatInput'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { toast } from '@/lib/toast'
import { disableDebugReplay, enableDebugReplay, useAgentStore } from '@/store/agent'
/* rating entry moved into ChatHeader */

// 页面私有组件
import { ChatHeader, ChatLoadingSkeleton, ChatMessageList } from './components'
// 页面私有 hooks
import { useChatState, useScrollControl } from './hooks'

export default function ChatDetailPage() {
  const { t } = useTransClient('chat')
  const { t: tHome } = useTransClient('home')
  const router = useRouter()
  const params = useParams()
  const taskId = params.taskId as string
  const lng = params.lng as string
  const isInitialRender = useRef(false)

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
    onError: () => toast.error(t('media.uploadFailed')),
  })

  useEffect(() => {
    if (isInitialRender.current || displayMessages.length === 0)
      return
    isInitialRender.current = true
    setTimeout(() => {
      scrollToBottom()
    }, 10)
  }, [displayMessages, isInitialRender])

  /**
   * 设置 Action 上下文（用于处理任务结果的 action）
   */
  useEffect(() => {
    setActionContext({
      router,
      lng,
      t: tHome,
    })
  }, [router, lng, tHome, setActionContext])

  /**
   * 处理新任务：当 taskId 为 "new" 时，从 store 获取待处理任务并发起请求
   */
  useEffect(() => {
    if (taskId !== 'new')
      return

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
      }
      catch (error: any) {
        console.error('[ChatPage] Create task failed:', error)
        toast.error(error.message || t('message.error'))
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
    if (!inputValue.trim() || isGenerating)
      return

    const currentPrompt = inputValue
    const currentMedias = [...medias]

    // 清空输入
    setInputValue('')
    clearMedias()
    setLocalIsGenerating(true)

    // 强制滚动到底部
    scrollToBottom(true)

    try {
      await continueTask({
        prompt: currentPrompt,
        medias: currentMedias,
        t: t as (key: string) => string,
        taskId,
      })
    }
    catch (error: any) {
      console.error('Continue task failed:', error)
      toast.error(error.message || t('message.error'))
      // 恢复输入
      setInputValue(currentPrompt)
      setMedias(currentMedias)
    }
    finally {
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
    // If there's a previous entry in the history stack, go back.
    // Otherwise, navigate to the root homepage.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    }
    else {
      router.push('/')
    }
  }, [router, lng])

  // Debug Replay panel: show when query param debug=true
  const [showReplay, setShowReplay] = (() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        return [params.get('debug') === 'true', () => params.get('debug') === 'true']
      }
    }
    catch (e) {}
    return [false, () => false]
  })()

  useEffect(() => {
    // enable debug replay when panel is shown via query param
    if (showReplay) {
      try {
        enableDebugReplay()
      }
      catch (e) {}
    }
    return () => {
      // disable debug replay on unmount
      if (showReplay) {
        try {
          disableDebugReplay()
        }
        catch (e) {}
      }
    }
  }, [showReplay])

  // 加载中状态（仅非活跃任务显示骨架屏）
  if (isLoading && !isActiveTask) {
    return <ChatLoadingSkeleton />
  }

  return (
    <div className="flex flex-col h-screen bg-muted">
      {/* 顶部导航 */}
      <ChatHeader
        title={task?.title}
        defaultTitle={t('task.newChat')}
        isGenerating={isGenerating}
        progress={progress}
        thinkingText={t('message.thinking')}
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
          placeholder={t('detail.continuePlaceholder')}
          mode="compact"
        />
      </div>
    </div>
  )
}
