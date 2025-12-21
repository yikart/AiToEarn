'use client'

/**
 * 评论项组件
 * 显示单条评论，支持展开/收起回复
 */

import { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { HeartOutlined, HeartFilled, DownOutlined, LoadingOutlined } from '@ant-design/icons'
import type { CommentItem as CommentItemType } from '@/store/plugin/plats/types'

interface CommentItemProps {
  /** 评论数据 */
  comment: CommentItemType
  /** 是否为子评论 */
  isReply?: boolean
  /** 加载更多回复 */
  onLoadMoreReplies?: (commentId: string, cursor: string) => Promise<void>
  /** 正在加载更多回复的评论ID */
  loadingReplyId?: string
}

/**
 * 格式化时间
 */
function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hours ago`
  if (days < 7) return `${days} days ago`
  if (days < 365) {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * 格式化数字
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return String(count)
}

/**
 * 评论项组件
 */
function CommentItem({
  comment,
  isReply = false,
  onLoadMoreReplies,
  loadingReplyId,
}: CommentItemProps) {
  const { t } = useTranslation('interactiveNew')
  const [showReplies, setShowReplies] = useState(true)

  const isLoadingReplies = loadingReplyId === comment.id

  /**
   * 处理展开/收起回复
   */
  const handleToggleReplies = useCallback(() => {
    setShowReplies(prev => !prev)
  }, [])

  /**
   * 处理加载更多回复
   */
  const handleLoadMore = useCallback(async () => {
    if (onLoadMoreReplies && comment.replyCursor) {
      await onLoadMoreReplies(comment.id, comment.replyCursor)
    }
  }, [onLoadMoreReplies, comment.id, comment.replyCursor])

  return (
    <div className={`commentItem ${isReply ? 'commentItem-reply' : ''}`}>
      {/* 头像 */}
      <img
        src={comment.user.avatar || '/images/default-avatar.png'}
        alt={comment.user.nickname}
        className="commentItem_avatar"
      />

      {/* 内容区域 */}
      <div className="commentItem_content">
        {/* 用户名和标签 */}
        <div className="commentItem_header">
          <span className="commentItem_nickname">{comment.user.nickname}</span>
          {comment.isAuthor && <span className="commentItem_authorTag">{t('author')}</span>}
        </div>

        {/* 评论内容 */}
        <div className="commentItem_text">
          {/* 回复目标 */}
          {isReply && comment.replyTo && (
            <span className="commentItem_replyTo">
              {t('replyTo')} <span className="commentItem_replyTo_name">@{comment.replyTo.user.nickname}</span>:
            </span>
          )}
          {comment.content}
        </div>

        {/* 底部信息 */}
        <div className="commentItem_footer">
          <span className="commentItem_time">{formatTime(comment.createTime)}</span>
          {comment.ipLocation && (
            <span className="commentItem_location">{comment.ipLocation}</span>
          )}
          {/* 点赞 */}
          <button className={`commentItem_likeBtn ${comment.isLiked ? 'commentItem_likeBtn-active' : ''}`}>
            {comment.isLiked ? <HeartFilled /> : <HeartOutlined />}
            {comment.likeCount > 0 && <span>{formatCount(comment.likeCount)}</span>}
          </button>
        </div>

        {/* 回复列表（仅一级评论显示） */}
        {!isReply && comment.replyCount > 0 && (
          <div className="commentItem_replies">
            {/* 展开/收起按钮 */}
            {comment.replies.length > 0 && (
              <button className="commentItem_toggleReplies" onClick={handleToggleReplies}>
                <DownOutlined className={showReplies ? 'commentItem_toggleIcon-expanded' : ''} />
                {showReplies ? '收起回复' : `展开${comment.replyCount}条回复`}
              </button>
            )}

            {/* 回复列表 */}
            {showReplies && comment.replies.length > 0 && (
              <div className="commentItem_repliesList">
                {comment.replies.map(reply => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    isReply
                  />
                ))}

                {/* 加载更多回复 */}
                {comment.hasMoreReplies && (
                  <button
                    className="commentItem_loadMore"
                    onClick={handleLoadMore}
                    disabled={isLoadingReplies}
                  >
                    {isLoadingReplies ? (
                      <>
                        <LoadingOutlined />
                        加载中...
                      </>
                    ) : (
                      `查看更多回复`
                    )}
                  </button>
                )}
              </div>
            )}

            {/* 初始没有回复但有回复数时显示加载按钮 */}
            {comment.replies.length === 0 && comment.replyCount > 0 && (
              <button
                className="commentItem_loadMore"
                onClick={handleLoadMore}
                disabled={isLoadingReplies}
              >
                {isLoadingReplies ? (
                  <>
                    <LoadingOutlined />
                    加载中...
                  </>
                ) : (
                  `查看${comment.replyCount}条回复`
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(CommentItem)

