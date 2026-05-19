/**
 * GenerationParamsCard 组件
 * 展示草稿或生成任务的 AI 请求参数
 */

'use client'

import type { MaterialGenerationParams } from '@/app/[lng]/brand-promotion/brandPromotionStore/types'
import type { PlatType } from '@/app/config/platConfig'
import { Copy, Play } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useMemo, useState } from 'react'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { MediaPreview } from '@/components/common/MediaPreview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import { useDraftBoxConfigStore } from '../../draftBoxConfigStore'

interface GenerationParamsCardProps {
  params?: MaterialGenerationParams | null
  t: (key: string, options?: Record<string, unknown>) => string
  className?: string
  compact?: boolean
  showPlatforms?: boolean
  applyTargetGroupId?: string | null
  onApplied?: () => void
}

interface PromptPreviewProps {
  prompt: string
  title: string
  copyLabel: string
  copySuccessMessage: string
  copyFailedMessage: string
  compact?: boolean
}

const PromptPreview = memo(({
  prompt,
  title,
  copyLabel,
  copySuccessMessage,
  copyFailedMessage,
  compact = false,
}: PromptPreviewProps) => {
  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      toast.success(copySuccessMessage)
    }
    catch {
      toast.error(copyFailedMessage)
    }
  }, [copyFailedMessage, copySuccessMessage, prompt])

  return (
    <HoverCard openDelay={120} closeDelay={120}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full rounded-lg border border-border/50 bg-background/70 px-3 py-2 text-left transition-colors hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'cursor-pointer',
          )}
        >
          <p
            className={cn(
              'line-clamp-2 whitespace-pre-wrap break-words text-foreground',
              compact ? 'text-xs leading-5' : 'text-sm leading-6',
            )}
          >
            {prompt}
          </p>
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        sideOffset={8}
        className="w-80 max-w-[calc(100vw-2rem)] space-y-3 rounded-xl border border-border/60 bg-popover p-3 shadow-lg sm:w-96"
        allowInnerScroll
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            {title}
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 cursor-pointer gap-1.5 px-2.5 text-xs"
            onClick={handleCopyPrompt}
          >
            <Copy className="h-3.5 w-3.5" />
            {copyLabel}
          </Button>
        </div>
        <pre
          className={cn(
            'max-h-72 overflow-y-auto whitespace-pre-wrap break-words pr-1 font-sans text-foreground select-text',
            compact ? 'text-xs leading-5' : 'text-sm leading-6',
          )}
        >
          {prompt}
        </pre>
      </HoverCardContent>
    </HoverCard>
  )
})

PromptPreview.displayName = 'PromptPreview'

