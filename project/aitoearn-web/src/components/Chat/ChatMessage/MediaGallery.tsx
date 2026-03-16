'use client'

import type { IUploadedMedia } from '../MediaUpload'
import { FileText, Play } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'

/** 视频文件扩展名列表 */
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.wmv', '.flv']

/** 通过 URL 扩展名判断是否为视频 */
function isVideoUrl(url: string): boolean {
  if (!url)
    return false
  const lowerUrl = url.toLowerCase().split('?')[0] // 移除查询参数
  return VIDEO_EXTENSIONS.some(ext => lowerUrl.endsWith(ext))
}

interface MediaGalleryProps {
  medias: IUploadedMedia[]
  onPreviewByIndex?: (index: number) => void
  onPreviewByUrl?: (url: string) => void
  /** 媒体项尺寸：default (112x80) 用于 AI 消息，large (160x112) 用于用户消息 */
  size?: 'default' | 'large'
}

/** 尺寸样式映射 */
const SIZE_CLASSES = {
  default: 'w-28 h-20', // 112px x 80px
  large: 'w-56 h-40', // 224px x 160px
} as const

export function MediaGallery({
  medias,
  onPreviewByIndex,
  onPreviewByUrl,
  size = 'default',
}: MediaGalleryProps) {
  if (!medias || medias.length === 0)
    return null

  return (
    <div className="flex flex-wrap gap-2">
      {medias.map((media, idx) => {
        if (media.type === 'document') {
          return (
            <a
              key={idx}
              href={getOssUrl(media.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted hover:bg-muted/80 transition-colors"
            >
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground truncate max-w-[200px]">
                {media.name || 'Document'}
              </span>
            </a>
          )
        }

        // 通过 URL 扩展名判断是否为视频（比 media.type 更准确）
        const isVideo = isVideoUrl(media.url)
        const url = getOssUrl(media.url)

        return (
          <button
            key={idx}
            type="button"
            onClick={() => {
              if (onPreviewByIndex) {
                onPreviewByIndex(idx)
              }
              else if (onPreviewByUrl) {
                onPreviewByUrl(media.url)
              }
            }}
            className={cn(
              SIZE_CLASSES[size],
              'rounded-lg overflow-hidden border border-border bg-muted relative',
              'flex items-center justify-center p-0 cursor-pointer',
            )}
          >
            {isVideo ? (
              <>
                <video src={url} className="w-full h-full object-cover" preload="metadata" muted />
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Play className="w-6 h-6 text-white/90" />
                </span>
              </>
            ) : (
              <img
                src={url}
                alt={media.name || `media-${idx}`}
                className="w-full h-full object-cover"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default MediaGallery
