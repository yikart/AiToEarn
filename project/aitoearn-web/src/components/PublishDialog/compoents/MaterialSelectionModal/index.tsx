/**
 * MaterialSelectionModal - 素材选择器弹窗
 * 支持从素材库选择图片或视频
 * - 图片模式：多选
 * - 视频模式：单选
 * - 瀑布流布局 + 无限滚动
 * - 支持 Agent 素材分组
 */

'use client'

import type { MaterialSelectionModalProps, MediaGroup, MediaItem, MediaType } from './types'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import Masonry from 'react-masonry-css'
import { getAgentAssets } from '@/api/ai'
import { getMediaGroupList, getMediaList } from '@/api/media'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { convertAssetToMediaItem, filterAssetsByMediaType } from '@/utils/agent-asset'
import {
  AgentGroupCard,
  EmptyState,
  GroupCard,
  GroupCardSkeleton,
  MediaCardSkeleton,
  SelectableMediaCard,
} from './components'

/**
 * 瀑布流断点配置 - 分组列表
 */
const GROUP_BREAKPOINTS = {
  default: 4, // > 1024px
  1024: 3, // <= 1024px
  768: 2, // <= 768px
}

/**
 * 瀑布流断点配置 - 媒体列表
 */
const MEDIA_BREAKPOINTS = {
  default: 5, // > 1280px
  1280: 4, // <= 1280px
  1024: 3, // <= 1024px
  768: 3, // <= 768px
  640: 2, // <= 640px
}

/**
 * 每页数量
 */
const PAGE_SIZE = 20

/**
 * 处理分组数据，提取封面和资源数量
 */
function processGroups(list: MediaGroup[]): MediaGroup[] {
  return list.map((group) => {
    const mediaList = group.mediaList

    // 查找第一个媒体作为预览
    let previewMedia = null
    if (mediaList && mediaList.list && mediaList.list.length > 0) {
      previewMedia = mediaList.list[0]
    }

    return {
      ...group,
      cover: previewMedia?.thumbUrl || previewMedia?.url,
      count: mediaList?.total || 0,
      previewMedia: previewMedia
        ? {
            type: previewMedia.type,
            url: previewMedia.url,
            thumbUrl: previewMedia.thumbUrl,
          }
        : null,
    }
  })
}

/**
 * 内部内容组件 - 只在弹窗打开时渲染
 * 使用 useTransClient('material') 加载翻译
 */
