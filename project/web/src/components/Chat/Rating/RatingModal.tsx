/**
 * RatingModal - 任务评分模态框（复用）
 * 功能：查看/提交对任务的评分（1-5）和评论。评分 < 3 时评论为必填。
 */

'use client'

import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { agentApi } from '@/api/agent'
import { toast } from '@/lib/toast'
import { useTransClient } from '@/app/i18n/client'

interface RatingModalProps {
  taskId: string
  open: boolean
  onClose: () => void
  onSaved?: (data: { rating?: number | null; comment?: string | null }) => void
}

export const RatingModal: React.FC<RatingModalProps> = ({ taskId, open, onClose, onSaved }) => {
  const { t } = useTransClient('chat')
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)

  useEffect(() => {
    if (!open) return
    let mounted = true
    setInitialLoaded(false)
    ;(async () => {
      try {
        // Some deployments don't expose GET /tasks/:id/rating.
        // The existing task detail GET returns rating & ratingComment, so prefer that.
        const res = await agentApi.getTaskDetail(taskId)
        if (!mounted) return
        // Support both wrapped response { code, data } and direct TaskDetail
        const payload = (res && (res as any).data) ? (res as any).data : res
        setRating((payload && (payload.rating ?? null)) ?? null)
        setComment((payload && (payload.ratingComment ?? '')) ?? '')
      } catch (err) {
        // ignore 404 / not rated
        console.error('Get rating failed', err)
      } finally {
        if (mounted) setInitialLoaded(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [open, taskId])

  const canSubmit = () => {
    if (!rating) return false
    if (rating < 3 && comment.trim().length === 0) return false
    return true
  }

  const handleSubmit = async () => {
    if (!canSubmit()) {
      toast.error(t('rating.requireComment' as any) || 'Please provide a comment for low ratings')
      return
    }
    try {
      setLoading(true)
      await agentApi.submitTaskRating(taskId, { rating: rating as number, comment: comment.trim() })
      toast.success(t('rating.saveSuccess' as any) || 'Saved')
      onSaved?.({ rating: rating as number, comment: comment.trim() })
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(t('rating.saveFailed' as any) || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={t('rating.title' as any) || '评分'}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={t('rating.submit' as any) || '提交'}
      cancelText={t('rating.cancel' as any) || '取消'}
      confirmLoading={loading}
      width={520}
    >
      <div className="space-y-4 w-full">
        <div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, idx) => {
              const val = idx + 1
              const selected = rating !== null && rating >= val
              return (
                <button
                  key={val}
                  type="button"
                  aria-label={`star-${val}`}
                  onClick={() => setRating(val)}
                  className={`p-1 rounded ${selected ? 'text-amber-400' : 'text-muted-foreground'}`}
                >
                  {selected ? (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {rating ? `${rating} / 5` : t('rating.noRating' as any) || '未评分'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('rating.commentLabel' as any) || '评价（可选）'}
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px] resize-vertical"
            placeholder={t('rating.commentPlaceholder' as any) || '填写评价...'}
          />
          {rating !== null && rating < 3 && (
            <div className="text-xs text-destructive mt-1">
              {t('rating.commentRequiredIfLow' as any) || '低于 3 分需要填写理由'}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default RatingModal


