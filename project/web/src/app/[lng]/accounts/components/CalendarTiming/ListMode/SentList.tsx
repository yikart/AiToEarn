import type { SentPost } from '@/api/types/sent.types'
import { AimOutlined, BarChartOutlined, EyeInvisibleOutlined, EyeOutlined, HeartOutlined, LikeOutlined, MessageOutlined, ShareAltOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Empty, List, Skeleton, Space, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import React, { useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { getSentPosts } from '@/api/sent'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { useAccountStore } from '@/store/account'
import { getOssUrl } from '@/utils/oss'
import styles from './listMode.module.scss'

const { Text, Title } = Typography

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
      const postsData = Array.isArray(responseData) ? responseData : (responseData?.posts || responseData?.list || [])

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

  const getMediaTypeTag = (mediaType: string) => {
    const typeMap = {
      video: { color: 'red', text: t('mediaTypes.video') },
      image: { color: 'blue', text: t('mediaTypes.image') },
      article: { color: 'green', text: t('mediaTypes.article') },
    }
    return typeMap[mediaType as keyof typeof typeMap] || { color: 'default', text: mediaType }
  }

  const renderPostItem = (post: SentPost) => {
    // Get account information based on accountId
    const account = accountMap.get(post.accountId)
    const platInfo = AccountPlatInfoMap.get(post.accountType as any)

    const timeInfo = formatTime(post.publishTime)
    const postTime = typeof post.publishTime === 'string' ? new Date(post.publishTime).getTime() : post.publishTime
    const daysAgo = Math.floor((Date.now() - postTime) / (1000 * 60 * 60 * 24))

    return (
      <div key={post.id} className={styles.sentPostItem}>
        <div className={styles.postCard}>
          {/* Date time header */}
          <div className={styles.postDateHeader}>
            <div className={styles.dateTime}>
              <span className={styles.dateText}>{timeInfo.date}</span>
              <span className={styles.timeText}>{timeInfo.time}</span>
            </div>
          </div>

          {/* Post content */}
          <div className={styles.postContent}>
            {/* User information */}
            <div className={styles.userInfo}>
              <Avatar
                size={40}
                src={getOssUrl(account?.avatar || '')}
                className={styles.userAvatar}
              >
                {account?.nickname?.charAt(0) || account?.account?.charAt(0) || post.title?.charAt(0) || '?'}
              </Avatar>
              <div className={styles.userDetails}>
                <div className={styles.username}>
                  {account?.nickname || account?.account || post.title || t('unknownAccount')}
                </div>
                <div className={styles.userSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {platInfo && (
                    <img src={platInfo.icon} alt={platInfo.name} style={{ width: '16px', height: '16px', borderRadius: '2px' }} />
                  )}
                  <span>{platInfo?.name || post.accountType}</span>
                </div>
              </div>
            </div>

            {/* Post text */}
            <div className={styles.postText}>
              {post.desc}
            </div>

            {/* Media content */}
            {post.coverUrl && (
              <div className={styles.mediaContainer}>
                <div className={styles.mediaWrapper}>
                  <img
                    src={post.coverUrl}
                    alt={post.title || post.desc}
                    className={styles.mediaImage}
                  />
                  {(post.type === 'video' || post.type?.includes('video')) && (
                    <div className={styles.playButton}>
                      <div className={styles.playIcon}>▶</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interactive data */}
            <div className={styles.engagementMetrics}>
              <div className={styles.metricsRow}>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><LikeOutlined /></div>
                  <div className={styles.metricLabel}>Likes</div>
                  <div className={styles.metricValue}>{post.engagement?.likeCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><ShareAltOutlined /></div>
                  <div className={styles.metricLabel}>Shares</div>
                  <div className={styles.metricValue}>{post.engagement?.shareCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><EyeOutlined /></div>
                  <div className={styles.metricLabel}>Views</div>
                  <div className={styles.metricValue}>{post.engagement?.viewCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><MessageOutlined /></div>
                  <div className={styles.metricLabel}>Comments</div>
                  <div className={styles.metricValue}>{post.engagement?.commentCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><HeartOutlined /></div>
                  <div className={styles.metricLabel}>Favorites</div>
                  <div className={styles.metricValue}>{post.engagement?.favoriteCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><AimOutlined /></div>
                  <div className={styles.metricLabel}>Click</div>
                  <div className={styles.metricValue}>{post.engagement?.clickCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><EyeInvisibleOutlined /></div>
                  <div className={styles.metricLabel}>Impression</div>
                  <div className={styles.metricValue}>{post.engagement?.impressionCount || 0}</div>
                </div>
                <div className={styles.chartIcon}><BarChartOutlined /></div>
              </div>
            </div>

            {/* Bottom information */}
            <div className={styles.postFooter}>
              <div className={styles.creationInfo}>
                {t('listMode.createdDaysAgo' as any, { days: daysAgo })}
              </div>
              <div className={styles.actionButtons}>
                <Button
                  type="link"
                  size="small"
                  className={styles.viewPostBtn}
                  onClick={() => window.open(post.workLink, '_blank')}
                >
                  {t('listMode.viewPost' as any)}
                  {' '}
                  ↗️
                </Button>
                <Button
                  type="text"
                  size="small"
                  className={styles.moreBtn}
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
      <div className={styles.sentList}>
        <div className={styles.loadingContainer}>
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.sentList}>
      {validPosts.length > 0
        ? (
            <>
              <div className={styles.postsContainer}>
                {validPosts.map(renderPostItem)}
              </div>
              {hasMore && (
                <div className={styles.loadMoreContainer}>
                  <Button
                    loading={loading}
                    onClick={loadMore}
                    className={styles.loadMoreButton}
                  >
                    Load more...
                  </Button>
                </div>
              )}
            </>
          )
        : (
            <div className={styles.emptyState}>
              <Empty
                description={t('listMode.noSentPosts' as any)}
              />
            </div>
          )}
    </div>
  )
}

export default SentList
