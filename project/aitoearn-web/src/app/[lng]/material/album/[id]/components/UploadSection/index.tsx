/**
 * AlbumEmptyState - 相册空状态组件
 * 当没有媒体资源时显示
 */

'use client'

import type { GroupInfo } from '../../albumStore'
import { Image as ImageIcon, Plus, Video } from 'lucide-react'
import { useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'

interface AlbumEmptyStateProps {
  /** 分组信息 */
  groupInfo: GroupInfo | null
  /** 允许的文件类型 */
  acceptTypes: string
  /** 上传多个文件回调 */
  onUpload: (files: File[]) => void
  /** 是否正在上传 */
  isUploading?: boolean
}

export function AlbumEmptyState({
  groupInfo,
  acceptTypes,
  onUpload,
  isUploading,
}: AlbumEmptyStateProps) {
  const { t } = useTransClient('material')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 触发文件选择
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onUpload(Array.from(files))
    }
    e.target.value = ''
  }

  const isVideo = groupInfo?.type === 'video'

  // 获取类型文本用于提示
  const getTypeLabel = () => {
    return isVideo ? t('mediaManagement.video') : t('mediaManagement.image')
  }

  // 获取上传按钮文本
  const getUploadButtonText = () => {
    return isVideo ? t('mediaManagement.uploadVideo') : t('mediaManagement.uploadImage')
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      {/* 图标 */}
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        {isVideo ? (
          <Video className="w-10 h-10 text-blue-500/50" />
        ) : (
          <ImageIcon className="w-10 h-10 text-green-500/50" />
        )}
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-medium text-foreground mb-2">{t('mediaManagement.noMedia')}</h3>

      {/* 描述 */}
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        {t('mediaManagement.uploadMediaHint', { type: getTypeLabel() })}
      </p>

      {/* 上传按钮 */}
      <Button onClick={handleUploadClick} disabled={isUploading} loading={isUploading}>
        <Plus className="w-4 h-4 mr-2" />
        {getUploadButtonText()}
      </Button>
    </div>
  )
}
