'use client'

import type { IUploadedMedia } from '../MediaUpload'
import { FileText, Play } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'

interface MediaGalleryProps {
  medias: IUploadedMedia[]
  onPreviewByIndex?: (index: number) => void
  onPreviewByUrl?: (url: string) => void
}

export function MediaGallery({ medias, onPreviewByIndex, onPreviewByUrl }: MediaGalleryProps) {
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

        const isVideo = media.type === 'video'
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
              'w-28 h-20 rounded-lg overflow-hidden border border-border bg-muted relative',
              'flex items-center justify-center p-0',
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
              <img src={url} alt={media.name || `media-${idx}`} className="w-full h-full object-cover" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default MediaGallery
