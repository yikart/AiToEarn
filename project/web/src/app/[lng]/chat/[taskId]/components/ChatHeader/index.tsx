/**
 * ChatHeader - 对话页面顶部导航栏
 * 显示返回按钮、标题、生成状态
 */
'use client'

import { ArrowLeft, Loader2, Share2, Star } from 'lucide-react'
import React, { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import RatingModal from '@/components/Chat/Rating'
import ShareModal from '@/components/Share/ShareModal'
import { Button } from '@/components/ui/button'

export interface IChatHeaderProps {
  /** 任务标题 */
  title?: string
  /** 默认标题（任务标题为空时显示） */
  defaultTitle: string
  /** 是否正在生成 */
  isGenerating: boolean
  /** 生成进度（0-100） */
  progress: number
  /** 思考中文案 */
  thinkingText: string
  /** 任务ID（用于评分） */
  taskId?: string
  /** 任务评分（用于显示实星） */
  rating?: number | null
  /** 返回按钮点击 */
  onBack: () => void
}

export function ChatHeader({
  title,
  defaultTitle,
  isGenerating,
  progress,
  thinkingText,
  onBack,
  taskId,
  rating,
}: IChatHeaderProps) {
  const { t } = useTransClient('chat')
  const { t: cgmaterialT } = useTransClient('cgmaterial')
  const [ratingOpen, setRatingOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border shrink-0">
      {/* 返回按钮 */}
      <Button variant="ghost" size="icon" onClick={onBack} className="w-8 h-8">
        <ArrowLeft className="w-5 h-5" />
      </Button>

      {/* 标题 */}
      <h1 className="text-base font-medium text-foreground line-clamp-1">
        {title || defaultTitle}
      </h1>

      {/* 右侧区域：生成状态 + 评分入口 */}
      <div className="ml-auto flex items-center gap-2">
        {isGenerating && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{thinkingText}</span>
            {progress > 0 && progress < 100 && (
              <span className="text-xs text-muted-foreground">
                (
                {progress}
                %)
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShareOpen(true)}
            className="ml-1 text-sm text-muted-foreground sm:inline flex! items-center"
          >
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Share2 className="w-5 h-5" />
            </Button>
            {cgmaterialT('import.shares')}
          </button>
          {/* 文本提示，移动端隐藏以节省空间 */}
          <button
            onClick={() => setRatingOpen(true)}
            className="ml-1 text-sm text-muted-foreground sm:inline flex! items-center"
            aria-label={t('task.rate')}
          >
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Star
                className={`w-5 h-5 ${
                  rating ? 'text-amber-400' : 'text-muted-foreground'
                }`}
                {...(rating ? { fill: 'currentColor' } : {})}
              />
            </Button>
            {t('task.rate') || '评分'}
          </button>
        </div>
      </div>
      <ShareModal
        taskId={taskId ?? ''}
        open={shareOpen}
        onOpenChange={v => setShareOpen(v)}
      />
      <RatingModal
        taskId={taskId ?? ''}
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        onSaved={() => {
          setRatingOpen(false)
        }}
      />
    </header>
  )
}
