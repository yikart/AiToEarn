/**
 * MediaUpload - 媒体上传预览组件
 * 功能：图片/视频上传预览，支持上传进度显示，支持图片编辑
 */

'use client'

import { FileText, Loader2, Pencil, Plus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { MediaPreview } from '@/components/common/MediaPreview'
import { BrushEditor } from '@/components/common/MediaPreview/BrushEditor'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'

/** 上传的媒体文件类型 */
export interface IUploadedMedia {
  /** 唯一标识（用于进度、删除等场景的精确匹配） */
  id?: string
  url: string
  type: 'image' | 'video' | 'document'
  /** 上传进度 0-100，undefined 表示上传完成 */
  progress?: number
  /** 本地文件对象，用于预览 */
  file?: File
  /** 文档名称（document 类型使用） */
  name?: string
  /** 缓存控制（可选） */
  cache_control?: {
    type: 'ephemeral'
  }
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0)
    return ''
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
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
  /** 是否显示媒体列表（只显示上传按钮时可关闭） */
  showList?: boolean
  /** 是否显示上传按钮（只做预览时可关闭） */
  showUploadButton?: boolean
  /** 上传按钮样式：网格方块（默认）或小圆形图标按钮 */
  buttonVariant?: 'grid' | 'icon'
  /** 自定义类名 */
  className?: string
  /** 是否启用编辑功能 */
  editable?: boolean
  /** 媒体更新回调（编辑后替换） */
  onMediaUpdate?: (index: number, newUrl: string) => void
  /** 文件选择过滤 */
  accept?: string
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
  maxCount = 5,
  showList = true,
  showUploadButton = true,
  buttonVariant = 'grid',
  className,
  editable = true,
  onMediaUpdate,
  accept = '*/*',
}: IMediaUploadProps) {
  const { t } = useTransClient('chat')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  /** 缓存的 ObjectURL 集合 */
  const previewUrls = useMemo(() => {
    return medias.map((media) => {
      if (media.file) {
        return URL.createObjectURL(media.file)
      }
      return getOssUrl(media.url)
    })
  }, [medias])

  /** 清理 ObjectURL，防止内存泄漏 */
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [previewUrls])

  /** 处理文件选择 */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const remaining = Math.max(0, maxCount - medias.length)
      if (remaining <= 0) {
        // 已达到最大数量，直接忽略本次选择
      }
      else if (files.length > remaining) {
        // 只取前 remaining 个文件
        const dt = new DataTransfer()
        for (let i = 0; i < remaining; i++) {
          dt.items.add(files[i])
        }
        onFilesChange?.(dt.files)
      }
      else {
        onFilesChange?.(files)
      }
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

  const canUploadMore = medias.length < maxCount

  /** 打开预览 */
  const handlePreview = (index: number) => {
    const media = medias[index]
    if (!media)
      return
    if (media.type === 'document')
      return
    setPreviewIndex(index)
  }

  const handleClosePreview = () => {
    setPreviewIndex(null)
  }

  /** 打开编辑器（从缩略图） */
  const handleOpenEditor = useCallback(
    (index: number) => {
      const media = medias[index]
      if (!media || media.type !== 'image')
        return
      setEditingIndex(index)
    },
    [medias],
  )

  /** 编辑保存回调 */
  const handleEditorSave = useCallback(
    (newUrl: string) => {
      if (editingIndex !== null) {
        onMediaUpdate?.(editingIndex, newUrl)
      }
      setEditingIndex(null)
    },
    [editingIndex, onMediaUpdate],
  )

  /** MediaPreview 中编辑保存回调 */
  const handlePreviewEdit = useCallback(
    (index: number, newUrl: string) => {
      onMediaUpdate?.(index, newUrl)
    },
    [onMediaUpdate],
  )

  return (
    <div
      className={cn('flex items-center gap-2', buttonVariant === 'grid' && 'flex-wrap', className)}
    >
      {/* 已上传的媒体列表 */}
      {showList
        && medias.map((media, index) => (
          <div
            key={`${media.url}-${index}`}
            className={cn(
              'relative group rounded-lg overflow-hidden border border-border bg-muted',
              media.type === 'document' || media.type === 'video'
                ? 'min-w-[220px] h-14'
                : 'w-14 h-14',
            )}
          >
            {/* 媒体预览 */}
            {media.type === 'document' ? (
              <div className="flex items-center gap-3 h-full px-3 bg-background">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-red-500/10 text-red-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-xs font-medium text-foreground truncate max-w-[160px]">
                    {media.name || media.file?.name || t('media.document' as any)}
                  </span>
                  {media.file && (
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {formatFileSize(media.file.size)}
                    </span>
                  )}
                </div>
              </div>
            ) : media.type === 'video' ? (
              <button
                type="button"
                onClick={() => handlePreview(index)}
                className="flex items-center gap-3 h-full w-full px-3 bg-background text-left cursor-pointer"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/10 text-blue-500">
                  <span className="text-[11px] font-semibold">VID</span>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-xs font-medium text-foreground truncate max-w-[160px]">
                    {media.name || media.file?.name || 'video'}
                  </span>
                  {media.file && (
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {formatFileSize(media.file.size)}
                    </span>
                  )}
                </div>
              </button>
            ) : (
              <img
                src={previewUrls[index]}
                alt={`media-${index}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => handlePreview(index)}
              />
            )}

            {/* 编辑按钮（仅图片类型且启用编辑时显示） */}
            {!disabled
              && editable
              && onMediaUpdate
              && media.type === 'image'
              && media.progress === undefined && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenEditor(index)
                }}
                className={cn(
                  'absolute bottom-1 right-1 z-10 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer',
                  'bg-background/95 text-muted-foreground shadow-sm border border-border/70',
                  'hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors',
                )}
                aria-label={t('media.edit' as any)}
                type="button"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
            )}

            {/* 上传进度遮罩：仅在进度未完成时显示，由 Hook 负责在完成时清理 progress */}
            {media.progress !== undefined && media.progress < 100 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                {media.type === 'image' ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
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
                        strokeDasharray={`${(media.progress || 0) * 0.75} 75`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-medium">
                      {media.progress}
                      %
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 删除按钮（上传中和上传完成都可关闭） */}
            {!disabled && (
              <button
                onClick={() => onRemove?.(index)}
                className={cn(
                  'absolute top-1 right-1 z-10 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer',
                  'bg-background/95 text-muted-foreground shadow-sm border border-border/70',
                  'hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors',
                )}
                aria-label={t('media.remove' as any)}
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

      {/* 上传按钮 */}
      {showUploadButton && canUploadMore && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            disabled={buttonVariant === 'grid' ? disabled || isUploading : disabled}
            className={cn(
              buttonVariant === 'grid'
                ? cn(
                    'w-14 h-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center transition-all cursor-pointer',
                    'hover:border-primary hover:bg-primary/10',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent',
                  )
                : cn(
                    // 小圆形图标按钮：更精致的聊天操作样式
                    'w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground transition-all cursor-pointer',
                    'bg-background border border-border/80 hover:bg-primary/5 hover:border-primary/60',
                    'shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border/80',
                  ),
            )}
            aria-label="Upload media"
            type="button"
          >
            {buttonVariant === 'grid' && isUploading ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </>
      )}

      {/* 预览大图 / 视频 - 使用全局 MediaPreview 组件 */}
      <MediaPreview
        open={previewIndex !== null}
        items={previewUrls.map((src, idx) => ({
          type: medias[idx]?.type === 'video' ? 'video' : 'image',
          src,
          title: medias[idx]?.name || medias[idx]?.file?.name,
        }))}
        initialIndex={previewIndex ?? 0}
        onClose={handleClosePreview}
        editable={editable}
        onEdit={handlePreviewEdit}
      />

      {/* 缩略图编辑器 */}
      {editable && editingIndex !== null && medias[editingIndex] && (
        <BrushEditor
          open={true}
          imageUrl={previewUrls[editingIndex]}
          onClose={() => setEditingIndex(null)}
          onSave={handleEditorSave}
        />
      )}
    </div>
  )
}

export default MediaUpload
