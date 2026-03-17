/**
 * UserLogsModal - 用户使用日志弹窗组件
 * 显示用户的AI使用记录，支持分页查看
 */

'use client'

import { FileText, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getLogs } from '@/api/ai'
import { useTransClient } from '@/app/i18n/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetClientLng } from '@/hooks/useSystem'
import { getDateLocale } from '@/lib/i18n/languageConfig'
import { toast } from '@/lib/toast'

// 日志数据类型定义
interface LogItem {
  id: string
  userId: string
  userType: string
  taskId?: string
  type: string
  model: string
  channel: string
  status: 'success' | 'failed' | 'pending' | string
  startedAt: string
  duration?: number
  points: number
  createdAt: string
  updatedAt: string
}

interface LogsData {
  page: number
  pageSize: number
  totalPages: number
  total: number
  list: LogItem[]
}

interface LogsResponse {
  code: string | number
  data: LogsData
  message: string
}

export interface UserLogsModalProps {
  /** 是否显示弹窗 */
  open: boolean
  /** 关闭弹窗回调 */
  onClose: () => void
}

/**
 * UserLogsModal 用户使用日志弹窗组件
 */
export function UserLogsModal({ open, onClose }: UserLogsModalProps) {
  const { t } = useTransClient('chat')
  const lng = useGetClientLng()

  // 状态管理
  const [logs, setLogs] = useState<LogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const pageSize = 20

  /** 加载日志数据 */
  const loadLogs = async (pageNum: number, isLoadMore = false) => {
    if (isLoading)
      return

    setIsLoading(true)
    try {
      const result: any = await getLogs({
        page: pageNum,
        pageSize,
      })

      if (result && result.code === 0 && result.data) {
        const newLogs = result.data.list || []

        if (isLoadMore) {
          setLogs(prev => [...prev, ...newLogs])
        }
        else {
          setLogs(newLogs)
        }

        setTotal(result.data.total || 0)
        setTotalPages(result.data.totalPages || 0)
        setPage(pageNum)
      }
    }
    catch (error) {
      console.error('Load logs failed:', error)
      toast.error(t('history.logsError'))
    }
    finally {
      setIsLoading(false)
    }
  }

  /** 初始加载 */
  useEffect(() => {
    if (open) {
      loadLogs(1)
    }
  }, [open])

  /** 加载更多 */
  const handleLoadMore = () => {
    if (!isLoading && page < totalPages) {
      loadLogs(page + 1, true)
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
    switch (status) {
      case 'success':
        return t('history.logStatus.success')
      case 'failed':
        return t('history.logStatus.failed')
      case 'pending':
        return t('history.logStatus.pending')
      default:
        return status
    }
  }

  /** 获取类型文本 */
  const getTypeText = (type: string) => {
    switch (type) {
      case 'agent':
        return t('history.logType.agent')
      case 'chat':
        return t('history.logType.chat')
      default:
        return type
    }
  }

  /** 格式化持续时间 */
  const formatDuration = (duration?: number) => {
    if (!duration)
      return null
    const seconds = Math.floor(duration / 1000)
    if (seconds < 60)
      return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m${remainingSeconds}s`
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('history.logsTitle')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-4">
          {isLoading && logs.length === 0 ? (
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
          ) : logs.length === 0 ? (
            // 空状态
            <Empty
              image={<FileText className="w-12 h-12 text-muted-foreground/50" />}
              description={t('history.logsEmpty')}
            />
          ) : (
            // 日志列表
            <div className="space-y-4">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{getTypeText(log.type)}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : log.status === 'failed'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}
                      >
                        {getStatusText(log.status)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(log.startedAt)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('history.logFields.model')}
                        :
                      </span>
                      <span className="font-mono text-xs">{log.model}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('history.logFields.channel')}
                        :
                      </span>
                      <span className="font-mono text-xs">{log.channel}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        {t('history.logFields.points')}
                        :
                      </span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {log.points.toFixed(4)}
                      </span>
                    </div>

                    {log.duration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('history.logFields.duration')}
                          :
                        </span>
                        <span className="text-xs">{formatDuration(log.duration)}</span>
                      </div>
                    )}

                    {log.taskId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('history.logFields.taskId')}
                          :
                        </span>
                        <span className="font-mono text-xs truncate max-w-32" title={log.taskId}>
                          {log.taskId}
                        </span>
                      </div>
                    )}
                  </div>
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
  )
}

export default UserLogsModal
