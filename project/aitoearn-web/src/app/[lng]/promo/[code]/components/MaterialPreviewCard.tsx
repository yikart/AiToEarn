/**
 * MaterialPreviewCard - 素材预览卡片组件
 * 显示推荐的发布素材预览
 */

'use client'

import type { OptimalMaterialVo } from '@/api/types/open/promotionCode'
import { Eye, Image as ImageIcon, Play, Video } from 'lucide-react'
import Image from 'next/image'
import { memo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import MediaPreview from '@/components/common/MediaPreview'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getOssUrl } from '@/utils/oss'

interface MaterialPreviewCardProps {
  material: OptimalMaterialVo
}

export const MaterialPreviewCard = memo(({ material }: MaterialPreviewCardProps) => {
  const { t } = useTransClient('promo')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  // 判断是否有视频
  const hasVideo = material.mediaList?.some(m => m.type === 'video')

  // 获取封面URL
  const coverUrl = material.coverUrl
    ? getOssUrl(material.coverUrl)
    : material.mediaList?.[0]?.thumbUrl
      ? getOssUrl(material.mediaList[0].thumbUrl)
      : material.mediaList?.[0]?.url
        ? getOssUrl(material.mediaList[0].url)
        : undefined

  // 处理媒体点击
  const handleMediaClick = (index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  // 准备预览数据
  const previewItems
    = material.mediaList?.map(m => ({
      type: m.type as 'video' | 'image',
      src: getOssUrl(m.url) || '',
      title: material.title,
    })) || []

  return (
    <>
      <Card className="p-0">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                {hasVideo ? <Video className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                {t('material.title')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('material.description')}</p>
            </div>
            {material.useCount > 0 && (
              <Badge variant="secondary">
                {t('material.usedCount').replace('{{count}}', String(material.useCount))}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 px-6 pb-6">
          {/* 封面/缩略图 */}
          {coverUrl && (
            <div
              className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-muted"
              onClick={() => handleMediaClick(0)}
            >
              <Image
                src={coverUrl}
                alt={material.title || t('material.preview')}
                fill
                className="object-cover transition-transform hover:scale-105"
              />
              {hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                    <Play className="h-6 w-6 text-primary" fill="currentColor" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 right-2">
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 bg-black/60 text-white"
                >
                  <Eye className="h-3 w-3" />
                  {t('material.clickToPreview')}
                </Badge>
              </div>
            </div>
          )}

          {/* 标题和描述 */}
          {material.title && (
            <div className="space-y-1">
              <h4 className="font-medium">{material.title}</h4>
              {material.desc && (
                <p className="text-sm text-muted-foreground line-clamp-3">{material.desc}</p>
              )}
            </div>
          )}

          {/* 多媒体缩略图 */}
          {material.mediaList && material.mediaList.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {material.mediaList.slice(0, 4).map((media, index) => (
                <div
                  key={index}
                  className="relative aspect-square cursor-pointer overflow-hidden rounded-md bg-muted"
                  onClick={() => handleMediaClick(index)}
                >
                  <Image
                    src={getOssUrl(media.thumbUrl || media.url) || ''}
                    alt={`${t('material.preview')} ${index + 1}`}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                  />
                  {media.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-4 w-4 text-white" fill="currentColor" />
                    </div>
                  )}
                  {index === 3 && material.mediaList!.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                      +
                      {material.mediaList!.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* 媒体预览弹窗 */}
      {previewItems.length > 0 && (
        <MediaPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          items={previewItems}
          initialIndex={previewIndex}
        />
      )}
    </>
  )
})

MaterialPreviewCard.displayName = 'MaterialPreviewCard'
