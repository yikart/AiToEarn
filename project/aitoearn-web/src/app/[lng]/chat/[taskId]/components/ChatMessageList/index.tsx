/**
 * ChatMessageList - 消息列表组件
 * 负责渲染消息列表和回到底部按钮
 */
'use client'

import type { IDisplayMessage, IWorkflowStep } from '@/store/agent'
import { ArrowDown } from 'lucide-react'
import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { ChatMessage } from '@/components/Chat/ChatMessage'
import { RatingModal } from '@/components/Chat/Rating'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/ui/star-rating'
import { toast } from '@/lib/toast'

export interface IChatMessageListProps {
  /** 消息列表 */
  messages: IDisplayMessage[]
  /** 工作流步骤（用于最后一条 AI 消息） */
  workflowSteps: IWorkflowStep[]
  /** 是否正在生成 */
  isGenerating: boolean
  /** 消息容器 ref */
  containerRef: React.RefObject<HTMLDivElement>
  /** 底部占位 ref */
  bottomRef: React.RefObject<HTMLDivElement>
  /** 是否显示回到底部按钮 */
  showScrollButton: boolean
  /** 滚动事件处理 */
  onScroll: () => void
  /** 点击回到底部 */
  onScrollToBottom: () => void
  /** 回到底部按钮文案 */
  scrollToBottomText: string
  /** 任务 ID */
  taskId?: string
  /** 任务评分（null 表示未评价） */
  rating?: number | null
  /** 评分保存成功回调 */
  onRatingSaved?: () => void
}

export function ChatMessageList({
  messages,
  workflowSteps,
  isGenerating,
  containerRef,
  bottomRef,
  showScrollButton,
  onScroll,
  onScrollToBottom,
  scrollToBottomText,
  taskId,
  rating,
  onRatingSaved,
}: IChatMessageListProps) {
  const { t } = useTransClient('chat')
  const [ratingOpen, setRatingOpen] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)

  // 过滤出用户和 AI 消息
  const filteredMessages = messages.filter(
    (message): message is IDisplayMessage & { role: 'user' | 'assistant' } =>
      message.role === 'user' || message.role === 'assistant',
  )

  // 判断是否显示评分 UI
  const hasUserMessage = filteredMessages.some(m => m.role === 'user')
  const hasAssistantMessage = filteredMessages.some(m => m.role === 'assistant')
  const isNotRated = rating === null || rating === undefined
  const showRatingUI
    = hasUserMessage && hasAssistantMessage && isNotRated && !isGenerating && taskId

  // 处理星星点击
  const handleStarClick = (value: number) => {
    setSelectedRating(value)
    setRatingOpen(true)
  }

  // 处理评分保存成功
  const handleRatingSaved = () => {
    setRatingOpen(false)
    setSelectedRating(null)
    toast.success(t('rating.submitSuccess'))
    onRatingSaved?.()
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* 消息列表 - 外层负责滚动，内层限宽居中 */}
      <div ref={containerRef} onScroll={onScroll} className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-4 flex gap-4 flex-col">
          {filteredMessages.map((message, index) => {
            // 判断是否为最后一条 assistant 消息（用于显示工作流）
            const isLastAssistant
              = message.role === 'assistant' && index === filteredMessages.length - 1

            return (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                medias={message.medias}
                status={message.status}
                errorMessage={message.errorMessage}
                createdAt={message.createdAt}
                steps={message.steps}
                workflowSteps={isLastAssistant && isGenerating ? workflowSteps : undefined}
                actions={message.actions}
                publishFlows={message.publishFlows}
                isGenerating={isLastAssistant && isGenerating}
              />
            )
          })}

          {/* 如果正在生成但还没有 assistant 消息，显示一个空的 AI 消息 */}
          {isGenerating && messages.every(m => m.role === 'user') && (
            <ChatMessage
              role="assistant"
              content=""
              status="streaming"
              workflowSteps={workflowSteps}
              isGenerating={true}
            />
          )}

          {/* 评分引导 UI */}
          {showRatingUI && (
            <div className="flex flex-col items-start gap-3 py-6">
              <p className="text-sm text-muted-foreground">{t('rating.feedbackPrompt')}</p>
              <StarRating onChange={handleStarClick} size="md" />
            </div>
          )}

          {/* 底部占位元素 */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 回到底部按钮 */}
      {showScrollButton && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Button
            variant="secondary"
            size="sm"
            onClick={onScrollToBottom}
            className="rounded-full shadow-lg bg-background/95 backdrop-blur-sm hover:bg-background border border-border gap-1.5 px-4 transition-all hover:shadow-xl"
          >
            <ArrowDown className="w-4 h-4" />
            <span className="text-sm">{scrollToBottomText}</span>
          </Button>
        </div>
      )}

      {/* 评分弹窗 */}
      {taskId && (
        <RatingModal
          taskId={taskId}
          open={ratingOpen}
          defaultRating={selectedRating}
          onClose={() => setRatingOpen(false)}
          onSaved={handleRatingSaved}
        />
      )}
    </div>
  )
}
