/**
 * ChatHeader - 对话页面顶部导航栏
 * 显示返回按钮、标题、生成状态
 */
'use client'

import Image from 'next/image'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import logo from '@/assets/images/logo.png'

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
}: IChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
      {/* 返回按钮 */}
      <Button variant="ghost" size="icon" onClick={onBack} className="w-8 h-8">
        <ArrowLeft className="w-5 h-5" />
      </Button>

      {/* Logo 和标题 */}
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
          {title || defaultTitle}
        </h1>
      </div>

      {/* 生成状态指示器 */}
      {isGenerating && (
        <div className="ml-auto flex items-center gap-2 text-sm text-purple-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{thinkingText}</span>
          {progress > 0 && progress < 100 && (
            <span className="text-xs text-gray-500">({progress}%)</span>
          )}
        </div>
      )}
    </header>
  )
}