export const GenerationParamsCard = memo(({
  params,
  t,
  className,
  compact = false,
  showPlatforms = true,
  applyTargetGroupId,
  onApplied,
}: GenerationParamsCardProps) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const applyGenerationParams = useDraftBoxConfigStore(state => state.applyGenerationParams)

  const imageUrls = params?.imageUrls ?? []
  const videoUrls = params?.videoUrls ?? []

  const previewItems = useMemo(() => {
    return [
      ...imageUrls.map(url => ({ type: 'image' as const, src: getOssUrl(url) })),
      ...videoUrls.map(url => ({ type: 'video' as const, src: getOssUrl(url) })),
    ]
  }, [imageUrls, videoUrls])

  const tags = useMemo(() => {
    if (!params)
      return []

    const items: { label: string, value: string }[] = []

    if (params.model) {
      items.push({ label: t('detail.modelType'), value: params.model })
    }
    if (params.imageModel) {
      items.push({ label: t('detail.imageModel'), value: params.imageModel })
    }
    if (params.duration) {
      items.push({ label: t('detail.duration'), value: `${params.duration}s` })
    }
    if (params.resolution) {
      items.push({ label: t('detail.videoResolution'), value: params.resolution })
    }
    if (params.aspectRatio) {
      items.push({ label: t('detail.aspectRatio'), value: params.aspectRatio })
    }
    if (params.imageCount) {
      items.push({ label: t('detail.imageCount'), value: `${params.imageCount}` })
    }
    if (params.imageSize) {
      items.push({ label: t('detail.imageResolution'), value: params.imageSize })
    }

    return items
  }, [params, t])

  const draftTypeLabel = useMemo(() => {
    if (!params?.draftType)
      return null

    if (params.draftType === 'draft')
      return t('detail.draftModeOn')

    if (params.draftType === 'video')
      return t('detail.draftModeOffVideo')

    if (params.draftType === 'image')
      return t('detail.draftModeOffImage')

    return null
  }, [params?.draftType, t])

  if (!params)
    return null

  const canApplyParams = !!applyTargetGroupId
  const thumbSizeClassName = compact ? 'h-10 w-10' : 'h-12 w-12'

  const handleApplyParams = useCallback(() => {
    if (!applyTargetGroupId) {
      return
    }

    applyGenerationParams(applyTargetGroupId, params)
    onApplied?.()
    toast.success(t('detail.applyToCurrentInputSuccess'))
  }, [applyGenerationParams, applyTargetGroupId, onApplied, params, t])

  const applyButton = canApplyParams
    ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'cursor-pointer rounded-md px-1.5 text-muted-foreground hover:bg-transparent hover:text-foreground',
            compact ? 'h-5 text-[11px]' : 'h-6 text-xs',
          )}
          onClick={handleApplyParams}
        >
          {t('detail.applyToCurrentInput')}
        </Button>
      )
    : null

  return (
    <div className={cn('space-y-3', className)}>
      {(tags.length > 0 || draftTypeLabel) && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div
              key={tag.label}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1',
                compact ? 'text-[11px]' : 'text-xs',
              )}
            >
              <span className="text-muted-foreground">{tag.label}</span>
              <span className="text-foreground">{tag.value}</span>
            </div>
          ))}
          {draftTypeLabel && (
            <Badge variant="secondary" className={cn('rounded-full', compact ? 'text-[11px]' : 'text-xs')}>
              {draftTypeLabel}
            </Badge>
          )}
        </div>
      )}

      {params.prompt && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className={cn('font-medium text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>
              {t('detail.promptTitle')}
            </p>
            {applyButton}
          </div>
          <PromptPreview
            prompt={params.prompt}
            title={t('detail.promptTitle')}
            copyLabel={t('detail.copy')}
            copySuccessMessage={t('detail.copySuccess')}
            copyFailedMessage={t('detail.copyFailed')}
            compact={compact}
          />
        </div>
      )}

      {params.captionPrompt && (
        <div className="space-y-1.5">
          <p className={cn('font-medium text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>
            {t('detail.captionPrompt')}
          </p>
          <PromptPreview
            prompt={params.captionPrompt}
            title={t('detail.captionPrompt')}
            copyLabel={t('detail.copy')}
            copySuccessMessage={t('detail.copySuccess')}
            copyFailedMessage={t('detail.copyFailed')}
            compact={compact}
          />
        </div>
      )}

      {!params.prompt && applyButton && (
        <div className="flex justify-end">
          {applyButton}
        </div>
      )}

      {imageUrls.length > 0 && (
        <div className="space-y-1.5">
          <p className={cn('font-medium text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>
            {t('detail.referenceImages')}
          </p>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, index) => (
              <button
                key={url}
                type="button"
                className={cn(
                  'relative overflow-hidden rounded-lg border border-border/60 bg-muted shrink-0 cursor-pointer',
                  thumbSizeClassName,
                )}
                onClick={() => {
                  setPreviewIndex(index)
                  setPreviewOpen(true)
                }}
              >
                <Image
                  src={getOssUrl(url)}
                  alt={`reference-image-${index + 1}`}
                  fill
                  className="object-cover"
                  sizes={compact ? '40px' : '48px'}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {videoUrls.length > 0 && (
        <div className="space-y-1.5">
          <p className={cn('font-medium text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>
            {t('detail.contentTypeVideo')}
          </p>
          <div className="flex flex-wrap gap-2">
            {videoUrls.map((url, index) => (
              <button
                key={url}
                type="button"
                className={cn(
                  'relative flex items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted shrink-0 cursor-pointer',
                  thumbSizeClassName,
                )}
                onClick={() => {
                  setPreviewIndex(imageUrls.length + index)
                  setPreviewOpen(true)
                }}
              >
                <Play className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {showPlatforms && params.platforms && params.platforms.length > 0 && (
        <div className="space-y-1.5">
          <p className={cn('font-medium text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>
            {t('detail.targetPlatforms')}
          </p>
          <div className="flex flex-wrap gap-2">
            {params.platforms.map((platform) => {
              const platInfo = AccountPlatInfoMap.get(platform as PlatType)

              return (
                <Badge
                  key={platform}
                  variant="outline"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full bg-background/70',
                    compact ? 'text-[11px]' : 'text-xs',
                  )}
                >
                  {platInfo?.icon && (
                    <Image
                      src={platInfo.icon}
                      alt={platInfo.name}
                      width={14}
                      height={14}
                      className="h-3.5 w-3.5"
                      unoptimized
                    />
                  )}
                  <span>{platInfo?.name || platform}</span>
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {previewItems.length > 0 && (
        <MediaPreview
          open={previewOpen}
          items={previewItems}
          initialIndex={previewIndex}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  )
})

GenerationParamsCard.displayName = 'GenerationParamsCard'
