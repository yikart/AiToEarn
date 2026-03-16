/**
 * AlbumPage - 相册详情页
 * 展示和管理单个分组内的所有媒体资源（重构版）
 * 使用瀑布流布局 + 无限滚动 + 动画效果
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useParams, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import Masonry from 'react-masonry-css'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { MediaPreview } from '@/components/common/MediaPreview'
import { useDocumentTitle } from '@/hooks'
import { useAlbumStore } from './albumStore'
import { AlbumHeader } from './components/AlbumHeader'
import { MediaCard } from './components/MediaCard'
import { MediaCardSkeleton } from './components/MediaCard/MediaCardSkeleton'
import { UploadProgress } from './components/UploadProgress'
import { AlbumEmptyState } from './components/UploadSection'

/**
 * 瀑布流断点配置
 * 根据屏幕宽度调整列数
 */
const MASONRY_BREAKPOINTS = {
  default: 5, // > 1280px
  1280: 4, // <= 1280px
  1024: 3, // <= 1024px
  768: 3, // <= 768px
  640: 2, // <= 640px
}

export default function AlbumPage() {
  const { t } = useTransClient('material')
  const params = useParams()
  const searchParams = useSearchParams()
  const albumId = params.id as string
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 从 Store 获取状态和方法
  const {
    groupInfo,
    mediaList,
    total,
    isLoading,
    isUploading,
    isDeleting,
    isLoadingMore,
    hasMore,
    previewOpen,
    previewIndex,
    setGroupInfo,
    fetchMediaList,
    loadMore,
    uploadMultipleMedia,
    deleteMedia,
    openPreview,
    closePreview,
    getAcceptTypes,
    getPreviewItems,
    reset,
  } = useAlbumStore(
    useShallow(state => ({
      groupInfo: state.groupInfo,
      mediaList: state.mediaList,
      total: state.total,
      isLoading: state.isLoading,
      isUploading: state.isUploading,
      isDeleting: state.isDeleting,
      isLoadingMore: state.isLoadingMore,
      hasMore: state.hasMore,
      previewOpen: state.previewOpen,
      previewIndex: state.previewIndex,
      setGroupInfo: state.setGroupInfo,
      fetchMediaList: state.fetchMediaList,
      loadMore: state.loadMore,
      uploadMultipleMedia: state.uploadMultipleMedia,
      deleteMedia: state.deleteMedia,
      openPreview: state.openPreview,
      closePreview: state.closePreview,
      getAcceptTypes: state.getAcceptTypes,
      getPreviewItems: state.getPreviewItems,
      reset: state.reset,
    })),
  )

  // 动态更新页面标题
  useDocumentTitle(groupInfo?.title, t('mediaManagement.album'))

  // 初始化：从 URL 参数获取分组信息并加载媒体列表
  useEffect(() => {
    // 从 URL 参数获取组信息
    const title = searchParams.get('title') || ''
    const type = (searchParams.get('type') as 'video' | 'img') || 'video'
    const desc = searchParams.get('desc') || ''

    if (title) {
      setGroupInfo({
        _id: albumId,
        title,
        type,
        desc,
      })
    }

    fetchMediaList(albumId)

    // 组件卸载时重置 Store
    return () => {
      reset()
    }
  }, [albumId, searchParams, setGroupInfo, fetchMediaList, reset])

  // 处理上传（多文件）
  const handleUpload = useCallback(
    async (files: File[]) => {
      await uploadMultipleMedia(albumId, files)
    },
    [albumId, uploadMultipleMedia],
  )

  // 处理删除
  const handleDelete = useCallback(
    async (mediaId: string) => {
      await deleteMedia(albumId, mediaId)
    },
    [albumId, deleteMedia],
  )

  // 处理预览
  const handlePreview = useCallback(
    (media: (typeof mediaList)[0]) => {
      const index = mediaList.findIndex(m => m._id === media._id)
      if (index !== -1) {
        openPreview(index)
      }
    },
    [mediaList, openPreview],
  )

  // 处理加载更多
  const handleLoadMore = useCallback(() => {
    loadMore(albumId)
  }, [albumId, loadMore])

  // 获取允许的文件类型
  const acceptTypes = getAcceptTypes()

  // 获取预览项列表
  const previewItems = getPreviewItems()

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* 顶部导航 */}
      <AlbumHeader
        groupInfo={groupInfo}
        total={total}
        isUploading={isUploading}
        acceptTypes={acceptTypes}
        onUpload={handleUpload}
      />

      {/* 主内容区 */}
      <main
        id="album-scroll-container"
        ref={scrollContainerRef}
        className="flex-1 px-4 py-6 overflow-y-auto"
      >
        <div className="w-full mx-auto">
          {isLoading ? (
            // 加载骨架屏
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 20 }).map((_, index) => (
                <MediaCardSkeleton key={index} />
              ))}
            </div>
          ) : mediaList.length === 0 ? (
            // 空状态
            <AlbumEmptyState
              groupInfo={groupInfo}
              acceptTypes={acceptTypes}
              onUpload={handleUpload}
              isUploading={isUploading}
            />
          ) : (
            // 瀑布流 + 无限滚动
            <InfiniteScroll
              dataLength={mediaList.length}
              next={handleLoadMore}
              hasMore={hasMore}
              scrollThreshold={0.8}
              loader={(
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              )}
              endMessage={
                mediaList.length > 0 && (
                  <div className="flex justify-center py-8 text-muted-foreground text-sm">
                    {t('mediaManagement.loadedAll')}
                    {' · '}
                    {total}
                    {' '}
                    {t('mediaManagement.resources')}
                  </div>
                )
              }
              scrollableTarget="album-scroll-container"
            >
              <Masonry
                breakpointCols={MASONRY_BREAKPOINTS}
                className="flex -ml-4 w-auto"
                columnClassName="pl-4 bg-clip-padding"
              >
                {mediaList.map(media => (
                  <div key={media._id} className="mb-4">
                    <MediaCard
                      media={media}
                      onPreview={handlePreview}
                      onDelete={handleDelete}
                      isDeleting={isDeleting}
                    />
                  </div>
                ))}
              </Masonry>
            </InfiniteScroll>
          )}
        </div>
      </main>

      {/* 上传进度浮动面板 */}
      <UploadProgress />

      {/* 媒体预览弹窗 */}
      <MediaPreview
        open={previewOpen}
        items={previewItems}
        initialIndex={previewIndex}
        onClose={closePreview}
      />
    </div>
  )
}
