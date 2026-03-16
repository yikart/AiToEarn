/**
 * PublishDetailCard - 发布详情卡片组件
 * 在聊天消息中展示作品发布状态和详情
 */

'use client'

import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import type { PlatType } from '@/app/config/platConfig'
import type { IMediaItem } from '@/store/agent'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Share2,
} from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { PublishStatus } from '@/api/plat/types/publish.types'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/AvatarPlat'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { usePublishDetailCache } from '@/store/publishDetailCache'
import { getOssUrl } from '@/utils/oss'
import PublishDetailSkeleton from './PublishDetailSkeleton'

// 轮询间隔（毫秒）
const POLLING_INTERVAL = 5000

export interface IPublishDetailCardProps {
  /** 发布流程 ID */
  flowId: string
  /** 平台类型 */
  platform?: string
  /** 来自 result 的初始数据 */
  initialData?: {
    title?: string
    description?: string
    medias?: IMediaItem[]
  }
  /** 自定义类名 */
  className?: string
}

/**
 * PublishDetailCard - 发布详情卡片
 */
const PublishDetailCard = memo(
  ({ flowId, platform, initialData, className }: IPublishDetailCardProps) => {
    const { t } = useTransClient('chat')
    const [loading, setLoading] = useState(true)
    const [detail, setDetail] = useState<PublishRecordItem | null>(null)
    const [error, setError] = useState<string | null>(null)

    const { fetchAndCache, getDetail } = usePublishDetailCache()
    const { accountMap } = useAccountStore(
      useShallow(state => ({
        accountMap: state.accountMap,
      })),
    )

    // 获取发布详情
    const fetchDetail = useCallback(
      async (forceRefresh = false) => {
        try {
          const data = await fetchAndCache(flowId, forceRefresh)
          if (data) {
            setDetail(data)
            setError(null)
          }
          else {
            setError('Failed to load')
          }
        }
        catch (err) {
          setError('Failed to load')
        }
        finally {
          setLoading(false)
        }
      },
      [flowId, fetchAndCache],
    )

    // 首次加载
    useEffect(() => {
      // 先检查缓存
      const cached = getDetail(flowId)
      if (cached) {
        setDetail(cached)
        setLoading(false)
      }
      else {
        fetchDetail()
      }
    }, [flowId, getDetail, fetchDetail])

    // 发布中状态自动轮询
    useEffect(() => {
      if (detail?.status === PublishStatus.PUB_LOADING) {
        const timer = setInterval(() => {
          fetchDetail(true) // 强制刷新
        }, POLLING_INTERVAL)
        return () => clearInterval(timer)
      }
    }, [detail?.status, fetchDetail])

    // 获取平台信息
    const platInfo = platform
      ? AccountPlatInfoMap.get(platform as PlatType)
      : detail?.accountType
        ? AccountPlatInfoMap.get(detail.accountType)
        : null

    // 获取账户信息
    const account = useMemo(() => {
      return accountMap.get(detail?.accountId ?? '')
    }, [accountMap, detail?.accountId])

    // 获取封面图
    const firstMedia = initialData?.medias?.[0]
    const coverImage = detail?.coverUrl || detail?.imgUrlList?.[0] || firstMedia?.thumbUrl || firstMedia?.coverUrl || firstMedia?.url

    // 获取描述（包含话题）
    const description = useMemo(() => {
      const desc = detail?.desc || initialData?.description || ''
      const topics = detail?.topics || []
      if (topics.length > 0) {
        return `${desc} ${topics.map(tag => `#${tag}`).join(' ')}`
      }
      return desc
    }, [detail, initialData])

    // 渲染状态标签
    const renderStatusBadge = () => {
      if (!detail)
        return null

      switch (detail.status) {
        case PublishStatus.RELEASED:
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
              <CheckCircle2 className="w-3 h-3" />
              {t('publishDetail.published')}
            </span>
          )
        case PublishStatus.PUB_LOADING:
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t('publishDetail.publishing')}
            </span>
          )
        case PublishStatus.FAIL:
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
              <AlertCircle className="w-3 h-3" />
              {t('publishDetail.failed')}
            </span>
          )
        case PublishStatus.UNPUBLISH:
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
              <Clock className="w-3 h-3" />
              {t('publishDetail.unpublished')}
            </span>
          )
        default:
          return null
      }
    }

    // 渲染互动数据
    const renderEngagement = () => {
      if (!detail?.engagement)
        return null

      const { viewCount, likeCount, commentCount, shareCount } = detail.engagement

      // 如果所有数据都为 0，不显示
      if (!viewCount && !likeCount && !commentCount && !shareCount)
        return null

      return (
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-border/50">
          {viewCount > 0 && (
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Eye className="w-3 h-3" />
              {viewCount}
            </span>
          )}
          {likeCount > 0 && (
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Heart className="w-3 h-3" />
              {likeCount}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5 sm:gap-1">
              <MessageCircle className="w-3 h-3" />
              {commentCount}
            </span>
          )}
          {shareCount > 0 && (
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Share2 className="w-3 h-3" />
              {shareCount}
            </span>
          )}
        </div>
      )
    }

    // 加载中
    if (loading) {
      return <PublishDetailSkeleton className={cn('w-full sm:max-w-md', className)} />
    }

    // 加载失败
    if (error || !detail) {
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border border-border bg-muted/30 text-muted-foreground text-sm',
            'w-full sm:max-w-md',
            className,
          )}
        >
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-1.5 text-destructive/50" />
          <span className="text-xs">{error || t('publishDetail.loading')}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLoading(true)
              fetchDetail(true)
            }}
            className="mt-1 sm:mt-1.5 h-7 text-xs cursor-pointer"
          >
            {t('publishDetail.retry')}
          </Button>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border bg-muted/30',
          'w-full sm:max-w-md',
          className,
        )}
      >
        {/* 左侧：封面图 - 移动端更小 */}
        {coverImage && (
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted shrink-0">
            <Image
              src={getOssUrl(coverImage)}
              alt={detail.title || 'Cover'}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* 右侧：内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部：账户信息和平台图标 */}
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
              {account && (
                <>
                  <AvatarPlat account={account} size="small" />
                  <span className="text-xs font-medium truncate max-w-[80px] sm:max-w-none">
                    {account.nickname}
                  </span>
                </>
              )}
            </div>
            {platInfo && (
              <Image
                src={platInfo.icon}
                alt={platInfo.name}
                width={16}
                height={16}
                className="rounded shrink-0 sm:w-[18px] sm:h-[18px]"
              />
            )}
          </div>

          {/* 标题 */}
          <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-1 mb-0.5 sm:mb-1">
            {detail.title || initialData?.title || t('publishDetail.noTitle')}
          </h4>

          {/* 描述和话题 - 移动端隐藏或减少行数 */}
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2 mb-1 sm:mb-1.5">
              {description}
            </p>
          )}

          {/* 状态和操作 - 移动端垂直堆叠 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
            {renderStatusBadge()}

            {/* 查看作品按钮 */}
            {detail.status === PublishStatus.RELEASED && detail.workLink && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs cursor-pointer w-fit"
                onClick={() => window.open(detail.workLink, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                {t('publishDetail.viewWork')}
              </Button>
            )}
          </div>

          {/* 错误信息 */}
          {detail.status === PublishStatus.FAIL && detail.errorMsg && (
            <p className="text-xs text-destructive mt-1 line-clamp-1">{detail.errorMsg}</p>
          )}

          {/* 互动数据 - 移动端间距更小 */}
          {renderEngagement()}
        </div>
      </div>
    )
  },
)

PublishDetailCard.displayName = 'PublishDetailCard'

export default PublishDetailCard
