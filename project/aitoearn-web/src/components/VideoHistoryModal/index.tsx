/**
 * VideoHistoryModal - 视频生成历史弹窗组件
 * 显示用户的视频生成记录，支持分页查看
 */

'use client'

import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import { Eye, FileVideo, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getVideoGenerations } from '@/api/ai'
import { useTransClient } from '@/app/i18n/client'
import MediaPreview from '@/components/common/MediaPreview'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetClientLng } from '@/hooks/useSystem'
import { getDateLocale } from '@/lib/i18n/languageConfig'
import { toast } from '@/lib/toast'
import { getOssUrl } from '@/utils/oss'

// 视频生成历史数据类型定义
interface VideoHistoryItem {
  task_id: string
  action: string
  status: 'SUCCESS' | 'FAILED' | 'PROCESSING' | string
  fail_reason?: string
  submit_time: number
  start_time: number
  finish_time?: number
  progress: string
  prompt: string
  data: {
    completed_at?: number
    created_at: number
    error?: string | null
    id: string
    model: string
    object: string
    progress: number
    result_url?: string
    seconds: string
    size: string
    status: string
    url: string
    video_url: string
  }
}

interface VideoHistoryResponse {
  code: string | number
  data: {
    list: VideoHistoryItem[]
    total: number
    page: number
    pageSize: number
    totalPages?: number
  }
  message: string
}

export interface VideoHistoryModalProps {
  /** 是否显示弹窗 */
  open: boolean
  /** 关闭弹窗回调 */
  onClose: () => void
}

/**
 * VideoHistoryModal 视频生成历史弹窗组件
 */
export function VideoHistoryModal({ open, onClose }: VideoHistoryModalProps) {
  const { t } = useTransClient('chat')
  const lng = useGetClientLng()

  // 状态管理
  const [videos, setVideos] = useState<VideoHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewItems, setPreviewItems] = useState<MediaPreviewItem[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)

  const pageSize = 20

  /** 加载视频历史数据 */
  const loadVideos = async (pageNum: number, isLoadMore = false) => {
    if (isLoading)
      return

    setIsLoading(true)
    try {
      const result: any = await getVideoGenerations({
        page: pageNum,
        pageSize,
      })

      if (result && result.code === 0 && result.data) {
        const newVideos = result.data.list || []

        if (isLoadMore) {
          setVideos(prev => [...prev, ...newVideos])
        }
        else {
          setVideos(newVideos)
        }

        setTotal(result.data.total || 0)
        setTotalPages(result.data.totalPages || Math.ceil((result.data.total || 0) / pageSize))
        setPage(pageNum)
      }
    }
    catch (error) {
      console.error('Load video history failed:', error)
      toast.error(t('history.logsError'))
    }
    finally {
      setIsLoading(false)
    }
  }

  /** 初始加载 */
  useEffect(() => {
    if (open) {
      loadVideos(1)
    }
  }, [open])

  /** 加载更多 */
  const handleLoadMore = () => {
    if (!isLoading && page < totalPages) {
      loadVideos(page + 1, true)
    }
  }

  /** 格式化时间 */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(getDateLocale(lng), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /** 获取状态文本 */
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return t('history.videoStatus.pending')
      case 'processing':
        return t('history.videoStatus.processing')
      case 'success':
      case 'completed':
        return t('history.videoStatus.completed')
      case 'failed':
        return t('history.videoStatus.failed')
      default:
        return status
    }
  }

  /** 格式化时长 */
  const formatDuration = (duration?: number) => {
    if (!duration)
      return null
    const seconds = Math.floor(duration)
    if (seconds < 60)
      return `${seconds}${t('history.duration.seconds')}`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}${t('history.duration.minutes')}${remainingSeconds}${t('history.duration.seconds')}`
  }

  /** 预览视频 */
  const handlePreviewVideo = (video: VideoHistoryItem) => {
    if (video.status === 'SUCCESS' && video.data?.video_url) {
      const videoUrl = getOssUrl(video.data.video_url)
      setPreviewItems([
        {
          type: 'video',
          src: videoUrl,
          title: `${video.prompt.substring(0, 50)}...`,
        },
      ])
      setPreviewIndex(0)
      setPreviewOpen(true)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
        <DialogContent className="w-[95vw] max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileVideo className="w-5 h-5" />
              {t('history.videoHistoryTitle')}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[60vh] pr-4">
            {isLoading && videos.length === 0 ? (
              // 初始加载骨架屏
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : videos.length === 0 ? (
              // 空状态
              <Empty
                image={<FileVideo className="w-12 h-12 text-muted-foreground/50" />}
                description={t('history.videoHistoryEmpty')}
              />
            ) : (
              // 视频历史列表
              <div className="space-y-4">
                {videos.map(video => (
                  <div
                    key={video.task_id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{t('history.videoGeneration')}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            video.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : video.status === 'FAILED'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}
                        >
                          {getStatusText(video.status)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(new Date(video.submit_time * 1000).toISOString())}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('history.logFields.model')}
                          :
                        </span>
                        <span className="font-mono text-xs">{video.data?.model}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('history.videoSize')}
                          :
                        </span>
                        <span className="text-xs">{video.data?.size}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('history.videoDuration')}
                          :
                        </span>
                        <span className="text-xs">
                          {video.data?.seconds
                            ? `${video.data.seconds}${t('history.duration.secondsUnit')}`
                            : ''}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('history.progress')}
                          :
                        </span>
                        <span className="text-xs">{video.progress}</span>
                      </div>
                    </div>

                    {/* 提示词 */}
                    <div className="mt-3">
                      <div className="font-medium mb-1 text-sm">
                        {t('history.prompt')}
                        :
                      </div>
                      <div className="bg-muted p-2 rounded text-xs max-h-20 overflow-y-auto">
                        {video.prompt}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    {video.status === 'SUCCESS' && video.data?.video_url && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handlePreviewVideo(video)}
                          className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          {t('history.previewVideo')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* 加载更多按钮 */}
                {page < totalPages && (
                  <div className="text-center py-4 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('history.logsLoading')}
                        </>
                      ) : (
                        t('history.loadMore')
                      )}
                    </button>
                  </div>
                )}

                {/* 分页信息 */}
                {total > 0 && (
                  <div className="flex justify-center mb-4">
                    <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {t('history.pageInfo', { page, totalPages, total })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 视频预览 */}
      <MediaPreview
        open={previewOpen}
        items={previewItems}
        initialIndex={previewIndex}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}

export default VideoHistoryModal
