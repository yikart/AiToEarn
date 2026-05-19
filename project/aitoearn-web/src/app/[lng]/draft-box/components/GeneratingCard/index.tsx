/**
 * 生成中卡片
 * 显示在瀑布流中，展示正在生成的草稿数量，带 shimmer 渐变动画
 */

'use client'

import type { DraftGenerationResponse, DraftGenerationTask } from '@/api/draftGeneration'
import { AlertCircle, ImageIcon, Loader2, Play } from 'lucide-react'
import Image from 'next/image'
import { memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { MorphingIcon } from '@/components/common/MorphingIcon'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import styles from './GeneratingCard.module.scss'

interface GeneratingCardProps {
  count: number
  onClick: () => void
}

interface GeneratingTaskCardProps {
  task: DraftGenerationTask
  onClick: () => void
}

function getResponseObject(task: DraftGenerationTask): DraftGenerationResponse | undefined {
  return task.response && typeof task.response === 'object' ? task.response : undefined
}

function getStringValue(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key]
  return typeof value === 'string' && value.trim() ? value : undefined
}

function getTaskTitle(task: DraftGenerationTask) {
  const response = getResponseObject(task)
  const plan = response?.plan
  return response?.title || getStringValue(plan, 'title')
}

function getTaskDescription(task: DraftGenerationTask) {
  const response = getResponseObject(task)
  const plan = response?.plan
  return response?.description || getStringValue(plan, 'description')
}

function getTaskTopics(task: DraftGenerationTask) {
  const response = getResponseObject(task)
  const topics = response?.topics ?? response?.plan?.topics
  if (!Array.isArray(topics))
    return []
  return topics.filter((topic): topic is string => typeof topic === 'string' && topic.trim().length > 0)
}

export function getDraftGenerationTaskTarget(task: DraftGenerationTask): 'draft' | 'video' | 'img' {
  if (task.request?.draftType === 'video')
    return 'video'
  if (task.request?.draftType === 'image')
    return 'img'
  return 'draft'
}

export function hasDraftGenerationTaskPartialResult(task: DraftGenerationTask) {
  const response = getResponseObject(task)
  return Boolean(
    response?.imageUrls?.length
    || response?.videoUrl
    || response?.coverUrl
    || response?.title
    || response?.description
    || response?.plan,
  )
}

export function shouldShowDraftGenerationTaskCard(task: DraftGenerationTask) {
  return task.status === 'generating' || (task.status === 'failed' && hasDraftGenerationTaskPartialResult(task))
}

export const GeneratingCard = memo(({ count, onClick }: GeneratingCardProps) => {
  const { t } = useTransClient('brandPromotion')

  if (count <= 0)
    return null

  return (
    <div
      data-testid="draftbox-generating-card"
      className={cn(
        'mb-4 h-[160px] rounded-lg border border-primary/20 bg-primary/5 overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary/40',
        styles.generatingCard,
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center h-full gap-4 relative z-10">
        <MorphingIcon size={32} />
        <span className="text-sm text-muted-foreground">
          {t('detail.generatingDrafts', { count })}
        </span>
      </div>
    </div>
  )
})

GeneratingCard.displayName = 'GeneratingCard'

export const GeneratingTaskCard = memo(({ task, onClick }: GeneratingTaskCardProps) => {
  const { t } = useTransClient('brandPromotion')
  const response = getResponseObject(task)
  const imageUrls = response?.imageUrls?.filter(Boolean) ?? []
  const coverUrl = response?.coverUrl || imageUrls[0]
  const generatedCount = response?.generatedImageCount ?? imageUrls.length
  const requestedCount = response?.requestedImageCount ?? task.request?.imageCount
  const title = getTaskTitle(task) || t('detail.generatingTaskTitle')
  const description = getTaskDescription(task)
  const topics = getTaskTopics(task)
  const modelName = task.request?.model || task.request?.imageModel
  const isFailed = task.status === 'failed'
  const isGenerating = task.status === 'generating'
  const showImageGrid = imageUrls.length > 0
  const showVideoCover = !showImageGrid && (coverUrl || response?.videoUrl)

  return (
    <div
      data-testid="draftbox-generating-task-card"
      className={cn(
        'mb-4 cursor-pointer overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:border-primary/50',
        isFailed ? 'border-destructive/30' : 'border-primary/20',
      )}
      onClick={onClick}
    >
      <div className="relative min-h-[132px] overflow-hidden bg-muted">
        {showImageGrid
          ? (
              <div className={cn('grid gap-1 p-1', imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                {imageUrls.slice(0, 4).map((url, index) => (
                  <div key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-lg bg-background">
                    <Image
                      src={getOssUrl(url)}
                      alt={t('detail.generatedImageAlt', { index: index + 1 })}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                    {index === 3 && imageUrls.length > 4 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-sm font-medium text-background">
                        {t('detail.moreGeneratedImages', { count: imageUrls.length - 4 })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          : showVideoCover
            ? (
                <div className="relative h-[160px]">
                  {coverUrl
                    ? (
                        <Image
                          src={getOssUrl(coverUrl)}
                          alt={title}
                          fill
                          className="object-cover"
                          sizes="240px"
                        />
                      )
                    : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                  {response?.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/60">
                        <Play className="ml-0.5 h-5 w-5 fill-background text-background" />
                      </div>
                    </div>
                  )}
                </div>
              )
            : (
                <div className={cn('flex h-[160px] flex-col items-center justify-center gap-3', styles.generatingCard)}>
                  <MorphingIcon size={32} />
                  <span className="text-sm text-muted-foreground">
                    {t('detail.generatingDraft')}
                  </span>
                </div>
              )}

        <Badge
          variant={isFailed ? 'destructive' : 'outline'}
          className={cn(
            'absolute left-2 top-2 gap-1 shadow-none',
            isGenerating && 'border-border/60 bg-background/90 font-medium text-muted-foreground backdrop-blur-sm',
          )}
        >
          {isGenerating
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <AlertCircle className="h-3 w-3" />}
          {t(`detail.taskStatus.${task.status}`)}
        </Badge>
      </div>

      <div className="space-y-2 p-3">
        <div>
          <p className="line-clamp-2 text-sm font-medium text-foreground">{title}</p>
          {description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {requestedCount && requestedCount > 0 && (
          <div className="text-xs text-muted-foreground">
            {t('detail.generatedImageProgress', {
              generated: generatedCount,
              requested: requestedCount,
            })}
          </div>
        )}

        {modelName && (
          <Badge variant="secondary" className="rounded-full text-[11px] font-normal">
            {modelName}
          </Badge>
        )}

        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topics.slice(0, 4).map(topic => (
              <span key={topic} className="text-xs text-primary">
                #
                {topic}
              </span>
            ))}
          </div>
        )}

        {isFailed && task.errorMessage && (
          <p className="line-clamp-2 text-xs text-destructive">{task.errorMessage}</p>
        )}
      </div>
    </div>
  )
})

GeneratingTaskCard.displayName = 'GeneratingTaskCard'
