/**
 * SentList 组件
 * 功能：显示已发送的帖子列表
 */
import type { SentPost } from '@/api/types/sent.types'
import { AimOutlined, BarChartOutlined, EyeInvisibleOutlined, EyeOutlined, HeartOutlined, LikeOutlined, MessageOutlined, ShareAltOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import React, { useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { getSentPosts } from '@/api/sent'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccountStore } from '@/store/account'
import { getOssUrl } from '@/utils/oss'

interface SentListProps {
  platform: string
  uid: string
  onDataChange?: (count: number) => void
  accountInfo?: {
    avatar: string
    nickname: string
    account: string
  }
}

const SentList: React.FC<SentListProps> = ({ platform, uid, onDataChange, accountInfo }) => {
  const { t } = useTransClient('account')
  const [posts, setPosts] = useState<SentPost[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  // Get account list for mapping
  const { accountList } = useAccountStore(
    useShallow(state => ({
      accountList: state.accountList,
    })),
  )

  // Create mapping from accountId to account information
  const accountMap = useMemo(() => {
    const map = new Map()
    accountList.forEach((account) => {
      map.set(account.id, account)
    })
    return map
  }, [accountList])

  const loadPosts = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true)
    try {
      // Build request parameters, if platform and uid are not passed, don't pass
      const params: any = {
        time: [dayjs().subtract(1, 'month').utc().format(), dayjs().utc().format()],
      }

      if (platform) {
        params.accountType = platform
      }

      if (uid) {
        params.uid = uid
      }

      const response = await getSentPosts(params)

      // Handle new API response format
      const responseData = (response as any)?.data || response

      // Handle response data, directly use responseData as an array
      const postsData = Array.isArray(responseData)
        ? responseData
        : (responseData?.posts || responseData?.data?.posts || responseData?.list || [])

      if (append) {
        setPosts(prev => [...prev, ...postsData])
      }
      else {
        setPosts(postsData)
      }
      setHasMore(responseData?.hasMore || false)

      // Notify parent component of data change
      if (onDataChange) {
        onDataChange(responseData?.total || postsData.length)
      }
    }
    catch (error) {
      console.error('Failed to load sent posts:', error)
      // When an error occurs, reset data
      if (!append) {
        setPosts([])
        setHasMore(false)
        if (onDataChange) {
          onDataChange(0)
        }
      }
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Enter the page and call it, regardless of whether there is platform and uid
    loadPosts(1, false)
  }, [platform, uid])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadPosts(nextPage, true)
  }

  const formatTime = (timestamp: string | number) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp)
    return {
      date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
  }

  const renderPostItem = (post: SentPost) => {
    // Get account information based on accountId
    const account = accountMap.get(post.accountId)
    const platInfo = AccountPlatInfoMap.get(post.accountType as any)

    const timeInfo = formatTime(post.publishTime)
    const postTime = typeof post.publishTime === 'string' ? new Date(post.publishTime).getTime() : post.publishTime
    const daysAgo = Math.floor((Date.now() - postTime) / (1000 * 60 * 60 * 24))

    return (
      <div key={post.id} className="mb-6 last:mb-0">
        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-0.5">
          {/* Date time header */}
          <div className="px-5 pt-4 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">{timeInfo.date}</span>
              <span className="text-sm text-muted-foreground font-medium">{timeInfo.time}</span>
            </div>
          </div>

          {/* Post content */}
          <div className="p-5">
            {/* User information */}
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={getOssUrl(account?.avatar || '')} alt={account?.nickname || account?.account} />
                <AvatarFallback>
                  {account?.nickname?.charAt(0) || account?.account?.charAt(0) || post.title?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-foreground mb-1 leading-tight">
                  {account?.nickname || account?.account || post.title || t('unknownAccount')}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground leading-tight">
                  {platInfo && (
                    <img src={platInfo.icon} alt={platInfo.name} className="w-4 h-4 rounded-sm" />
                  )}
                  <span>{platInfo?.name || post.accountType}</span>
                </div>
              </div>
            </div>

            {/* Post text */}
            <div className="text-base text-foreground leading-relaxed mb-4 break-words">
              {post.desc}
            </div>

            {/* Media content */}
            {post.coverUrl && (
              <div className="mb-5">
                <div className="relative max-w-[300px]">
                  <img
                    src={post.coverUrl}
                    alt={post.title || post.desc}
                    className="w-full h-auto block rounded-lg"
                  />
                  {(post.type === 'video' || post.type?.includes('video')) && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black/70 rounded-full flex items-center justify-center">
                      <div className="text-white text-base ml-0.5">▶</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interactive data */}
            <div className="mb-5 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="text-base text-muted-foreground"><LikeOutlined /></div>
                  <div className="text-xs text-muted-foreground font-medium text-center">Likes</div>
                  <div className="text-sm text-foreground font-semibold">{post.engagement?.likeCount || 0}</div>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="text-base text-muted-foreground"><ShareAltOutlined /></div>
                  <div className="text-xs text-muted-foreground font-medium text-center">Shares</div>
                  <div className="text-sm text-foreground font-semibold">{post.engagement?.shareCount || 0}</div>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="text-base text-muted-foreground"><EyeOutlined /></div>
                  <div className="text-xs text-muted-foreground font-medium text-center">Views</div>
                  <div className="text-sm text-foreground font-semibold">{post.engagement?.viewCount || 0}</div>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="text-base text-muted-foreground"><MessageOutlined /></div>
                  <div className="text-xs text-muted-foreground font-medium text-center">Comments</div>
                  <div className="text-sm text-foreground font-semibold">{post.engagement?.commentCount || 0}</div>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="text-base text-muted-foreground"><HeartOutlined /></div>
                  <div className="text-xs text-muted-foreground font-medium text-center">Favorites</div>
                  <div className="text-sm text-foreground font-semibold">{post.engagement?.favoriteCount || 0}</div>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="text-base text-muted-foreground"><AimOutlined /></div>
                  <div className="text-xs text-muted-foreground font-medium text-center">Click</div>
                  <div className="text-sm text-foreground font-semibold">{post.engagement?.clickCount || 0}</div>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="text-base text-muted-foreground"><EyeInvisibleOutlined /></div>
                  <div className="text-xs text-muted-foreground font-medium text-center">Impression</div>
                  <div className="text-sm text-foreground font-semibold">{post.engagement?.impressionCount || 0}</div>
                </div>
                <div className="ml-auto text-base text-muted-foreground cursor-pointer p-1 rounded transition-all hover:bg-muted hover:text-foreground">
                  <BarChartOutlined />
                </div>
              </div>
            </div>

            {/* Bottom information */}
            <div className="flex justify-between items-center pt-4 border-t border-border/50">
              <div className="text-sm text-muted-foreground">
                {t('listMode.createdDaysAgo', { days: daysAgo })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="link"
                  size="sm"
                  className="text-sm text-primary px-2 h-auto border border-border/50 rounded bg-background transition-all hover:border-primary hover:bg-accent"
                  onClick={() => window.open(post.workLink, '_blank')}
                >
                  {t('listMode.viewPost')}
                  {' '}
                  ↗️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-base text-muted-foreground px-2 h-auto rounded transition-all hover:bg-muted hover:text-foreground"
                >
                  ⋮
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Filter out data that cannot be matched in the account list
  const validPosts = useMemo(() => {
    return posts.filter(post => accountMap.has(post.accountId))
  }, [posts, accountMap])

  if (loading && posts.length === 0) {
    return (
      <div className="w-full h-full flex flex-col p-0">
        <div className="py-5">
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col p-0">
      {validPosts.length > 0
        ? (
            <>
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-0">
                {validPosts.map(renderPostItem)}
              </div>
              {hasMore && (
                <div className="flex justify-center py-6 shrink-0">
                  <Button
                    disabled={loading}
                    onClick={loadMore}
                    className="rounded-[20px] px-8 h-auto py-2.5 text-sm font-medium"
                  >
                    Load more...
                  </Button>
                </div>
              )}
            </>
          )
        : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground h-full min-h-[300px]">
              <div className="text-4xl mb-4">📮</div>
              <p className="text-sm">{t('listMode.noSentPosts')}</p>
            </div>
          )}
    </div>
  )
}

export default SentList
