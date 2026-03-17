/**
 * RatingModal - 任务评分模态框（复用）
 * 功能：查看/提交对任务的评分（1-5）和评论。评分 < 3 时评论为必填。
 */

'use client'

import { Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { agentApi } from '@/api/agent'
import { useTransClient } from '@/app/i18n/client'
import { Modal } from '@/components/ui/modal'
import { StarRating } from '@/components/ui/star-rating'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'

interface RatingModalProps {
  taskId: string
  open: boolean
  onClose: () => void
  onSaved?: (data: { rating?: number | null, comment?: string | null }) => void
  /** 默认选中的评分（用于从外部传入初始值，如用户在列表中点击的星级） */
  defaultRating?: number | null
}

export const RatingModal: React.FC<RatingModalProps> = ({
  taskId,
  open,
  onClose,
  onSaved,
  defaultRating,
}) => {
  const { t } = useTransClient('chat')
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [fetchingRating, setFetchingRating] = useState(false)

  useEffect(() => {
    if (!open)
      return
    let mounted = true
    setInitialLoaded(false)
    setFetchingRating(true)
    ;(async () => {
      try {
        // Some deployments don't expose GET /tasks/:id/rating.
        // The existing task detail GET returns rating & ratingComment, so prefer that.
        const res = await agentApi.getTaskDetail(taskId)
        if (!mounted)
          return
        // Support both wrapped response { code, data } and direct TaskDetail
        const payload = res && (res as any).data ? (res as any).data : res
        const apiRating = (payload && (payload.rating ?? null)) ?? null
        // 如果 API 返回的 rating 为 null，且有传入 defaultRating，则使用 defaultRating
        setRating(apiRating ?? defaultRating ?? null)
        setComment((payload && (payload.ratingComment ?? '')) ?? '')
      }
      catch (err) {
        // ignore 404 / not rated
        console.error('Get rating failed', err)
        // 加载失败时，如果有 defaultRating，使用它
        if (mounted && defaultRating) {
          setRating(defaultRating)
        }
      }
      finally {
        if (mounted) {
          setInitialLoaded(true)
          setFetchingRating(false)
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [open, taskId, defaultRating])

  const canSubmit = () => {
    if (!rating)
      return false
    if (rating < 3 && comment.trim().length === 0)
      return false
    return true
  }

  const handleSubmit = async () => {
    if (!canSubmit()) {
      toast.error(t('rating.requireComment') || 'Please provide a comment for low ratings')
      return
    }
    try {
      setLoading(true)
      await agentApi.submitTaskRating(taskId, { rating: rating as number, comment: comment.trim() })
      // Delegate success toast to caller to avoid duplicate notifications
      onSaved?.({ rating: rating as number, comment: comment.trim() })
      onClose()
    }
    catch (err) {
      console.error(err)
      toast.error(t('rating.saveFailed') || 'Save failed')
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={t('rating.title')}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={t('rating.submit')}
      cancelText={t('rating.cancel')}
      confirmLoading={loading}
      width={520}
    >
      <div className="space-y-4 w-full">
        {fetchingRating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {t('rating.loading') || '加载中...'}
            </span>
          </div>
        ) : (
          <>
            <div>
              <StarRating value={rating} onChange={setRating} size="md" className="gap-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {rating ? `${rating} / 5` : t('rating.noRating') || '未评分'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('rating.commentLabel') || '评价（可选）'}
              </label>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="min-h-[100px] resize-vertical"
                placeholder={t('rating.commentPlaceholder') || '填写评价...'}
              />
              {rating !== null && rating < 3 && (
                <div className="text-xs text-destructive mt-1">
                  {t('rating.commentRequiredIfLow') || '低于 3 分需要填写理由'}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default RatingModal
