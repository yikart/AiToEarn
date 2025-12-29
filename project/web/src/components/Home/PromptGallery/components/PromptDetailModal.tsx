/**
 * PromptDetailModal - 提示词详情弹窗
 */

'use client'

import type { PromptItem } from '../types'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PromptDetailModalProps {
  item: PromptItem | null
  onClose: () => void
  onApply: (item: PromptItem) => void
  t: (key: string) => string
  lng?: string
}

export function PromptDetailModal({
  item,
  onClose,
  onApply,
  t,
  lng = 'zh-CN',
}: PromptDetailModalProps) {
  const isEnglish = lng === 'en'
  const getTitle = (it: PromptItem) => isEnglish && it.title_en ? it.title_en : it.title
  const getPrompt = (it: PromptItem) => isEnglish && it.prompt_en ? it.prompt_en : it.prompt
  const getSubCategory = (it: PromptItem) => isEnglish && it.sub_category_en ? it.sub_category_en : it.sub_category
  const getCategory = (it: PromptItem) => isEnglish && it.category_en ? it.category_en : it.category
  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0 overflow-hidden bg-card rounded-2xl flex flex-col">
        {item && (
          <>
            {/* 上半部分：图片 + 标题 + 标签 - 水平布局 */}
            <div className="flex gap-4 p-4 border-b border-border">
              {/* 图片缩略图 */}
              <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-muted">
                <img
                  src={item.preview}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* 标题和标签 */}
              <div className="flex-1 min-w-0">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-foreground line-clamp-2">
                    {getTitle(item)}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {getSubCategory(item) && (
                    <Badge
                      variant="secondary"
                      className="bg-muted text-muted-foreground text-xs"
                    >
                      {getSubCategory(item)}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground text-xs"
                  >
                    {getCategory(item)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 提示词内容区域 - 可滚动 */}
            <div className="flex-1 overflow-y-auto p-4">
              <label className="block text-sm font-semibold text-foreground mb-2">
                {t('modal.promptLabel')}
              </label>
              <div className="bg-muted rounded-xl p-4 max-h-[200px] overflow-y-auto border border-border">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {getPrompt(item)}
                </p>
              </div>
            </div>

            {/* 底部应用按钮 - 固定在底部 */}
            <div className="flex-shrink-0 p-4 border-t border-border bg-card">
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
