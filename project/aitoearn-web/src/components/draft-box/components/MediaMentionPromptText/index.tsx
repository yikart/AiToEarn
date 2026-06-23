/**
 * MediaMentionPromptText - 只读提示词媒体提及渲染
 * 将提示词中的 @Image / @Video / @Audio 资源引用展示为内联 chip。
 */

'use client'

import type { ReactNode } from 'react'
import { FileImage, Music, Play } from 'lucide-react'
import { memo, useMemo } from 'react'
import { OssImage } from '@/components/common/OssImage'
import { useVideoThumbnail } from '@/hooks/useVideoThumbnail'
import { cn } from '@/utils/className'
import { getOssUrl } from '@/utils/oss'
import { getDraftBoxMediaFileName } from '../../utils/mediaFileName'
import styles from './MediaMentionPromptText.module.scss'

type MediaMentionType = 'image' | 'video' | 'audio'

interface MediaMentionAsset {
  token: string
  type: MediaMentionType
  src: string
  displayName: string
}

interface MediaMentionPromptTextProps {
  prompt: string
  imageUrls?: string[]
  videoUrls?: string[]
  audioUrls?: string[]
  className?: string
  compact?: boolean
}

const MEDIA_MENTION_TOKEN_PATTERN = /(@(?:Image[1-9]|Video[1-3]|Audio[1-3]))/g

function createMentionAssets(imageUrls: string[], videoUrls: string[], audioUrls: string[]) {
  const assets = new Map<string, MediaMentionAsset>()

  imageUrls.slice(0, 9).forEach((url, index) => {
    const token = `@Image${index + 1}`
    const src = getOssUrl(url)
    assets.set(token, {
      token,
      type: 'image',
      src,
      displayName: getDraftBoxMediaFileName(url),
    })
  })

  videoUrls.slice(0, 3).forEach((url, index) => {
    const token = `@Video${index + 1}`
    const src = getOssUrl(url)
    assets.set(token, {
      token,
      type: 'video',
      src,
      displayName: getDraftBoxMediaFileName(url),
    })
  })

  audioUrls.slice(0, 3).forEach((url, index) => {
    const token = `@Audio${index + 1}`
    const src = getOssUrl(url)
    assets.set(token, {
      token,
      type: 'audio',
      src,
      displayName: getDraftBoxMediaFileName(url),
    })
  })

  return assets
}

const MediaMentionChip = memo(({ asset, compact }: { asset: MediaMentionAsset, compact: boolean }) => {
  const videoThumbnailUrl = useVideoThumbnail(asset.type === 'video' ? asset.src : null)
  const title = `${asset.displayName} · ${asset.token}`

  return (
    <span className={cn(styles.chip, compact && styles.chipCompact)} title={title}>
      <span className={cn(styles.thumb, asset.type === 'audio' && styles.audioThumb)} aria-hidden="true">
        {asset.type === 'image'
          ? (
              <OssImage
                src={asset.src}
                alt=""
                fill
                className="object-cover"
                sizes={compact ? '18px' : '20px'}
              />
            )
          : asset.type === 'video' && videoThumbnailUrl
            ? (
                <OssImage
                  src={videoThumbnailUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes={compact ? '18px' : '20px'}
                  unoptimized={videoThumbnailUrl.startsWith('data:')}
                />
              )
            : asset.type === 'audio'
              ? <Music className={styles.thumbIcon} />
              : asset.type === 'video'
                ? <Play className={styles.thumbIcon} />
                : <FileImage className={styles.thumbIcon} />}
      </span>
      <span className={styles.name}>{asset.displayName}</span>
    </span>
  )
})

MediaMentionChip.displayName = 'MediaMentionChip'

const MediaMentionPromptText = memo(({
  prompt,
  imageUrls = [],
  videoUrls = [],
  audioUrls = [],
  className,
  compact = false,
}: MediaMentionPromptTextProps) => {
  const assetsByToken = useMemo(
    () => createMentionAssets(imageUrls, videoUrls, audioUrls),
    [audioUrls, imageUrls, videoUrls],
  )

  const nodes = useMemo<ReactNode[]>(() => {
    return prompt.split(MEDIA_MENTION_TOKEN_PATTERN).filter(Boolean).map((part, index) => {
      const asset = assetsByToken.get(part)
      if (!asset)
        return part

      return <MediaMentionChip key={`${part}-${index}`} asset={asset} compact={compact} />
    })
  }, [assetsByToken, compact, prompt])

  return (
    <span className={cn(styles.root, compact && styles.rootCompact, className)}>
      {nodes}
    </span>
  )
})

MediaMentionPromptText.displayName = 'MediaMentionPromptText'

export default MediaMentionPromptText
