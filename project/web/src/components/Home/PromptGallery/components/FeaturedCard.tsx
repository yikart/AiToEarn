/**
 * FeaturedCard - 首页精选卡片组件（固定高度）
 */

'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LazyImage } from './LazyImage'
import type { PromptItem } from '../types'

interface FeaturedCardProps {
  item: PromptItem
  onApply: (item: PromptItem, e?: React.MouseEvent) => void
  onClick: (item: PromptItem) => void
  t: (key: string) => string
}

export function FeaturedCard({ item, onApply, onClick, t }: FeaturedCardProps) {
  const description =
    item.prompt.length > 80 ? item.prompt.substring(0, 80) + '...' : item.prompt

  return (
    <div
      className="group cursor-pointer h-full"
      onClick={() => onClick(item)}
    >
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-200 transition-all duration-500 transform hover:-translate-y-1 h-full flex flex-col">
        {/* 图片区域 - 固定高度 */}
        <div className="relative overflow-hidden h-48 flex-shrink-0">
          <LazyImage src={item.preview} alt={item.title} fixedHeight />

          {/* 悬浮遮罩层 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="text-white font-bold text-base mb-1 line-clamp-1">
                {item.title}
              </h3>
              <p className="text-white/80 text-xs line-clamp-2 mb-2">
                {description}
              </p>

              {/* 应用按钮 */}
              <Button
                size="sm"
                onClick={(e) => onApply(item, e)}
                className="w-full bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-medium shadow-lg text-xs h-8"
              >
                <Check className="w-3 h-3 mr-1" />
                {t('applyButton')}
              </Button>
            </div>
          </div>
        </div>

        {/* 底部信息栏（固定高度） */}
        <div className="p-3 bg-white group-hover:opacity-0 transition-opacity duration-300 flex-1 flex flex-col justify-between">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-2">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {item.sub_category && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {item.sub_category}
              </span>
            )}
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                item.mode === 'edit'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
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

