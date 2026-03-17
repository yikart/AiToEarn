/**
 * 生成任务详情弹框
 * 展示 AI 批量生成任务的列表，支持无限滚动加载
 */

'use client'

import type { DraftGenerationTask } from '@/api/draftGeneration'
import { AlertCircle, CheckCircle2, Loader2, Play } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { apiGetDraftGenerationList } from '@/api/draftGeneration'
import { useDraftBoxStore } from '@/app/[lng]/draft-box/draftBoxStore'
import { useTransClient } from '@/app/i18n/client'
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

// 任务条目
const TaskItem = memo(({ task, t }: { task: DraftGenerationTask, t: (key: string, options?: Record<string, unknown>) => string }) => {
  const response = task.status === 'success' ? task.response : undefined
  const coverSrc = response?.coverUrl
    ? getOssUrl(response.coverUrl)
    : response?.imageUrls?.[0]
      ? getOssUrl(response.imageUrls[0])
      : undefined

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

        {/* 成功任务 - 渲染 response 内容 */}
        {response && (
          <div className="flex gap-3 mt-2">
            {coverSrc && (
              <a
                href={response.videoUrl ? getOssUrl(response.videoUrl) : coverSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="relative shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted cursor-pointer block"
              >
                <Image
                  src={coverSrc}
                  alt={response.title || ''}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                {response.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="h-5 w-5 text-white fill-white" />
                  </div>
                )}
              </a>
            )}
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
  const generationDetailDialogOpen = useDraftBoxStore(state => state.generationDetailDialogOpen)
  const closeGenerationDetailDialog = useDraftBoxStore(state => state.closeGenerationDetailDialog)

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
