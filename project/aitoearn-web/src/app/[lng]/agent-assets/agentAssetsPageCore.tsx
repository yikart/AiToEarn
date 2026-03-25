/**
 * AgentAssetsPageCore - Agent 素材详情页核心组件
 * 展示 Agent 生成的所有图片和视频素材
 * 特点：
 * - 只读模式（无上传、删除功能）
 * - 瀑布流布局 + 无限滚动
 * - 混合显示视频和图片
 */

'use client'

import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import type { AssetVo } from '@/types/agent-asset'
import { Bot, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import Masonry from 'react-masonry-css'
import { getAgentAssets } from '@/api/ai'
import { useTransClient } from '@/app/i18n/client'
import { MediaPreview } from '@/components/common/MediaPreview'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks'
import { getAssetMediaType } from '@/utils/agent-asset'
import { getOssUrl } from '@/utils/oss'
import { AgentAssetCard } from './components/AgentAssetCard'
import { AgentAssetCardSkeleton } from './components/AgentAssetCard/AgentAssetCardSkeleton'
import { AgentAssetsHeader } from './components/AgentAssetsHeader'

/**
 * 每页数量
 */
const PAGE_SIZE = 20

/**
 * 瀑布流断点配置
 */
const MASONRY_BREAKPOINTS = {
  default: 5, // > 1280px
  1280: 4, // <= 1280px
  1024: 3, // <= 1024px
  768: 3, // <= 768px
  640: 2, // <= 640px
}

export function AgentAssetsPageCore() {
  const { t } = useTransClient('material')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 动态更新页面标题
  useDocumentTitle(t('agentAssets.title'))

  // 数据状态
  const [assets, setAssets] = useState<AssetVo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // 预览弹窗状态
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  /**
   * 加载素材列表（首次加载）
   */
  const fetchAssets = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAgentAssets({ page: 1, pageSize: PAGE_SIZE })
      if (result?.data) {
        const list = result.data.list || []
        const totalCount = result.data.total || 0
        setAssets(list)
        setTotal(totalCount)
        setPage(1)
        setHasMore(list.length < totalCount)
      }
    }
    catch (error) {
      console.error('Failed to fetch agent assets:', error)
    }
    finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 加载更多素材
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore)
      return

    const nextPage = page + 1
    setIsLoadingMore(true)

    try {
      const result = await getAgentAssets({ page: nextPage, pageSize: PAGE_SIZE })
      if (result?.data) {
        const newList = result.data.list || []
        const totalCount = result.data.total || 0
        const combinedList = [...assets, ...newList]

        setAssets(combinedList)
        setTotal(totalCount)
        setPage(nextPage)
        setHasMore(combinedList.length < totalCount)
      }
    }
    catch (error) {
      console.error('Failed to load more agent assets:', error)
    }
    finally {
      setIsLoadingMore(false)
    }
  }, [page, assets, isLoadingMore, hasMore])

  // 初始化加载
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  /**
   * 处理素材点击（打开预览）
   */
  const handleAssetClick = useCallback(
    (asset: AssetVo) => {
      const index = assets.findIndex(a => a.id === asset.id)
      if (index !== -1) {
        setPreviewIndex(index)
        setPreviewOpen(true)
      }
    },
    [assets],
  )

  /**
   * 获取预览项列表
   */
  const getPreviewItems = useCallback((): MediaPreviewItem[] => {
    return assets.map((asset) => {
      const mediaType = getAssetMediaType(asset)
      return {
        type: mediaType === 'video' ? 'video' : 'image',
        src: getOssUrl(asset.url),
        title: asset.filename,
      }
    })
  }, [assets])

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* 顶部导航 */}
      <AgentAssetsHeader total={total} />

      {/* 主内容区 */}
      <main
        id="agent-assets-scroll-container"
        ref={scrollContainerRef}
        className="flex-1 px-4 py-6 overflow-y-auto"
      >
        <div className="w-full mx-auto">
          {isLoading ? (
            // 加载骨架屏
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <AgentAssetCardSkeleton key={index} />
              ))}
            </div>
          ) : assets.length === 0 ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t('agentAssets.noAssets')}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                {t('agentAssets.noAssetsDesc')}
              </p>
              <Button asChild className="cursor-pointer">
                <Link href="/chat">{t('agentAssets.goToChat')}</Link>
              </Button>
            </div>
          ) : (
            // 瀑布流 + 无限滚动
            <InfiniteScroll
              dataLength={assets.length}
              next={loadMore}
              hasMore={hasMore}
              scrollThreshold={0.8}
              loader={(
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              )}
              endMessage={
                assets.length > 0 && (
                  <div className="flex justify-center py-8 text-muted-foreground text-sm">
                    {t('mediaManagement.loadedAll')}
                    {' · '}
                    {total}
                    {' '}
                    {t('mediaManagement.resources')}
                  </div>
                )
              }
              scrollableTarget="agent-assets-scroll-container"
            >
              <Masonry
                breakpointCols={MASONRY_BREAKPOINTS}
                className="flex -ml-4 w-auto"
                columnClassName="pl-4 bg-clip-padding"
              >
                {assets.map(asset => (
                  <div key={asset.id} className="mb-4">
                    <AgentAssetCard asset={asset} onClick={handleAssetClick} />
                  </div>
                ))}
              </Masonry>
            </InfiniteScroll>
          )}
        </div>
      </main>

      {/* 媒体预览弹窗 */}
      <MediaPreview
        open={previewOpen}
        items={getPreviewItems()}
        initialIndex={previewIndex}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}
