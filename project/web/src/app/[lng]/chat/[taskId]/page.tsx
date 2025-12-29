/**
 * 对话详情页 - Chat Detail
 * 功能：支持实时模式（从 HomeChat 跳转）和历史模式（刷新或从任务列表进入）
 * 工作流状态实时显示在对应消息上
 */
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { agentApi } from '@/api/agent'
import { ChatInput } from '@/components/Chat/ChatInput'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { PublishDetailModal } from '@/components/Plugin/PublishDetailModal'
import { toast } from '@/lib/toast'
import { disableDebugReplay, enableDebugReplay, useAgentStore } from '@/store/agent'
import { usePluginStore } from '@/store/plugin'
import { PlatType } from '@/app/config/platConfig'
import { PlatformTaskStatus } from '@/store/plugin/types/baseTypes'
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

  // 中断状态 - 用于强制隐藏工作流步骤
  const [isInterrupted, setIsInterrupted] = useState(false)

  // 发布详情弹框状态
  const [publishDetailVisible, setPublishDetailVisible] = useState(false)
  const [currentPublishTaskId, setCurrentPublishTaskId] = useState<string | undefined>(undefined)
  // 跟踪用户是否手动关闭了弹窗
  const [userClosedModal, setUserClosedModal] = useState(false)

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

  // 监听发布任务创建
  const publishTasks = usePluginStore(state => state.publishTasks)

  useEffect(() => {
    if (isInitialRender.current || displayMessages.length === 0)
      return
    isInitialRender.current = true
    setTimeout(() => {
      scrollToBottom()
    }, 10)
  }, [displayMessages, isInitialRender])

  // 监听发布任务创建，显示发布详情弹框
  useEffect(() => {
    if (publishTasks.length > 0) {
      // 获取最新的发布任务（通常是刚创建的）
      const latestTask = publishTasks[0]
      if (latestTask && !publishDetailVisible && !userClosedModal) {
        console.log('[ChatPage] New publish task detected:', latestTask.id)
        setCurrentPublishTaskId(latestTask.id)
        setPublishDetailVisible(true)
        // 重置用户关闭状态，因为现在有新任务了
        setUserClosedModal(false)
      }
    }
  }, [publishTasks, publishDetailVisible, userClosedModal])

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
      setIsInterrupted(false)
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
    // console.log('handleSend')
    // // 测试打开发布弹窗
    // const testTaskId = usePluginStore.getState().addPublishTask({
    //   title: '测试发布任务',
    //   description: '用于测试发布详情弹窗',
    //   platformTasks: [
    //     {
    //       id: 'test-platform-1',
    //       platform: PlatType.Xhs,
    //       accountId: 'test-account-1',
    //       requestId: 'test-req-1',
    //       params: {
    //         platform: PlatType.Xhs,
    //         type: 'image',
    //         title: '测试小红书内容',
    //         desc: '测试描述',
    //         images: ['test-image-url'],
    //       },
    //       status: PlatformTaskStatus.COMPLETED,
    //       progress: {
    //         stage: 'complete',
    //         progress: 100,
    //         message: '发布成功',
    //       },
    //       result: {
    //         success: true,
    //         workId: 'test-work-1',
    //         shareLink: 'https://example.com/test',
    //       },
    //       startTime: Date.now() - 60000,
    //       endTime: Date.now(),
    //       error: null,
    //     },
    //     {
    //       id: 'test-platform-2',
    //       platform: PlatType.Douyin,
    //       accountId: 'test-account-2',
    //       requestId: 'test-req-2',
    //       params: {
    //         platform: PlatType.Douyin,
    //         type: 'image',
    //         title: '测试抖音内容',
    //         desc: '测试描述',
    //         images: ['test-image-url'],
    //       },
    //       status: PlatformTaskStatus.PUBLISHING,
    //       progress: {
    //         stage: 'publish',
    //         progress: 75,
    //         message: '正在发布...',
    //       },
    //       result: null,
    //       startTime: Date.now() - 30000,
    //       endTime: null,
    //       error: null,
    //     },
    //   ],
    // })
    // setCurrentPublishTaskId(testTaskId)
    // setPublishDetailVisible(true)
    // return

    if (!inputValue.trim() || isGenerating)
      return

    const currentPrompt = inputValue
    const currentMedias = [...medias]

    // 清空输入
    setInputValue('')
    clearMedias()
    // 重置中断状态，开始新任务
    setIsInterrupted(false)
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
  const handleStop = useCallback(async () => {
    try {
      // 调用后端 API 中断任务
      await agentApi.abortTask(taskId)
      console.log('[ChatPage] Task aborted successfully')
      // 显示停止成功的提示
      toast.info(tHome('aiGeneration.taskStopped'))
    } catch (error: any) {
      console.error('[ChatPage] Failed to abort task:', error)
      toast.error(t('message.error'))
    } finally {
      // 无论 API 调用是否成功，都停止本地状态
      // 立即设置中断状态，强制隐藏工作流步骤
      setIsInterrupted(true)
      // 立即设置本地生成状态为 false，确保 UI 立即响应
      setLocalIsGenerating(false)
      stopTask()
    }
  }, [taskId, t, tHome, stopTask, setLocalIsGenerating])

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
        workflowSteps={isInterrupted ? [] : workflowSteps}
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

      {/* 发布详情弹框 - 显示插件发布进度 */}
      <PublishDetailModal
        visible={publishDetailVisible}
        onClose={() => {
          console.log('[ChatPage] User manually closed modal')
          setPublishDetailVisible(false)
          setCurrentPublishTaskId(undefined)
          setUserClosedModal(true)
        }}
        taskId={currentPublishTaskId}
      />
    </div>
  )
}
