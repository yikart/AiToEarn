/**
 * MasonryCard - 弹框内瀑布流卡片组件
 */

'use client'

import type { PromptItem } from '../types'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LazyImage } from './LazyImage'

interface MasonryCardProps {
  item: PromptItem
  onApply: (item: PromptItem, e?: React.MouseEvent) => void
  onClick: (item: PromptItem) => void
  t: (key: string) => string
  lng?: string
}

export function MasonryCard({ item, onApply, onClick, t, lng = 'zh-CN' }: MasonryCardProps) {
  const isEnglish = lng === 'en'
  const title = isEnglish && item.title_en ? item.title_en : item.title
  const prompt = isEnglish && item.prompt_en ? item.prompt_en : item.prompt
  const subCategory = isEnglish && item.sub_category_en ? item.sub_category_en : item.sub_category
  const description = prompt.length > 100 ? `${prompt.substring(0, 100)}...` : prompt

  return (
    <div
      className="group cursor-pointer"
      onClick={() => onClick(item)}
    >
      <div className="relative bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-border/50 transition-all duration-500 transform hover:-translate-y-1">
        {/* 图片区域 */}
        <div className="relative overflow-hidden">
          <LazyImage src={item.preview} alt={item.title} />

          {/* 悬浮遮罩层 */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                {title}
              </h3>
              <p className="text-white/80 text-sm line-clamp-2 mb-3">
                {description}
              </p>

              {/* 标签 */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {subCategory && (
                  <Badge
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs"
                  >
                    {subCategory}
                  </Badge>
                )}
                <Badge
                  className={cn(
                    'text-xs border backdrop-blur-sm',
                    item.mode === 'edit'
                      ? 'bg-info/30 text-white border-info/50'
                      : 'bg-muted-foreground/30 text-white border-muted-foreground/50',
                  )}
                >
                  {t(`badges.${item.mode === 'edit' ? 'edit' : 'generate'}` as any)}
                </Badge>
              </div>

              {/* 应用按钮 */}
              <Button
                size="sm"
                onClick={e => onApply(item, e)}
                className="w-full bg-card text-foreground hover:bg-muted rounded-xl font-medium shadow-lg"
              >
                <Check className="w-4 h-4 mr-1.5" />
                {t('applyButton')}
              </Button>
            </div>
          </div>
        </div>

        {/* 底部信息栏（默认显示） */}
        <div className="p-3 bg-card group-hover:opacity-0 transition-opacity duration-300">
          <h3 className="font-semibold text-foreground text-sm line-clamp-1 mb-1">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {subCategory && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {subCategory}
              </span>
            )}
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                item.mode === 'edit'
                  ? 'bg-info/10 text-info'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {t(`badges.${item.mode === 'edit' ? 'edit' : 'generate'}` as any)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
