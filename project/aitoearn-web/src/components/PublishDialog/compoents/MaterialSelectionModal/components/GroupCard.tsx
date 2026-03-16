/**
 * GroupCard - 分组卡片组件
 * 用于素材选择器中展示分组
 * 支持 hover 动效
 */

'use client'

import type { GroupCardProps } from '../types'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Video } from 'lucide-react'
import Image from 'next/image'
import { useTransClient } from '@/app/i18n/client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'

export function GroupCard({ group, onClick }: GroupCardProps) {
  const { t } = useTransClient('material')
  const isVideo = group.type === 'video'
  const isDefault = group.isDefault

  // 获取封面 URL
  const hasCover = group.cover || group.previewMedia?.thumbUrl
  const coverUrl
    = group.cover || (group.previewMedia?.thumbUrl ? getOssUrl(group.previewMedia.thumbUrl) : '')

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(group)}
      className={cn(
        'w-full text-left rounded-xl border border-border bg-card overflow-hidden cursor-pointer group',
        'hover:border-primary hover:shadow-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
      )}
    >
      {/* 封面区域 */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {hasCover ? (
          <Image
            src={coverUrl}
            alt={group.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          // 无封面占位符
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center',
              isVideo
                ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10'
                : 'bg-gradient-to-br from-green-500/10 to-teal-500/10',
            )}
          >
            {isVideo ? (
              <>
                <Video className="w-10 h-10 text-blue-500/50 mb-1.5" />
                <span className="text-xs text-muted-foreground">{t('mediaManagement.video')}</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-green-500/50 mb-1.5" />
                <span className="text-xs text-muted-foreground">{t('mediaManagement.image')}</span>
              </>
            )}
          </div>
        )}

        {/* 默认标签 */}
        {isDefault && (
          <Badge className="absolute top-2 left-2 bg-amber-500/90 hover:bg-amber-500/90 text-white text-xs border-0 backdrop-blur-sm">
            {t('mediaManagement.default')}
          </Badge>
        )}

        {/* 类型图标 */}
        <Badge
          className={cn(
            'absolute bottom-2 left-2 backdrop-blur-sm text-xs',
            isVideo
              ? 'bg-blue-500/80 hover:bg-blue-500/80 text-white'
              : 'bg-green-500/80 hover:bg-green-500/80 text-white',
          )}
        >
          {isVideo ? <Video className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
          {isVideo ? t('mediaManagement.video') : t('mediaManagement.image')}
        </Badge>

        {/* 资源数量 */}
        <Badge
          variant="secondary"
          className="absolute bottom-2 right-2 backdrop-blur-sm bg-black/50 hover:bg-black/50 text-white border-0 text-xs"
        >
          {group.count || 0}
          {' '}
          {t('mediaManagement.resources')}
        </Badge>

        {/* Hover 遮罩 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
      </div>

      {/* 标题区域 */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-foreground truncate">{group.title}</h3>
        {group.desc && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{group.desc}</p>
        )}
      </div>
    </motion.button>
  )
}
