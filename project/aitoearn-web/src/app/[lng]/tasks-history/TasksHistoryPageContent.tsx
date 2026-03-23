/**
 * 任务记录页内容组件 - Tasks History Content
 * 客户端组件，包含所有交互逻辑
 * 支持搜索任务标题和收藏筛选功能
 */
'use client'

import type { TaskListItem } from '@/api/agent'
import { ArrowLeft, FileText, FileVideo, History, RefreshCw, Search, Star, X } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { agentApi } from '@/api/agent'
import { useTransClient } from '@/app/i18n/client'
import { TaskCardSkeleton } from '@/components/Chat'
import TaskHistoryList from '@/components/Chat/TaskHistoryList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import UserLogsModal from '@/components/UserLogsModal'
import VideoHistoryModal from '@/components/VideoHistoryModal'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export function TasksHistoryPageContent() {
  const { t } = useTransClient('chat')
  const router = useRouter()
  const { lng } = useParams()

  // 状态
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [logsModalOpen, setLogsModalOpen] = useState(false)
  const [videoHistoryModalOpen, setVideoHistoryModalOpen] = useState(false)

  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 每页 16 条
  const pageSize = 16

  const totalPages = Math.max(1, Math.ceil(total / pageSize || 1))

  // 判断是否有筛选条件
  const hasFilters = searchKeyword.trim() || favoriteOnly

  /** 加载任务列表（分页） */
  const loadTasks = useCallback(
    async (pageNum: number, keyword?: string, onlyFavorites?: boolean) => {
      setIsLoading(true)
      try {
        const result = await agentApi.getTaskList({
          page: pageNum,
          pageSize,
          keyword: keyword?.trim() || undefined,
          favoriteOnly: onlyFavorites || undefined,
        })
        if (result && result.code === 0 && result.data) {
          const newTasks = result.data.list || []
          setTasks(newTasks)
          setTotal(result.data.total || 0)
          setPage(pageNum)
        }
      }
      catch (error) {
        console.error('Load task list failed:', error)
        toast.error(t('message.error'))
      }
      finally {
        setIsLoading(false)
      }
    },
    [pageSize, t],
  )

  /** 初始加载 */
  useEffect(() => {
    loadTasks(1, searchKeyword, favoriteOnly)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /** 搜索防抖处理 */
  const handleSearchChange = (value: string) => {
    setSearchKeyword(value)

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 设置 500ms 防抖
    debounceTimerRef.current = setTimeout(() => {
      loadTasks(1, value, favoriteOnly)
    }, 500)
  }

  /** 清除搜索 */
  const handleClearSearch = () => {
    setSearchKeyword('')
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    loadTasks(1, '', favoriteOnly)
  }

  /** 切换收藏筛选 */
  const handleToggleFavoriteOnly = () => {
    const newValue = !favoriteOnly
    setFavoriteOnly(newValue)
    loadTasks(1, searchKeyword, newValue)
  }

  /** 清除所有筛选 */
  const handleClearFilters = () => {
    setSearchKeyword('')
    setFavoriteOnly(false)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    loadTasks(1, '', false)
  }

  /** 刷新列表，保持当前筛选条件 */
  const handleRefresh = () => {
    loadTasks(1, searchKeyword, favoriteOnly)
  }

  /** 分页切换 */
  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages)
      return
    loadTasks(nextPage, searchKeyword, favoriteOnly)
  }

  /** 返回首页 */
  const handleBack = () => {
    router.push(`/ai-social`)
  }

  /** 打开日志弹窗 */
  const handleOpenLogs = () => {
    setLogsModalOpen(true)
  }

  /** 打开视频历史弹窗 */
  const handleOpenVideoHistory = () => {
    setVideoHistoryModalOpen(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="w-8 h-8">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">{t('history.title')}</h1>
          </div>
          {total > 0 && (
            <span className="text-sm text-muted-foreground">
              (
              {total}
              )
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenLogs}
            className="w-8 h-8"
            title={t('history.logs')}
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenVideoHistory}
            className="w-8 h-8"
            title={t('history.videoHistory')}
          >
            <FileVideo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="w-8 h-8"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </header>

      {/* 搜索和筛选区域 */}
      <div className="sticky top-[57px] z-10 px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('history.searchPlaceholder')}
              value={searchKeyword}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-9 pr-9 border-0 bg-muted/50 focus-visible:ring-0 focus-visible:bg-muted"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 筛选按钮区域 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 收藏筛选按钮 */}
            <Button
              variant={favoriteOnly ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleFavoriteOnly}
              className="gap-1.5 cursor-pointer"
            >
              <Star className={cn('w-4 h-4', favoriteOnly && 'fill-current')} />
              <span className="hidden sm:inline">{t('history.favoriteOnly')}</span>
            </Button>

            {/* 清除筛选按钮 */}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-muted-foreground hover:text-foreground cursor-pointer hidden sm:flex"
              >
                {t('history.clearFilters')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <main className="flex-1 px-4 py-6">
        <div className="w-full max-w-6xl mx-auto">
          {isLoading ? (
            // 加载骨架屏
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: pageSize }).map((_, index) => (
                <TaskCardSkeleton key={index} />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            // 空状态 - 根据筛选条件显示不同提示
            <div className="flex flex-col items-center justify-center py-16">
              {favoriteOnly ? (
                // 收藏筛选的空状态
                <>
                  <Star className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">{t('history.emptyFavorites')}</p>
                  <Button onClick={handleClearFilters} className="cursor-pointer">
                    {t('history.clearFilters')}
                  </Button>
                </>
              ) : searchKeyword.trim() ? (
                // 搜索的空状态
                <>
                  <Search className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">{t('history.emptySearch')}</p>
                  <Button onClick={handleClearSearch} className="cursor-pointer">
                    {t('history.clearFilters')}
                  </Button>
                </>
              ) : (
                // 无任何筛选的空状态
                <>
                  <History className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">{t('history.empty')}</p>
                  <Button onClick={handleBack} className="cursor-pointer">
                    {t('home.startChat')}
                  </Button>
                </>
              )}
            </div>
          ) : (
            // 任务卡片网格 + 分页器
            <>
              <div>
                <TaskHistoryList
                  tasks={tasks}
                  isLoading={isLoading}
                  onRefresh={() => loadTasks(page, searchKeyword, favoriteOnly)}
                />
              </div>

              {/* 分页器（使用项目内的 Pagination 组件） */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    onChange={handlePageChange}
                    showTotal={(totalCount, [_start, _end]) => (
                      <span className="text-sm text-muted-foreground">
                        {page}
                        {' '}
                        /
                        {totalPages}
                      </span>
                    )}
                    className="w-full"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* 用户日志弹窗 */}
      <UserLogsModal open={logsModalOpen} onClose={() => setLogsModalOpen(false)} />

      {/* 视频历史弹窗 */}
      <VideoHistoryModal
        open={videoHistoryModalOpen}
        onClose={() => setVideoHistoryModalOpen(false)}
      />
    </div>
  )
}
