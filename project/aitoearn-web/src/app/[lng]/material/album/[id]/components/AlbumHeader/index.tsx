/**
 * AlbumHeader - 相册页顶部组件
 * 包含返回按钮、标题、上传按钮
 */

'use client'

import type { GroupInfo } from '../../albumStore'
import { ArrowLeft, Image as ImageIcon, Plus, Video } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'

interface AlbumHeaderProps {
  /** 分组信息 */
  groupInfo: GroupInfo | null
  /** 总数量 */
  total: number
  /** 是否正在上传 */
  isUploading?: boolean
  /** 允许的文件类型 */
  acceptTypes: string
  /** 上传多个文件回调 */
  onUpload: (files: File[]) => void
}

export function AlbumHeader({
  groupInfo,
  total,
  isUploading,
  acceptTypes,
  onUpload,
}: AlbumHeaderProps) {
  const { t } = useTransClient('material')
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 返回素材库
  const handleBack = useCallback(() => {
    router.push('/material')
  }, [router])

  // 触发文件选择
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 处理文件选择
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        onUpload(Array.from(files))
      }
      // 清空文件选择，允许重复选择同一文件
      e.target.value = ''
    },
    [onUpload],
  )

  // 获取类型显示文本
  const getTypeText = () => {
    if (!groupInfo)
      return t('mediaManagement.mediaResources')
    return groupInfo.type === 'video' ? t('mediaManagement.video') : t('mediaManagement.image')
  }

  // 获取上传按钮文本
  const getUploadText = () => {
    if (!groupInfo)
      return t('mediaManagement.upload')
    return groupInfo.type === 'video'
      ? t('mediaManagement.uploadVideo')
      : t('mediaManagement.uploadImage')
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack} className="w-8 h-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          {groupInfo?.type === 'video' ? (
            <Video className="w-5 h-5 text-blue-500" />
          ) : (
            <ImageIcon className="w-5 h-5 text-green-500" />
          )}
          <h1 className="text-lg font-semibold text-foreground">
            {groupInfo?.title || t('mediaManagement.mediaResources')}
          </h1>
          <span className="text-sm text-muted-foreground">
            ·
            {getTypeText()}
          </span>
        </div>

        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            (
            {total}
            )
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />

        {/* 上传按钮 */}
        <Button onClick={handleUploadClick} disabled={isUploading} loading={isUploading} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">{getUploadText()}</span>
          <span className="sm:hidden">{t('mediaManagement.upload')}</span>
        </Button>
      </div>
    </header>
  )
}
