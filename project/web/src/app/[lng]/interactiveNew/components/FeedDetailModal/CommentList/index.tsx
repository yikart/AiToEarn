'use client'

/**
 * 评论列表组件
 * 支持：
 * - 上拉无限滚动加载评论
 * - 展开/收起回复
 * - 加载更多回复
 */

import type { CommentItem as CommentItemType, SupportedPlatformType } from '@/store/plugin/plats/types'
import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import InfiniteScroll from 'react-infinite-scroll-component'
import { platformManager } from '@/store/plugin/plats'
import CommentItem from './CommentItem'

interface CommentListProps {
  /** 作品ID */
  workId: string
  /** 平台类型 */
  platform: SupportedPlatformType
  /** 评论总数 */
  commentCount?: string | null
  /** xsec_token（小红书需要） */
  xsecToken?: string
}

/**
 * 评论列表组件
 */
function CommentList({ workId, platform, commentCount, xsecToken }: CommentListProps) {
  const { t } = useTranslation('interactiveNew')

  // 评论列表状态
  const [comments, setComments] = useState<CommentItemType[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载更多回复的状态
  const [loadingReplyId, setLoadingReplyId] = useState<string | null>(null)

  // 是否已初始化
  const initialized = useRef(false)

  /**
   * 加载评论列表
   */
  const loadComments = useCallback(async (isLoadMore = false) => {
    if (!workId || !platform)
      return

    if (isLoadMore) {
      setLoadingMore(true)
    }
    else {
      setLoading(true)
      setError(null)
    }

    try {
      const result = await platformManager.getCommentList(platform, {
        workId,
        cursor: isLoadMore ? cursor : '',
        count: 10,
        xsecToken,
      })

      if (result.success) {
        if (isLoadMore) {
          setComments(prev => [...prev, ...result.comments])
        }
        else {
          setComments(result.comments)
        }
        setCursor(result.cursor)
        setHasMore(result.hasMore)
      }
      else {
        setError(result.message || 'Failed to load comments')
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
    }
    finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [workId, platform, cursor, xsecToken])

  /**
   * 加载更多回复
   */
  const handleLoadMoreReplies = useCallback(async (commentId: string, replyCursor: string) => {
    if (!workId || !platform)
      return

    setLoadingReplyId(commentId)

    try {
      const result = await platformManager.getSubCommentList(platform, {
        workId,
        rootCommentId: commentId,
        cursor: replyCursor,
        count: 10,
        xsecToken,
      })

      if (result.success) {
        // 更新评论的回复列表
        setComments(prev => prev.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...comment.replies, ...result.comments],
              replyCursor: result.cursor,
              hasMoreReplies: result.hasMore,
            }
          }
          return comment
        }))
      }
    }
    catch (err) {
      console.error('加载回复失败:', err)
    }
    finally {
      setLoadingReplyId(null)
    }
  }, [workId, platform, xsecToken])

  /**
   * 初始加载
   */
  useEffect(() => {
    if (workId && platform && !initialized.current) {
      initialized.current = true
      loadComments(false)
    }
  }, [workId, platform, loadComments])

  /**
   * workId 变化时重新加载
   */
  useEffect(() => {
    if (initialized.current) {
      // 重置状态
      setComments([])
      setCursor('')
      setHasMore(true)
      setError(null)
      initialized.current = false
      // 重新加载
      setTimeout(() => {
        initialized.current = true
        loadComments(false)
      }, 0)
    }
  }, [workId])

  /**
   * 处理加载更多
   */
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadComments(true)
    }
  }, [loadComments, loadingMore, hasMore])

  // 首次加载中
  if (loading && comments.length === 0) {
    return (
      <div className="commentList_loading">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <span>加载评论中...</span>
      </div>
    )
  }

  // 加载错误
  if (error && comments.length === 0) {
    return (
      <div className="commentList_error">
        <span>
          ⚠️
          {error}
        </span>
        <button className="commentList_retryBtn" onClick={() => loadComments(false)}>
          重试
        </button>
      </div>
    )
  }

  // 无评论
  if (!loading && comments.length === 0) {
    return (
      <div className="commentList_empty">
        <span>💬</span>
        <p>暂无评论</p>
      </div>
    )
  }

  return (
    <div className="commentList">
      <InfiniteScroll
        dataLength={comments.length}
        next={handleLoadMore}
        hasMore={hasMore}
        loader={(
          <div className="commentList_loading commentList_loading-inline">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />} />
            <span>加载更多评论...</span>
          </div>
        )}
        endMessage={
          comments.length > 0 ? (
            <div className="commentList_noMore">
              没有更多评论了
            </div>
          ) : null
        }
        scrollableTarget="feedDetailModal_content"
      >
        {/* 评论列表 */}
        <div className="commentList_items">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLoadMoreReplies={handleLoadMoreReplies}
              loadingReplyId={loadingReplyId || undefined}
            />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  )
}

export default memo(CommentList)
