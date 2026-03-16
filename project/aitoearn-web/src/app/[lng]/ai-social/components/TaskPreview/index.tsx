/**
 * TaskPreview - 任务预览组件
 * 功能：显示最近的任务卡片列表、Agent 素材，支持 Tab 切换和"浏览全部"跳转
 */

'use client'

import type { TaskListItem } from '@/api/agent'
import type { MediaItem } from '@/app/[lng]/material/materialStore/materialStore.types'
import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import { ArrowRight, Bot, History } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { startTransition, useCallback, useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { agentApi } from '@/api/agent'
import { getAgentAssets } from '@/api/ai'
import { useTransClient } from '@/app/i18n/client'
import TaskHistoryList from '@/components/Chat/TaskHistoryList'
import { MediaPreview } from '@/components/common/MediaPreview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserStore } from '@/store'
import { convertAssetToMediaItem } from '@/utils/agent-asset'
import { getOssUrl } from '@/utils/oss'
import { MediaPreviewList } from './components/MediaPreviewList'

export interface ITaskPreviewProps {
  /** 显示数量 */
  limit?: number
  /** 自定义类名 */
  className?: string
}

/** Tab 类型 */
type TabValue = 'tasks' | 'agent'

/**
 * TaskPreview - 任务预览组件
 */
export function TaskPreview({ limit = 4, className }: ITaskPreviewProps) {
  const { t } = useTransClient('chat')
  const { lng } = useParams()

  const { _hasHydrated, token } = useUserStore(
    useShallow(state => ({
      _hasHydrated: state._hasHydrated,
      token: state.token,
    })),
  )

  // 当前选中的 Tab
  const [activeTab, setActiveTab] = useState<TabValue>('tasks')

  // 任务状态
  const [taskState, setTaskState] = useState<{
    tasks: TaskListItem[]
    isLoading: boolean
  }>({
    tasks: [],
    isLoading: true,
  })

  // Agent 素材状态
  const [agentState, setAgentState] = useState<{
    mediaList: MediaItem[]
    isLoading: boolean
  }>({
    mediaList: [],
    isLoading: true,
  })

  // 媒体预览弹窗状态
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewItems, setPreviewItems] = useState<MediaPreviewItem[]>([])

  /** 加载任务列表 */
  const loadTasks = useCallback(async () => {
    try {
      const result = await agentApi.getTaskList({ page: 1, pageSize: limit })
      if (result && result.code === 0 && result.data) {
        startTransition(() => {
          setTaskState({
            tasks: result.data.list || [],
            isLoading: false,
          })
        })
      }
      else {
        startTransition(() => {
          setTaskState(prev => ({ ...prev, isLoading: false }))
        })
      }
    }
    catch (error) {
      console.error('Load task list failed:', error)
      startTransition(() => {
        setTaskState(prev => ({ ...prev, isLoading: false }))
      })
    }
  }, [limit])

  /** 加载 Agent 素材 */
  const loadAgentAssets = useCallback(async () => {
    try {
      const result = await getAgentAssets({ page: 1, pageSize: limit })
      if (result && result.data) {
        // 转换为 MediaItem 格式
        const convertedList = (result.data.list || []).map(convertAssetToMediaItem)
        startTransition(() => {
          setAgentState({
            mediaList: convertedList,
            isLoading: false,
          })
        })
      }
      else {
        startTransition(() => {
          setAgentState(prev => ({ ...prev, isLoading: false }))
        })
      }
    }
    catch (error) {
      console.error('Load agent assets failed:', error)
      startTransition(() => {
        setAgentState(prev => ({ ...prev, isLoading: false }))
      })
    }
  }, [limit])

  /** 处理 Agent 素材点击 - 打开预览弹窗 */
  const handleAgentAssetClick = useCallback(
    (index: number) => {
      const items: MediaPreviewItem[] = agentState.mediaList.map((media) => {
        // Agent 素材可能是视频或图片
        const isVideo = media.type === 'video'
        return {
          type: isVideo ? ('video' as const) : ('image' as const),
          src: getOssUrl(media.url),
          title: media.title,
        }
      })
      setPreviewItems(items)
      setPreviewIndex(index)
      setPreviewOpen(true)
    },
    [agentState.mediaList],
  )

  // 初始化加载
  useEffect(() => {
    if (!_hasHydrated)
      return

    if (token) {
      // 加载任务列表
      loadTasks()
      // 加载 Agent 素材
      loadAgentAssets()
    }
    else {
      // 未登录时停止 loading
      startTransition(() => {
        setTaskState(prev => ({ ...prev, isLoading: false }))
        setAgentState(prev => ({ ...prev, isLoading: false }))
      })
    }
  }, [_hasHydrated, token, loadTasks, loadAgentAssets])

  /** 获取浏览全部链接 */
  const getViewAllLink = (tab: TabValue): string => {
    switch (tab) {
      case 'tasks':
        return '/tasks-history'
      case 'agent':
        return '/material/agent-assets'
      default:
        return '/tasks-history'
    }
  }

  // 判断是否有数据（任一 Tab 有数据即显示）
  const hasAnyData
    = !taskState.isLoading
      && !agentState.isLoading
      && (taskState.tasks.length > 0
        || agentState.mediaList.length > 0)

  // 判断是否全部加载完成且无数据
  const allLoadedNoData
    = !taskState.isLoading
      && !agentState.isLoading
      && taskState.tasks.length === 0
      && agentState.mediaList.length === 0

  // 如果全部加载完成且无数据，不显示该区域
  if (allLoadedNoData) {
    return null
  }

  return (
    <section className={className}>
      <div className="w-full max-w-5xl mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as TabValue)}
          className="w-full"
        >
          {/* Tab 标题栏 */}
          <div className="flex items-center justify-between mb-6">
            <TabsList className="h-11 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger
                value="tasks"
                className="gap-2 px-4 h-9 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">{t('home.recentTasks')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="agent"
                className="gap-2 px-4 h-9 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">{t('home.agentAssets')}</span>
              </TabsTrigger>
            </TabsList>

            {/* 浏览全部按钮 */}
            <Link
              href={getViewAllLink(activeTab)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
            >
              {t('home.viewAll')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Tab 内容区域 - 固定最小高度避免抖动 */}
          <div className="min-h-[200px]">
            {/* 最近任务 */}
            <TabsContent value="tasks" className="mt-0">
              <TaskHistoryList
                tasks={taskState.tasks}
                isLoading={taskState.isLoading}
                skeletonCount={limit}
                onRefresh={() => loadTasks()}
                className="grid-cols-2 md:grid-cols-4"
              />
            </TabsContent>

            {/* Agent 素材 */}
            <TabsContent value="agent" className="mt-0">
              <MediaPreviewList
                mediaList={agentState.mediaList}
                isLoading={agentState.isLoading}
                skeletonCount={limit}
                onItemClick={handleAgentAssetClick}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* 媒体预览弹窗 */}
      <MediaPreview
        open={previewOpen}
        items={previewItems}
        initialIndex={previewIndex}
        onClose={() => setPreviewOpen(false)}
      />
    </section>
  )
}

export default TaskPreview
