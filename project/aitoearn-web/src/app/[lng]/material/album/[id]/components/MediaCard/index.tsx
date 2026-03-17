/**
 * MediaCard - 媒体卡片组件
 * 展示单个媒体资源（图片/视频）
 */

'use client'

import type { Media } from '../../albumStore'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Play, Trash2, Video } from 'lucide-react'
import Image from 'next/image'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { confirm } from '@/lib/confirm'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'

interface MediaCardProps {
  /** 媒体数据 */
  media: Media
  /** 点击预览回调 */
  onPreview: (media: Media) => void
  /** 删除回调 */
  onDelete: (id: string) => void
  /** 是否正在删除 */
  isDeleting?: boolean
}

export function MediaCard({ media, onPreview, onDelete, isDeleting }: MediaCardProps) {
  const { t } = useTransClient('material')

  // 处理点击预览
  const handleClick = () => {
    onPreview(media)
  }

  // 处理删除
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = await confirm({
      title: t('mediaManagement.delete'),
      content: t('mediaManagement.deleteMediaConfirm'),
      okText: t('mediaManagement.delete'),
      cancelText: t('mediaManagement.cancel'),
      okType: 'destructive',
    })
    if (confirmed) {
      onDelete(media._id)
    }
  }

  const isVideo = media.type === 'video'
  // 优先使用缩略图，其次使用原图
  const thumbUrl = getOssUrl(media.thumbUrl || media.url)

  // 格式化创建时间
  const formatCreatedAt = () => {
    if (!media.createdAt)
      return null
    return dayjs(media.createdAt).format('YYYY-MM-DD HH:mm')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden cursor-pointer group',
        'hover:shadow-lg transition-shadow duration-200',
        isDeleting && 'opacity-50 pointer-events-none',
      )}
    >
      {/* 媒体预览区域 */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {/* 缩略图 */}
        <Image
          src={thumbUrl}
          alt={media.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* 视频播放按钮覆盖层 */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-blue-500 ml-1" />
            </div>
          </div>
        )}

        {/* 删除按钮 */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 bg-black/50 hover:bg-destructive text-white border-0 backdrop-blur-sm"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* 类型图标 */}
        <div
          className={cn(
            'absolute bottom-2 left-2 w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm',
            isVideo ? 'bg-blue-500/80' : 'bg-green-500/80',
          )}
        >
          {isVideo ? (
            <Video className="w-3 h-3 text-white" />
          ) : (
            <ImageIcon className="w-3 h-3 text-white" />
          )}
        </div>
      </div>

      {/* 标题和时间区域 */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground truncate">{media.title}</h3>
        {media.desc && <p className="text-xs text-muted-foreground truncate mt-1">{media.desc}</p>}
        {formatCreatedAt() && (
          <p className="text-xs text-muted-foreground mt-1">
            {t('mediaManagement.createdAt')}
            {' '}
            {formatCreatedAt()}
          </p>
        )}
      </div>
    </motion.div>
  )
}
