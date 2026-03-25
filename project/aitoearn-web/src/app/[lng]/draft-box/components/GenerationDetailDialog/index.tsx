/**
 * 生成任务详情弹框
 * 展示 AI 批量生成任务的列表，支持无限滚动加载
 */

'use client'

import type { DraftGenerationRequest, DraftGenerationTask } from '@/api/draftGeneration'
import { AlertCircle, CheckCircle2, Loader2, Play } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { apiGetDraftGenerationList } from '@/api/draftGeneration'
import { usePlanDetailStore } from '@/app/[lng]/brand-promotion/planDetailStore'
import { useTransClient } from '@/app/i18n/client'
import { MediaPreview } from '@/components/common/MediaPreview'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelativeTime } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'

// 状态图标映射
function StatusIcon({ status }: { status: DraftGenerationTask['status'] }) {
  switch (status) {
    case 'generating':
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-destructive" />
  }
}

// 状态 Badge 变体映射
function getStatusVariant(status: DraftGenerationTask['status']): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'generating':
      return 'default'
    case 'success':
      return 'secondary'
    case 'failed':
      return 'destructive'
  }
}

// 请求参数展示
const RequestParams = memo(({ request, t }: { request: DraftGenerationRequest, t: (key: string, options?: Record<string, unknown>) => string }) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const tags: { label: string, value: string }[] = []

  if (request.model) {
    tags.push({ label: t('detail.modelType'), value: request.model })
  }
  if (request.imageModel) {
    tags.push({ label: t('detail.imageModel'), value: request.imageModel })
  }
  if (request.duration) {
    tags.push({ label: t('detail.duration'), value: `${request.duration}s` })
  }
  if (request.aspectRatio) {
    tags.push({ label: t('detail.aspectRatio'), value: request.aspectRatio })
  }
  if (request.imageCount) {
    tags.push({ label: t('detail.imageCount'), value: `${request.imageCount}` })
  }
  if (request.imageSize) {
    tags.push({ label: t('detail.imageResolution'), value: request.imageSize })
  }

  return (
    <div className="mt-2 space-y-1.5">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag.label}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              <span className="opacity-70">{tag.label}</span>
              <span>{tag.value}</span>
            </span>
          ))}
        </div>
      )}
      {request.prompt && (
        <p className="text-xs text-muted-foreground line-clamp-2 break-all">
          <span className="opacity-70">
            {t('detail.promptTitle')}
            ：
          </span>
          {request.prompt}
        </p>
      )}
      {request.imageUrls && request.imageUrls.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground opacity-70">{t('detail.referenceImages')}</span>
          <div className="flex gap-1.5 flex-wrap">
            {request.imageUrls.map((url, i) => (
              <div
                key={i}
                className="relative w-10 h-10 rounded overflow-hidden bg-muted shrink-0 cursor-pointer"
                onClick={() => { setPreviewIndex(i); setPreviewOpen(true) }}
              >
                <Image
                  src={getOssUrl(url)}
                  alt={`ref-${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            ))}
          </div>
          <MediaPreview
            open={previewOpen}
            items={request.imageUrls.map(url => ({ type: 'image' as const, src: getOssUrl(url) }))}
            initialIndex={previewIndex}
            onClose={() => setPreviewOpen(false)}
          />
        </div>
      )}
    </div>
  )
})

RequestParams.displayName = 'RequestParams'

// 任务条目
const TaskItem = memo(({ task, t }: { task: DraftGenerationTask, t: (key: string, options?: Record<string, unknown>) => string }) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const response = task.status === 'success' ? task.response : undefined

  // 构建预览项列表和封面
  const hasVideo = !!response?.videoUrl
  const hasImages = (response?.imageUrls?.length ?? 0) > 0
  const coverSrc = response?.coverUrl
    ? getOssUrl(response.coverUrl)
    : response?.imageUrls?.[0]
      ? getOssUrl(response.imageUrls[0])
      : undefined

  // 预览项：视频任务只预览视频，图片任务预览所有图片
  const previewItems = response
    ? hasVideo && response.videoUrl
      ? [{ type: 'video' as const, src: getOssUrl(response.videoUrl), title: response.title }]
      : (response.imageUrls || []).map(url => ({ type: 'image' as const, src: getOssUrl(url), title: response.title }))
    : []

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
      <div className="mt-0.5">
        <StatusIcon status={task.status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={getStatusVariant(task.status)} className="text-xs">
            {t(`detail.taskStatus.${task.status}`)}
          </Badge>
          {task.points > 0 && (
            <span className="text-xs text-muted-foreground">
              {t('detail.pointsConsumed', { points: task.points })}
            </span>
          )}
        </div>

        {/* 请求参数 */}
        {task.request && <RequestParams request={task.request} t={t} />}

        {/* 成功任务 - 渲染 response 内容 */}
        {response && (
          <div className="mt-2">
            {/* 视频任务：封面 + 文字信息 */}
            {hasVideo && coverSrc && (
              <div className="flex gap-3">
                <div
                  className="relative shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted cursor-pointer"
                  onClick={() => { setPreviewIndex(0); setPreviewOpen(true) }}
                >
                  <Image
                    src={coverSrc}
                    alt={response.title || ''}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="h-5 w-5 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {response.title && (
                    <p className="text-sm font-medium line-clamp-1">{response.title}</p>
                  )}
                  {response.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{response.description}</p>
                  )}
                  {response.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {response.topics.map(topic => (
                        <span key={topic} className="text-xs text-primary">
                          #
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 图片任务：展示所有生成图片 */}
            {!hasVideo && hasImages && (
              <div className="overflow-x-auto">
                <div className="flex gap-1.5">
                  {response.imageUrls!.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-20 rounded-md overflow-hidden bg-muted cursor-pointer"
                      onClick={() => { setPreviewIndex(i); setPreviewOpen(true) }}
                    >
                      <Image
                        src={getOssUrl(url)}
                        alt={`result-${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 预览 */}
            {previewItems.length > 0 && (
              <MediaPreview
                open={previewOpen}
                items={previewItems}
                initialIndex={previewIndex}
                onClose={() => setPreviewOpen(false)}
              />
            )}
          </div>
        )}

        {task.errorMessage && task.status === 'failed' && (
          <p className="text-xs text-destructive mt-1 break-all">{task.errorMessage}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(new Date(task.createdAt))}
        </p>
      </div>
    </div>
  )
})

TaskItem.displayName = 'TaskItem'

// 弹框内容
const GenerationDetailContent = memo(({ onClose }: { onClose: () => void }) => {
  const { t } = useTransClient('brandPromotion')
  const [tasks, setTasks] = useState<DraftGenerationTask[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const pageSize = 20

  const fetchTasks = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const res = await apiGetDraftGenerationList(pageNum, pageSize)
      if (res?.data) {
        const list = res.data.list || []
        setTasks(prev => pageNum === 1 ? list : [...prev, ...list])
        setHasMore(list.length === pageSize)
      }
    }
    catch {
      // 静默失败
    }
    finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    fetchTasks(1)
  }, [fetchTasks])

  // IntersectionObserver 无限滚动
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el)
      return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchTasks(nextPage)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, page, fetchTasks])

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('detail.generationDetailTitle')}</DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[60vh]">
        <div className="space-y-2 pr-2">
          {tasks.map(task => (
            <TaskItem key={task.id} task={task} t={t} />
          ))}

          {/* 加载触发器 */}
          <div ref={loadMoreRef} />

          {/* 加载中 */}
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* 空状态 */}
          {!loading && tasks.length === 0 && (
            <div className="flex justify-center py-8 text-sm text-muted-foreground">
              {t('detail.noGenerationTasks')}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  )
})

GenerationDetailContent.displayName = 'GenerationDetailContent'

export const GenerationDetailDialog = memo(() => {
  const generationDetailDialogOpen = usePlanDetailStore(state => state.generationDetailDialogOpen)
  const closeGenerationDetailDialog = usePlanDetailStore(state => state.closeGenerationDetailDialog)

  // 两层组件模式
  if (!generationDetailDialogOpen)
    return null

  return (
    <Dialog open onOpenChange={closeGenerationDetailDialog}>
      <DialogContent data-testid="draftbox-generation-detail-dialog" className="sm:max-w-2xl">
        <GenerationDetailContent onClose={closeGenerationDetailDialog} />
      </DialogContent>
    </Dialog>
  )
})

GenerationDetailDialog.displayName = 'GenerationDetailDialog'
