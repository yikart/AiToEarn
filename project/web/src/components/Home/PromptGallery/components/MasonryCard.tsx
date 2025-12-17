/**
 * MasonryCard - 弹框内瀑布流卡片组件
 */

'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LazyImage } from './LazyImage'
import type { PromptItem } from '../types'

interface MasonryCardProps {
  item: PromptItem
  onApply: (item: PromptItem, e?: React.MouseEvent) => void
  onClick: (item: PromptItem) => void
  t: (key: string) => string
}

export function MasonryCard({ item, onApply, onClick, t }: MasonryCardProps) {
  const description =
    item.prompt.length > 100 ? item.prompt.substring(0, 100) + '...' : item.prompt

  return (
    <div
      className="group cursor-pointer"
      onClick={() => onClick(item)}
    >
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-200 transition-all duration-500 transform hover:-translate-y-1">
        {/* 图片区域 */}
        <div className="relative overflow-hidden">
          <LazyImage src={item.preview} alt={item.title} />

          {/* 悬浮遮罩层 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                {item.title}
              </h3>
              <p className="text-white/80 text-sm line-clamp-2 mb-3">
                {description}
              </p>

              {/* 标签 */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {item.sub_category && (
                  <Badge
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs"
                  >
                    {item.sub_category}
                  </Badge>
                )}
                <Badge
                  className={cn(
                    'text-xs border backdrop-blur-sm',
                    item.mode === 'edit'
                      ? 'bg-blue-500/30 text-white border-blue-400/50'
                      : 'bg-gray-500/30 text-white border-gray-400/50'
                  )}
                >
                  {t(`badges.${item.mode === 'edit' ? 'edit' : 'generate'}` as any)}
                </Badge>
              </div>

              {/* 应用按钮 */}
              <Button
                size="sm"
                onClick={(e) => onApply(item, e)}
                className="w-full bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-medium shadow-lg"
              >
                <Check className="w-4 h-4 mr-1.5" />
                {t('applyButton')}
              </Button>
            </div>
          </div>
        </div>

        {/* 底部信息栏（默认显示） */}
        <div className="p-3 bg-white group-hover:opacity-0 transition-opacity duration-300">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
            {item.title}
          </h3>
          <div className="flex items-center gap-2">
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

