'use client'

/**
 * 详情区域组件
 * - 顶部：作者区域（固定）
 * - 中间：可滚动内容（描述、话题、评论）
 * - 底部：操作区域（固定）
 */

import type { SupportedPlatformType } from '@/store/plugin/plats/types'
import {
  HeartFilled,
  HeartOutlined,
  LoadingOutlined,
  MessageOutlined,
  ShareAltOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons'
import { Input, Spin } from 'antd'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatType } from '@/app/config/platConfig'
import { useDetailModalStore } from '../../store/detailStore'
import CommentList from './CommentList'

/**
 * 从描述中移除话题标签（因为话题会单独显示）
 * 支持多平台格式：
 * - 小红书：#话题名[话题]#
 * @param text 原始描述文本
 * @param platform 当前平台
 * @returns 移除话题后的纯文本
 */
function removeTopicsFromDescription(text: string, platform: SupportedPlatformType | null): string {
  if (!text)
    return ''

  let result = text

  switch (platform) {
    case PlatType.Xhs:
      // 小红书格式：#话题名[话题]#
      result = result.replace(/#[^#[\]]+\[话题\]#/g, '')
      break

    default:
      // 通用格式：移除 #话题名[话题]# 和 #话题名
      result = result.replace(/#[^#[\]]+\[话题\]#/g, '')
      result = result.replace(/#[^\s#]+#?/g, '')
      break
  }

  // 清理多余空格（保留换行符）
  return result
    .replace(/[^\S\n]+/g, ' ') // 将非换行的空白字符替换为单个空格
    .replace(/\n{3,}/g, '\n\n') // 将连续3个及以上换行替换为2个
    .trim()
}

/**
 * 详情区域组件
 */
function DetailSection() {
  const { t } = useTranslation('interactiveNew')
  const { detail, preview, loading, error, platform, originData } = useDetailModalStore()

  // 合并详情和预览数据
  const displayData = useMemo(() => {
    if (detail) {
      return {
        title: detail.title,
        authorName: detail.author.name,
        authorAvatar: detail.author.avatar,
        authorUrl: detail.author.url,
        authorId: detail.author.id,
        isLiked: detail.interactInfo.isLiked,
        isFollowed: detail.interactInfo.isFollowed,
        isCollected: detail.interactInfo.isCollected,
        likeCount: detail.interactInfo.likeCount,
        collectCount: detail.interactInfo.collectCount,
        commentCount: detail.interactInfo.commentCount,
        shareCount: detail.interactInfo.shareCount,
        description: detail.description,
        topics: detail.topics,
        publishTime: detail.publishTime,
        ipLocation: detail.ipLocation,
      }
    }
    if (preview) {
      return {
        title: preview.title,
        authorName: preview.authorName,
        authorAvatar: preview.authorAvatar,
        authorUrl: preview.authorUrl,
        authorId: preview.authorId,
        isLiked: preview.isLiked,
        isFollowed: preview.isFollowed,
        isCollected: false,
        likeCount: preview.likeCount,
        collectCount: null as string | null,
        commentCount: null as string | null,
        shareCount: null as string | null,
        description: null as string | null,
        topics: null as Array<{ name: string, url: string }> | null,
        publishTime: null as number | null | undefined,
        ipLocation: null as string | null | undefined,
      }
    }
    return null
  }, [detail, preview])

  /**
   * 格式化发布时间
   */
  const formatPublishTime = useCallback((timestamp?: number | null) => {
    if (!timestamp)
      return ''
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60)
      return `${minutes}分钟前`
    if (hours < 24)
      return `${hours}小时前`
    if (days < 30)
      return `${days}天前`
    return new Date(timestamp).toLocaleDateString()
  }, [])

  if (!displayData)
    return null

  return (
    <div className="feedDetailModal_detail">
      {/* 顶部：作者区域（固定） */}
      <div className="feedDetailModal_header">
        <a
          href={displayData.authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="feedDetailModal_author"
          onClick={e => e.stopPropagation()}
        >
          <img
            src={displayData.authorAvatar || '/images/default-avatar.png'}
            alt={displayData.authorName}
            className="feedDetailModal_author_avatar"
          />
          <span className="feedDetailModal_author_name">{displayData.authorName}</span>
        </a>
        {/* 关注按钮 */}
        <button
          className={`feedDetailModal_followBtn ${displayData.isFollowed ? 'feedDetailModal_followBtn-followed' : ''}`}
        >
          {displayData.isFollowed ? t('followed') : t('follow')}
        </button>
      </div>

      {/* 中间：可滚动内容区域 */}
      <div className="feedDetailModal_content" id="feedDetailModal_content">
        {/* 标题和描述 */}
        <div className="feedDetailModal_desc">
          <h2 className="feedDetailModal_desc_title">{displayData.title || t('noTitle')}</h2>

          {/* 描述（移除话题标签，话题会单独显示） */}
          {loading ? (
            <div className="feedDetailModal_skeleton">
              <div className="skeleton_line" />
              <div className="skeleton_line skeleton_line-short" />
            </div>
          ) : (() => {
            const cleanDesc = removeTopicsFromDescription(displayData.description || '', platform)
            return cleanDesc && cleanDesc !== displayData.title ? (
              <p className="feedDetailModal_desc_text">{cleanDesc}</p>
            ) : null
          })()}

          {/* 话题标签 */}
          {loading ? (
            <div className="feedDetailModal_topics_skeleton">
              <div className="skeleton_tag" />
              <div className="skeleton_tag" />
              <div className="skeleton_tag" />
            </div>
          ) : displayData.topics && displayData.topics.length > 0 ? (
            <div className="feedDetailModal_topics">
              {displayData.topics.map((topic, index) => (
                <a
                  key={index}
                  href={topic.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="feedDetailModal_topic"
                  onClick={e => e.stopPropagation()}
                >
                  #
                  {topic.name}
                </a>
              ))}
            </div>
          ) : null}

          {/* 发布时间和位置 */}
          <div className="feedDetailModal_meta">
            {displayData.publishTime && (
              <span>{formatPublishTime(displayData.publishTime)}</span>
            )}
            {displayData.ipLocation && <span>{displayData.ipLocation}</span>}
          </div>
        </div>

        {/* Comments section */}
        <div className="feedDetailModal_comments">
          <div className="feedDetailModal_comments_header">
            {loading || displayData.commentCount === null ? (
              <Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} size="small" />
            ) : (
              displayData.commentCount
            )}
            {' '}
            {t('comments')}
          </div>

          {/* 评论列表 */}
          <div className="feedDetailModal_comments_list">
            {platform && detail?.workId && (
              <CommentList
                workId={detail.workId}
                platform={platform}
                commentCount={displayData.commentCount}
                xsecToken={originData?.xsec_token}
              />
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="feedDetailModal_error">
            <span>
              ⚠️
              {error}
            </span>
          </div>
        )}
      </div>

      {/* 底部：操作区域（固定） */}
      <div className="feedDetailModal_footer">
        {/* 评论输入框 */}
        <div className="feedDetailModal_commentInput">
          <Input placeholder={t('commentPlaceholder')} className="feedDetailModal_commentInput_field" />
        </div>

        {/* 操作按钮 */}
        <div className="feedDetailModal_actions">
          {/* 点赞 */}
          <button
            className={`feedDetailModal_actionBtn ${displayData.isLiked ? 'feedDetailModal_actionBtn-active' : ''}`}
          >
            {displayData.isLiked ? <HeartFilled /> : <HeartOutlined />}
            <span>{displayData.likeCount}</span>
          </button>

          {/* 收藏 */}
          <button
            className={`feedDetailModal_actionBtn ${displayData.isCollected ? 'feedDetailModal_actionBtn-collected' : ''}`}
          >
            {displayData.isCollected ? <StarFilled /> : <StarOutlined />}
            {loading || displayData.collectCount === null ? (
              <Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} size="small" />
            ) : (
              <span>{displayData.collectCount}</span>
            )}
          </button>

          {/* 评论 */}
          <button className="feedDetailModal_actionBtn">
            <MessageOutlined />
            {loading || displayData.commentCount === null ? (
              <Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} size="small" />
            ) : (
              <span>{displayData.commentCount}</span>
            )}
          </button>

          {/* 分享 */}
          <button className="feedDetailModal_actionBtn">
            <ShareAltOutlined />
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(DetailSection)
