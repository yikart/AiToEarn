/**
 * MediaUpload - 媒体上传预览组件
 * 功能：图片/视频上传预览，支持上传进度显示
 */

'use client'

import { useRef } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'

/** 上传的媒体文件类型 */
export interface IUploadedMedia {
  url: string
  type: 'image' | 'video'
  /** 上传进度 0-100，undefined 表示上传完成 */
  progress?: number
  /** 本地文件对象，用于预览 */
  file?: File
}

export interface IMediaUploadProps {
  /** 已上传的媒体列表 */
  medias: IUploadedMedia[]
  /** 是否正在上传 */
  isUploading?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 文件变更回调 */
  onFilesChange?: (files: FileList) => void
  /** 移除媒体回调 */
  onRemove?: (index: number) => void
  /** 最大上传数量 */
  maxCount?: number
  /** 自定义类名 */
  className?: string
}

/**
 * MediaUpload - 媒体上传预览组件
 */
export function MediaUpload({
  medias,
  isUploading = false,
  disabled = false,
  onFilesChange,
  onRemove,
  maxCount = 9,
  className,
}: IMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** 处理文件选择 */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFilesChange?.(files)
    }
    // 重置 input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /** 触发文件选择 */
  const handleUploadClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  /** 获取媒体预览 URL */
  const getPreviewUrl = (media: IUploadedMedia) => {
    if (media.file) {
      return URL.createObjectURL(media.file)
    }
    return getOssUrl(media.url)
  }

  const canUploadMore = medias.length < maxCount

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* 已上传的媒体列表 */}
      {medias.map((media, index) => (
        <div
          key={index}
          className="relative group w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
        >
          {/* 媒体预览 */}
          {media.type === 'video' ? (
            <video
              src={getPreviewUrl(media)}
              className="w-full h-full object-cover"
              muted
            />
          ) : (
            <img
              src={getPreviewUrl(media)}
              alt={`media-${index}`}
              className="w-full h-full object-cover"
            />
          )}

          {/* 上传进度遮罩 */}
          {media.progress !== undefined && media.progress < 100 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="white"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${media.progress * 0.75} 75`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-medium">
                  {media.progress}%
                </span>
              </div>
            </div>
          )}

          {/* 视频上传完成标记 */}
          {media.type === 'video' && media.progress === undefined && (
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded">
              Video
            </div>
          )}

          {/* 删除按钮 */}
          {!disabled && media.progress === undefined && (
            <button
              onClick={() => onRemove?.(index)}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {/* 上传按钮 */}
      {canUploadMore && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            disabled={disabled || isUploading}
            className={cn(
              'w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center transition-all',
              'hover:border-purple-400 hover:bg-purple-50',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent',
            )}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </>
      )}
    </div>
  )
}

export default MediaUpload