const MaterialSelectionModalContent = memo(
  ({ onOpenChange, mediaTypes, onSelect }: Omit<MaterialSelectionModalProps, 'open'>) => {
    const { t } = useTransClient('material')
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // 将 mediaTypes 统一转为数组
    const typesArray = useMemo<MediaType[]>(
      () => (Array.isArray(mediaTypes) ? mediaTypes : [mediaTypes]),
      [mediaTypes],
    )

    // 是否支持多种类型
    const isMultipleTypes = typesArray.length > 1

    // 当前视图：groups（分组列表）或 media（媒体列表）
    const [currentView, setCurrentView] = useState<'groups' | 'media'>('groups')

    // 分组相关状态
    const [groups, setGroups] = useState<MediaGroup[]>([])
    const [groupsLoading, setGroupsLoading] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<MediaGroup | null>(null)

    // 是否选中了 Agent 分组（虚拟分组）
    const [isAgentGroup, setIsAgentGroup] = useState(false)

    // 媒体相关状态
    const [mediaList, setMediaList] = useState<MediaItem[]>([])
    const [mediaLoading, setMediaLoading] = useState(false)
    const [mediaTotal, setMediaTotal] = useState(0)
    const [mediaPage, setMediaPage] = useState(1)
    const [hasMoreMedia, setHasMoreMedia] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    // 多选状态（仅图片模式）
    const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())

    // 是否为多选模式（Agent 分组支持多种类型时，根据 mediaTypes 判断）
    const isMultiSelect = isAgentGroup
      ? typesArray.includes('img') // Agent 分组：包含图片即启用多选模式
      : selectedGroup?.type === 'img' // 普通分组：图片组多选

    // 获取分组列表
    const fetchGroups = useCallback(async () => {
      setGroupsLoading(true)
      try {
        // 如果支持多种类型，分别获取然后合并
        if (isMultipleTypes) {
          const promises = typesArray.map(type => getMediaGroupList(1, 50, type))
          const responses = await Promise.all(promises)
          const allGroups: MediaGroup[] = []
          responses.forEach((response) => {
            if (response?.data?.list) {
              allGroups.push(...response.data.list)
            }
          })
          const processedGroups = processGroups(allGroups)
          setGroups(processedGroups)
        }
        else {
          // 单一类型
          const response = await getMediaGroupList(1, 50, typesArray[0])
          if (response?.data?.list) {
            const processedGroups = processGroups(response.data.list)
            setGroups(processedGroups)
          }
        }
      }
      catch (error) {
        console.error('Failed to fetch groups:', error)
      }
      finally {
        setGroupsLoading(false)
      }
    }, [typesArray, isMultipleTypes])

    // 使用 ref 稳定化 fetchGroups 引用，避免 useEffect 因函数引用变化而重复执行
    const fetchGroupsRef = useRef(fetchGroups)
    fetchGroupsRef.current = fetchGroups

    // 获取媒体列表（首次加载）
    const fetchMediaList = useCallback(async (groupId: string) => {
      setMediaLoading(true)
      setMediaPage(1)
      setHasMoreMedia(true)
      try {
        const response = await getMediaList(groupId, 1, PAGE_SIZE)
        if (response?.data?.list) {
          const list = response.data.list
          const total = response.data.total || 0
          setMediaList(list)
          setMediaTotal(total)
          setHasMoreMedia(list.length < total)
        }
        else {
          setMediaList([])
          setMediaTotal(0)
          setHasMoreMedia(false)
        }
      }
      catch (error) {
        console.error('Failed to fetch media list:', error)
        setMediaList([])
        setMediaTotal(0)
        setHasMoreMedia(false)
      }
      finally {
        setMediaLoading(false)
      }
    }, [])

    // 获取 Agent 素材列表（首次加载）
    const fetchAgentAssets = useCallback(async () => {
      setMediaLoading(true)
      setMediaPage(1)
      setHasMoreMedia(true)
      try {
        const response = await getAgentAssets({ page: 1, pageSize: PAGE_SIZE })
        if (response?.data?.list) {
          // 根据 mediaTypes 过滤素材
          const filteredAssets = filterAssetsByMediaType(response.data.list, typesArray)
          // 转换为 MediaItem 格式
          const convertedList = filteredAssets.map(convertAssetToMediaItem)
          // 计算过滤后的总数（近似值，实际应该后端支持）
          const total = response.data.total || 0
          const filteredTotal = Math.floor(
            total * (filteredAssets.length / (response.data.list.length || 1)),
          )

          setMediaList(convertedList)
          setMediaTotal(filteredTotal)
          setHasMoreMedia(convertedList.length < filteredTotal)
        }
        else {
          setMediaList([])
          setMediaTotal(0)
          setHasMoreMedia(false)
        }
      }
      catch (error) {
        console.error('Failed to fetch agent assets:', error)
        setMediaList([])
        setMediaTotal(0)
        setHasMoreMedia(false)
      }
      finally {
        setMediaLoading(false)
      }
    }, [typesArray])

    // 加载更多媒体（无限滚动）
    const loadMoreMedia = useCallback(async () => {
      if (isLoadingMore || !hasMoreMedia)
        return

      // Agent 分组加载更多
      if (isAgentGroup) {
        const nextPage = mediaPage + 1
        setIsLoadingMore(true)

        try {
          const response = await getAgentAssets({ page: nextPage, pageSize: PAGE_SIZE })
          if (response?.data?.list) {
            const filteredAssets = filterAssetsByMediaType(response.data.list, typesArray)
            const convertedList = filteredAssets.map(convertAssetToMediaItem)
            const combinedList = [...mediaList, ...convertedList]
            const total = response.data.total || 0
            const filteredTotal = Math.floor(
              total * (filteredAssets.length / (response.data.list.length || 1)),
            )

            setMediaList(combinedList)
            setMediaTotal(filteredTotal)
            setMediaPage(nextPage)
            setHasMoreMedia(combinedList.length < filteredTotal)
          }
          else {
            setHasMoreMedia(false)
          }
        }
        catch (error) {
          console.error('Failed to load more agent assets:', error)
        }
        finally {
          setIsLoadingMore(false)
        }
        return
      }

      // 普通分组加载更多
      if (!selectedGroup)
        return

      const nextPage = mediaPage + 1
      setIsLoadingMore(true)

      try {
        const response = await getMediaList(selectedGroup._id, nextPage, PAGE_SIZE)
        if (response?.data?.list) {
          const newList = response.data.list
          const total = response.data.total || 0
          const combinedList = [...mediaList, ...newList]

          setMediaList(combinedList)
          setMediaTotal(total)
          setMediaPage(nextPage)
          setHasMoreMedia(combinedList.length < total)
        }
        else {
          setHasMoreMedia(false)
        }
      }
      catch (error) {
        console.error('Failed to load more media:', error)
      }
      finally {
        setIsLoadingMore(false)
      }
    }, [selectedGroup, isAgentGroup, mediaPage, mediaList, isLoadingMore, hasMoreMedia, typesArray])

    // 组件挂载时加载分组（组件只在 open=true 时渲染）
    useEffect(() => {
      fetchGroupsRef.current()
    }, [])

    // 点击 Agent 分组
    const handleAgentGroupClick = useCallback(() => {
      setIsAgentGroup(true)
      setSelectedGroup(null)
      setCurrentView('media')
      setSelectedMedia(new Set())
      fetchAgentAssets()
    }, [fetchAgentAssets])

    // 点击普通分组
    const handleGroupClick = useCallback(
      (group: MediaGroup) => {
        setIsAgentGroup(false)
        setSelectedGroup(group)
        setCurrentView('media')
        setSelectedMedia(new Set())
        fetchMediaList(group._id)
      },
      [fetchMediaList],
    )

    // 返回分组列表
    const handleBack = useCallback(() => {
      setCurrentView('groups')
      setSelectedGroup(null)
      setIsAgentGroup(false)
      setMediaList([])
      setMediaTotal(0)
      setMediaPage(1)
      setHasMoreMedia(true)
      setSelectedMedia(new Set())
    }, [])

    // 点击媒体
    const handleMediaClick = useCallback(
      (media: MediaItem) => {
        // 根据当前分组类型判断选择模式
        // Agent 分组：按素材类型判断；普通分组：图片组多选
        const currentIsMultiSelect = isAgentGroup
          ? media.type === 'img'
          : selectedGroup?.type === 'img'

        if (currentIsMultiSelect) {
          // 图片多选：切换选中状态
          setSelectedMedia((prev) => {
            const next = new Set(prev)
            if (next.has(media._id)) {
              next.delete(media._id)
            }
            else {
              next.add(media._id)
            }
            return next
          })
        }
        else {
          // 视频单选：直接选中并关闭
          onSelect(media)
          onOpenChange(false)
        }
      },
      [selectedGroup, isAgentGroup, onSelect, onOpenChange],
    )

    // 确认选择（多选模式）
    const handleConfirm = useCallback(() => {
      const selected = mediaList.filter(m => selectedMedia.has(m._id))
      if (selected.length > 0) {
        onSelect(selected)
        onOpenChange(false)
      }
    }, [mediaList, selectedMedia, onSelect, onOpenChange])

    // 获取标题
    const getTitle = () => {
      if (currentView === 'media') {
        // Agent 分组标题
        if (isAgentGroup) {
          return t('agentAssets.title')
        }
        // 普通分组标题
        if (selectedGroup) {
          return selectedGroup.title
        }
      }
      // 根据支持的类型显示标题
      if (isMultipleTypes) {
        return t('mediaManagement.mediaResources')
      }
      return typesArray[0] === 'video'
        ? t('mediaManagement.selectVideo')
        : t('mediaManagement.selectImage')
    }

    // 滚动容器 ID
    const scrollContainerId = 'material-selection-scroll-container'

    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
          {/* 头部 */}
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              {/* 返回按钮 */}
              {currentView === 'media' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 cursor-pointer"
                  onClick={handleBack}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold truncate">{getTitle()}</DialogTitle>
                {currentView === 'media' && mediaTotal > 0 && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {mediaTotal}
                    {' '}
                    {t('mediaManagement.resources')}
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* 内容区域 */}
          <div
            id={scrollContainerId}
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-6"
          >
            <div className="py-4">
              {currentView === 'groups' ? (
                // 分组列表
                groupsLoading ? (
                  <Masonry
                    breakpointCols={GROUP_BREAKPOINTS}
                    className="flex -ml-4 w-auto"
                    columnClassName="pl-4 bg-clip-padding"
                  >
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="mb-4">
                        <GroupCardSkeleton />
                      </div>
                    ))}
                  </Masonry>
                ) : groups.length === 0 ? (
                  <EmptyState type="group" />
                ) : (
                  <Masonry
                    breakpointCols={GROUP_BREAKPOINTS}
                    className="flex -ml-4 w-auto"
                    columnClassName="pl-4 bg-clip-padding"
                  >
                    {/* Agent 素材分组卡片 - 始终显示在首位 */}
                    <div className="mb-4">
                      <AgentGroupCard onClick={handleAgentGroupClick} />
                    </div>
                    {groups.map(group => (
                      <div key={group._id} className="mb-4">
                        <GroupCard group={group} onClick={handleGroupClick} />
                      </div>
                    ))}
                  </Masonry>
                )
              ) // 媒体列表
                : mediaLoading ? (
                  <Masonry
                    breakpointCols={MEDIA_BREAKPOINTS}
                    className="flex -ml-4 w-auto"
                    columnClassName="pl-4 bg-clip-padding"
                  >
                    {Array.from({ length: 15 }).map((_, index) => (
                      <div key={index} className="mb-4">
                        <MediaCardSkeleton />
                      </div>
                    ))}
                  </Masonry>
                ) : mediaList.length === 0 ? (
                  <EmptyState
                    type="media"
                    mediaType={isAgentGroup ? undefined : selectedGroup?.type}
                    isAgentGroup={isAgentGroup}
                  />
                ) : (
                  <InfiniteScroll
                    dataLength={mediaList.length}
                    next={loadMoreMedia}
                    hasMore={hasMoreMedia}
                    scrollThreshold={0.8}
                    loader={(
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                      </div>
                    )}
                    endMessage={
                      mediaList.length > 0 && (
                        <div className="flex justify-center py-6 text-muted-foreground text-sm">
                          {t('mediaManagement.loadedAll')}
                        </div>
                      )
                    }
                    scrollableTarget={scrollContainerId}
                  >
                    <Masonry
                      breakpointCols={MEDIA_BREAKPOINTS}
                      className="flex -ml-4 w-auto"
                      columnClassName="pl-4 bg-clip-padding"
                    >
                      {mediaList.map(media => (
                        <div key={media._id} className="mb-4">
                          <SelectableMediaCard
                            media={media}
                            selected={selectedMedia.has(media._id)}
                            multiSelect={isAgentGroup ? media.type === 'img' : isMultiSelect}
                            onClick={handleMediaClick}
                          />
                        </div>
                      ))}
                    </Masonry>
                  </InfiniteScroll>
                )}
            </div>
          </div>

          {/* 底部操作栏（多选模式） */}
          {isMultiSelect && currentView === 'media' && (
            <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between bg-background">
              <span className="text-sm text-muted-foreground">
                {t('mediaManagement.selectedCount', { count: selectedMedia.size })}
              </span>
              <Button
                onClick={handleConfirm}
                disabled={selectedMedia.size === 0}
                className={cn(
                  'min-w-[100px] cursor-pointer',
                  selectedMedia.size > 0 && 'bg-primary hover:bg-primary/90',
                )}
              >
                <Check className="w-4 h-4 mr-2" />
                {t('mediaManagement.confirm')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  },
)

MaterialSelectionModalContent.displayName = 'MaterialSelectionModalContent'

/**
 * 外层包装组件 - 只在 open=true 时渲染内部内容
 * 避免 useTransClient('material') 在弹窗关闭时触发动态加载导致闪烁
 */
export function MaterialSelectionModal({
  open,
  onOpenChange,
  mediaTypes,
  onSelect,
}: MaterialSelectionModalProps) {
  // 只在打开时渲染内部组件，避免动态加载 material namespace 导致闪烁
  if (!open)
    return null

  return (
    <MaterialSelectionModalContent
      onOpenChange={onOpenChange}
      mediaTypes={mediaTypes}
      onSelect={onSelect}
    />
  )
}

// 导出类型
export type { MaterialSelectionModalProps, MediaGroup, MediaItem, MediaType } from './types'
