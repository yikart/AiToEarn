'use client'

/**
 * 平台交互功能测试页面
 * 用于测试小红书、抖音的点赞、评论、收藏功能
 */

import { useState } from 'react'
import { PlatType } from '@/app/config/platConfig'
import { platformManager } from '@/store/plugin/plats'
import type { BaseResult, CommentResult } from '@/store/plugin/plats'
import styles from './plats-test.module.scss'

type ActionType = 'like' | 'unlike' | 'comment' | 'favorite' | 'unfavorite'

interface TestLog {
  id: number
  time: string
  platform: string
  action: ActionType
  workId: string
  success: boolean
  message?: string
  data?: any
}

export default function PlatsTestPage() {
  // 表单状态
  const [platform, setPlatform] = useState<PlatType.Xhs | PlatType.Douyin>(PlatType.Xhs)
  const [workId, setWorkId] = useState('')
  const [commentContent, setCommentContent] = useState('')
  const [replyToCommentId, setReplyToCommentId] = useState('')

  // 加载状态
  const [loading, setLoading] = useState<ActionType | null>(null)

  // 测试日志
  const [logs, setLogs] = useState<TestLog[]>([])

  /**
   * 添加日志
   */
  const addLog = (
    action: ActionType,
    result: BaseResult | CommentResult,
    extraData?: any,
  ) => {
    const log: TestLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      platform: platform === PlatType.Xhs ? '小红书' : '抖音',
      action,
      workId,
      success: result.success,
      message: result.message,
      data: { ...result.rawData, ...extraData },
    }
    setLogs(prev => [log, ...prev])
  }

  /**
   * 点赞
   */
  const handleLike = async (isLike: boolean) => {
    if (!workId) {
      alert('请输入作品ID')
      return
    }

    const action = isLike ? 'like' : 'unlike'
    setLoading(action)

    try {
      const result = await platformManager.likeWork(platform, workId, isLike)
      addLog(action, result)
    }
    catch (error: any) {
      addLog(action, { success: false, message: error.message })
    }
    finally {
      setLoading(null)
    }
  }

  /**
   * 评论
   */
  const handleComment = async () => {
    if (!workId) {
      alert('请输入作品ID')
      return
    }
    if (!commentContent) {
      alert('请输入评论内容')
      return
    }

    setLoading('comment')

    try {
      const result = await platformManager.commentWork(platform, {
        workId,
        content: commentContent,
        replyToCommentId: replyToCommentId || undefined,
      })
      addLog('comment', result, { commentId: result.commentId })
    }
    catch (error: any) {
      addLog('comment', { success: false, message: error.message })
    }
    finally {
      setLoading(null)
    }
  }

  /**
   * 收藏
   */
  const handleFavorite = async (isFavorite: boolean) => {
    if (!workId) {
      alert('请输入作品ID')
      return
    }

    const action = isFavorite ? 'favorite' : 'unfavorite'
    setLoading(action)

    try {
      const result = await platformManager.favoriteWork(platform, workId, isFavorite)
      addLog(action, result)
    }
    catch (error: any) {
      addLog(action, { success: false, message: error.message })
    }
    finally {
      setLoading(null)
    }
  }

  /**
   * 清空日志
   */
  const clearLogs = () => {
    setLogs([])
  }

  /**
   * 获取操作名称
   */
  const getActionName = (action: ActionType): string => {
    const names: Record<ActionType, string> = {
      like: '点赞',
      unlike: '取消点赞',
      comment: '评论',
      favorite: '收藏',
      unfavorite: '取消收藏',
    }
    return names[action]
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🧪 平台交互测试</h1>
      <p className={styles.subtitle}>测试小红书、抖音的点赞、评论、收藏功能</p>

      {/* 配置区域 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>配置</h2>

        <div className={styles.formGroup}>
          <label>选择平台</label>
          <div className={styles.radioGroup}>
            <label className={styles.radio}>
              <input
                type="radio"
                checked={platform === PlatType.Xhs}
                onChange={() => setPlatform(PlatType.Xhs)}
              />
              <span className={styles.radioXhs}>小红书</span>
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                checked={platform === PlatType.Douyin}
                onChange={() => setPlatform(PlatType.Douyin)}
              />
              <span className={styles.radioDouyin}>抖音</span>
            </label>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>作品ID *</label>
          <input
            type="text"
            value={workId}
            onChange={e => setWorkId(e.target.value)}
            placeholder={platform === PlatType.Xhs ? '小红书笔记ID，如: 6911bfd10000000004021dd6' : '抖音视频ID，如: 7123456789012345678'}
            className={styles.input}
          />
        </div>
      </div>

      {/* 操作区域 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>操作</h2>

        {/* 点赞 */}
        <div className={styles.actionRow}>
          <span className={styles.actionLabel}>点赞</span>
          <div className={styles.actionButtons}>
            <button
              onClick={() => handleLike(true)}
              disabled={loading !== null}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {loading === 'like' ? '处理中...' : '👍 点赞'}
            </button>
            <button
              onClick={() => handleLike(false)}
              disabled={loading !== null}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              {loading === 'unlike' ? '处理中...' : '👎 取消点赞'}
            </button>
          </div>
        </div>

        {/* 收藏 */}
        <div className={styles.actionRow}>
          <span className={styles.actionLabel}>收藏</span>
          <div className={styles.actionButtons}>
            <button
              onClick={() => handleFavorite(true)}
              disabled={loading !== null}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {loading === 'favorite' ? '处理中...' : '⭐ 收藏'}
            </button>
            <button
              onClick={() => handleFavorite(false)}
              disabled={loading !== null}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              {loading === 'unfavorite' ? '处理中...' : '✖ 取消收藏'}
            </button>
          </div>
        </div>

        {/* 评论 */}
        <div className={styles.commentSection}>
          <span className={styles.actionLabel}>评论</span>
          <div className={styles.commentInputs}>
            <textarea
              value={commentContent}
              onChange={e => setCommentContent(e.target.value)}
              placeholder="输入评论内容..."
              className={styles.textarea}
              rows={3}
            />
            <input
              type="text"
              value={replyToCommentId}
              onChange={e => setReplyToCommentId(e.target.value)}
              placeholder="回复评论ID（可选，用于二级评论）"
              className={styles.input}
            />
            <button
              onClick={handleComment}
              disabled={loading !== null}
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`}
            >
              {loading === 'comment' ? '处理中...' : '💬 发送评论'}
            </button>
          </div>
        </div>
      </div>

      {/* 日志区域 */}
      <div className={styles.card}>
        <div className={styles.logHeader}>
          <h2 className={styles.cardTitle}>测试日志</h2>
          <button onClick={clearLogs} className={`${styles.btn} ${styles.btnSmall}`}>
            清空
          </button>
        </div>

        {logs.length === 0
          ? (
              <div className={styles.emptyLog}>暂无日志，执行操作后将显示结果</div>
            )
          : (
              <div className={styles.logList}>
                {logs.map(log => (
                  <div
                    key={log.id}
                    className={`${styles.logItem} ${log.success ? styles.logSuccess : styles.logError}`}
                  >
                    <div className={styles.logMeta}>
                      <span className={styles.logTime}>{log.time}</span>
                      <span className={styles.logPlatform}>{log.platform}</span>
                      <span className={styles.logAction}>{getActionName(log.action)}</span>
                      <span className={log.success ? styles.logStatusSuccess : styles.logStatusError}>
                        {log.success ? '✓ 成功' : '✗ 失败'}
                      </span>
                    </div>
                    <div className={styles.logWorkId}>
                      作品ID:
                      {' '}
                      {log.workId}
                    </div>
                    {log.message && <div className={styles.logMessage}>{log.message}</div>}
                    {log.data && (
                      <details className={styles.logDetails}>
                        <summary>查看原始数据</summary>
                        <pre>{JSON.stringify(log.data, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
      </div>
    </div>
  )
}

