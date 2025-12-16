/**
 * ChatMessage - 聊天消息气泡组件
 * 功能：显示用户消息或AI回复，支持媒体附件和状态
 */

'use client'

import Image from 'next/image'
import { Loader2, AlertCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IUploadedMedia } from '../MediaUpload'

export interface IChatMessageProps {
  /** 消息角色 */
  role: 'user' | 'assistant'
  /** 消息内容 */
  content: string
  /** 媒体附件 */
  medias?: IUploadedMedia[]
  /** 消息状态 */
  status?: 'pending' | 'streaming' | 'done' | 'error'
  /** 错误信息 */
  errorMessage?: string
  /** 创建时间 */
  createdAt?: number
  /** 自定义类名 */
  className?: string
}

/**
 * ChatMessage - 聊天消息气泡组件
 */
export function ChatMessage({
  role,
  content,
  medias = [],
  status = 'done',
  errorMessage,
  className,
}: IChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className,
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden',
          isUser ? 'bg-purple-500' : 'bg-gradient-to-br from-purple-500 to-pink-500',
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Image
            src="/images/logo.png"
            alt="AiToEarn"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 消息内容 */}
      <div className={cn('flex flex-col gap-2 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        {/* 媒体附件 */}
        {medias.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {medias.map((media, index) => (
              <div
                key={index}
                className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                {media.type === 'video' ? (
                  <video
                    src={media.url}
                    className="w-full h-full object-cover"
                    muted
                    controls
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={`attachment-${index}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 文本内容 */}
        {content && (
          <div
            className={cn(
              'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
              isUser
                ? 'bg-purple-500 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-900 rounded-bl-md',
            )}
          >
            {content}
          </div>
        )}

        {/* 加载状态 */}
        {status === 'pending' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 rounded-bl-md">
            <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
            <span className="text-sm text-gray-500">Thinking...</span>
          </div>
        )}

        {/* 流式输出状态 */}
        {status === 'streaming' && !content && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 rounded-bl-md">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {status === 'error' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-600 rounded-bl-md">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{errorMessage || 'Generation failed, please retry'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessage

