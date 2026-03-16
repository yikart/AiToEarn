/**
 * VideoDetailModal - 视频详情弹窗组件
 * 功能：展示视频播放和提示词内容，支持复制提示词
 */
'use client'

import type { PromptGalleryItem, VideoDetailModalProps } from '../types'
import { Check, Copy } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

/** 内部内容组件属性 */
interface ModalContentProps {
  onOpenChange: (open: boolean) => void
  item: PromptGalleryItem
  /** 应用提示词回调（包含 prompt 和 materials） */
  onApplyPrompt?: (data: { prompt: string, materials?: string[] }) => void
}

/** 内部内容组件 */
const ModalContent = memo(({ onOpenChange, item, onApplyPrompt }: ModalContentProps) => {
  const { t: commonT } = useTransClient('common')
  const { t } = useTransClient('promptGallery')
  const [copied, setCopied] = useState(false)

  // 复制提示词
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(item.prompt)
      setCopied(true)
      toast.success(t('copiedSuccess'))
      // 2 秒后重置复制状态
      setTimeout(() => setCopied(false), 2000)
    }
    catch {
      toast.error(t('copyFailed'))
    }
  }, [item.prompt, t])

  // 应用提示词
  const handleApply = useCallback(() => {
    if (onApplyPrompt) {
      onApplyPrompt({
        prompt: item.prompt,
        materials: item.materials,
      })
      // 先关闭弹窗
      onOpenChange(false)
      // 延迟后滚动到页面顶部（等弹窗关闭动画完成）
      setTimeout(() => {
        const mainContent = document.getElementById('main-content')
        if (mainContent) {
          mainContent.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 100)
    }
  }, [item.prompt, item.materials, onApplyPrompt, onOpenChange])

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(900px,95vw)] flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-4 py-3 sm:px-6 sm:py-4">
          <DialogTitle>{item.title}</DialogTitle>
        </DialogHeader>

        {/* 内容区域：移动端上下布局，PC 左右布局 */}
        <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row')}>
          {/* 左侧/上方：视频播放 */}
          <div
            className={cn(
              'shrink-0 sm:w-1/2 sm:shrink',
              'flex items-center justify-center',
              'bg-gradient-to-br from-muted/50 to-muted',
              'p-1 sm:p-2',
              'max-h-[40vh] sm:max-h-none',
            )}
          >
            <div className="relative w-full sm:h-full max-h-[40vh] sm:max-h-[calc(90vh-120px)] overflow-hidden rounded-lg shadow-lg">
              <video
                src={item.video}
                poster={item.cover}
                controls
                autoPlay
                loop
                playsInline
                className="w-full max-h-[40vh] sm:h-full sm:max-h-none rounded-lg object-contain"
              />
            </div>
          </div>

          {/* 右侧/下方：提示词内容 */}
          <div className={cn('flex min-h-0 flex-col flex-1 overflow-hidden', 'sm:w-1/2')}>
            {/* 提示词标签和复制按钮 - 固定高度 */}
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">
                {t('modal.promptLabel')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 cursor-pointer gap-1.5 px-3"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">{commonT('downloadApp.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>{commonT('downloadApp.copy')}</span>
                  </>
                )}
              </Button>
            </div>

            {/* 提示词内容 - 可滚动 */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <pre
                className={cn(
                  'whitespace-pre-wrap break-words font-sans text-sm',
                  'leading-relaxed text-foreground',
                )}
              >
                {item.prompt}
              </pre>

              {/* 素材展示区域 */}
              {item.materials && item.materials.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {t('modal.materialsLabel')}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-[#c565ef]/10 to-[#55D9ED]/10 text-foreground/70 border border-[#c565ef]/20">
                      {item.materials.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.materials.map((material, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted hover:border-[#c565ef]/40 transition-colors"
                      >
                        <Image src={material} alt={`material-${idx + 1}`} fill className="object-cover" sizes="64px" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{t('modal.materialsHint')}</p>
                </div>
              )}
            </div>

            {/* 应用提示词按钮 - 固定在底部 */}
            {onApplyPrompt && (
              <div className="shrink-0 border-t p-4">
                <Button onClick={handleApply} className="w-full cursor-pointer">
                  {t('modal.applyButton')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

/**
 * VideoDetailModal - 视频详情弹窗
 * 使用两层组件模式避免动态加载 namespace 导致闪烁
 */
export function VideoDetailModal({
  open,
  onOpenChange,
  item,
  onApplyPrompt,
}: VideoDetailModalProps) {
  // 只在打开且有数据时渲染内部组件
  if (!open || !item)
    return null

  return <ModalContent onOpenChange={onOpenChange} item={item} onApplyPrompt={onApplyPrompt} />
}
