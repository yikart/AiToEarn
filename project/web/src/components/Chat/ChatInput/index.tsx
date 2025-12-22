/**
 * ChatInput - 聊天输入组件
 * 功能：文本输入、媒体上传、发送消息
 * 支持首页大尺寸和对话详情页固定底部两种模式
 */

'use client'

import { useRef, useState, useEffect, KeyboardEvent } from 'react'
import { ArrowUp, Loader2, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MediaUpload, type IUploadedMedia } from '../MediaUpload'

export interface IChatInputProps {
  /** 输入内容 */
  value: string
  /** 内容变更回调 */
  onChange: (value: string) => void
  /** 发送回调 */
  onSend: () => void
  /** 停止生成回调 */
  onStop?: () => void
  /** 已上传的媒体 */
  medias?: IUploadedMedia[]
  /** 媒体文件变更回调 */
  onMediasChange?: (files: FileList) => void
  /** 移除媒体回调 */
  onMediaRemove?: (index: number) => void
  /** 是否正在生成 */
  isGenerating?: boolean
  /** 是否正在上传 */
  isUploading?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 占位文本 */
  placeholder?: string
  /** 显示模式：large-首页大尺寸，compact-对话详情页 */
  mode?: 'large' | 'compact'
  /** 自定义类名 */
  className?: string
}

/**
 * ChatInput - 聊天输入组件
 */
export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  medias = [],
  onMediasChange,
  onMediaRemove,
  isGenerating = false,
  isUploading = false,
  disabled = false,
  placeholder = '输入你想创作的内容...',
  mode = 'large',
  className,
}: IChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  /** 自动调整高度
   * - large 模式：根据内容自适应高度（最多 200px）
   * - compact 模式：保持单行起步，允许根据内容适度增高
   */
  useEffect(() => {
    if (!textareaRef.current) return

    if (mode === 'large') {
      textareaRef.current.style.height = 'auto'
      const maxHeight = 200
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
    } else {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, mode])

  /** 处理键盘事件 */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 发送，Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && !isGenerating && !isUploading && value.trim()) {
        onSend()
      }
    }
  }

  /** 处理发送/停止按钮点击 */
  const handleButtonClick = () => {
    // 中断功能暂时禁用
    // if (isGenerating) {
    //   onStop?.()
    // } else 
    if (!disabled && !isUploading && value.trim() && !isGenerating) {
      onSend()
    }
  }

  const canSend = !disabled && !isUploading && value.trim()

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 2,
      }}
      className={cn(
        'w-full rounded-2xl border bg-card transition-all duration-300 border-border shadow-sm hover:border-border/80 hover:shadow-md',
        mode === 'large' ? 'p-4' : 'p-3',
        // 详情页（compact 模式）允许输入区域根据父容器拉伸
        mode === 'compact' && 'h-full flex flex-col',
        className,
      )}
    >
      {/* 第一层：媒体预览区域（只有有媒体时展示） */}
      {medias.length > 0 && (
        <div className="mb-3">
          <MediaUpload
            medias={medias}
            isUploading={isUploading}
            disabled={disabled || isGenerating}
            onFilesChange={onMediasChange}
            onRemove={onMediaRemove}
            showUploadButton={false}
          />
        </div>
      )}

      {/* 第二层：文本输入区域 */}
      <div className={cn('flex-1', mode === 'compact' && 'w-full')}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled || isGenerating}
          rows={mode === 'large' ? 3 : 1}
          className={cn(
            'w-full resize-none border-none outline-none focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            mode === 'large' ? 'text-base min-h-[80px]' : 'text-sm min-h-[40px]',
          )}
        />
      </div>

      {/* 第三层：操作栏（左侧其他操作，右侧发送按钮） */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {/* 左侧：其它操作（当前仅上传按钮） */}
        <div className="flex items-center gap-2">
          <MediaUpload
            medias={medias}
            isUploading={isUploading}
            disabled={disabled || isGenerating}
            onFilesChange={onMediasChange}
            onRemove={onMediaRemove}
            showList={false}
            buttonVariant="icon"
          />
        </div>

        {/* 右侧：发送/停止按钮 */}
        <button
          onClick={handleButtonClick}
          disabled={isGenerating || !canSend}
          className={cn(
            'shrink-0 flex items-center justify-center rounded-full transition-all',
            mode === 'large' ? 'w-10 h-10' : 'w-8 h-8',
            // 生成中或无法发送时都显示灰色
            (isGenerating || !canSend)
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground',
          )}
        >
          {isGenerating ? (
            <Square className={cn(mode === 'large' ? 'w-4 h-4' : 'w-3 h-3')} fill="currentColor" />
          ) : isUploading ? (
            <Loader2 className={cn('animate-spin', mode === 'large' ? 'w-5 h-5' : 'w-4 h-4')} />
          ) : (
            <ArrowUp className={cn(mode === 'large' ? 'w-5 h-5' : 'w-4 h-4')} />
          )}
        </button>
      </div>
    </div>
  )
}

export default ChatInput

