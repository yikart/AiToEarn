/**
 * PromptDetailModal - 提示词详情弹窗
 */

'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PromptItem } from '../types'

interface PromptDetailModalProps {
  item: PromptItem | null
  onClose: () => void
  onApply: (item: PromptItem) => void
  t: (key: string) => string
}

export function PromptDetailModal({
  item,
  onClose,
  onApply,
  t,
}: PromptDetailModalProps) {
  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden bg-card rounded-2xl flex flex-col">
        {item && (
          <>
            {/* 图片区域 - 自适应高度，最大 400px */}
            <div className="relative flex-shrink-0 max-h-[400px] overflow-hidden bg-muted">
              <img
                src={item.preview}
                alt={item.title}
                className="w-full h-auto max-h-[400px] object-contain"
              />
            </div>

            {/* 内容区域 - 可滚动 */}
            <div className="p-6 flex-1 overflow-y-auto">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {item.title}
                </DialogTitle>
              </DialogHeader>

              {/* 标签 */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {item.sub_category && (
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground"
                  >
                    {item.sub_category}
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground"
                >
                  {item.category}
                </Badge>
              </div>

              {/* 提示词内容 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  {t('modal.promptLabel')}
                </label>
                <div className="bg-muted rounded-xl p-4 max-h-48 overflow-y-auto border border-border">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {item.prompt}
                  </p>
                </div>
              </div>

              {/* 应用按钮 */}
              <Button
                size="lg"
                onClick={() => onApply(item)}
                className="w-full rounded-xl font-semibold"
              >
                <Check className="w-5 h-5 mr-2" />
                {t('modal.applyButton')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

