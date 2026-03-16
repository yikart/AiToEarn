/**
 * 生成中卡片
 * 显示在瀑布流中，展示正在生成的草稿数量，带 shimmer 渐变动画
 */

'use client'

import { memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { MorphingIcon } from '@/components/common/MorphingIcon'
import { cn } from '@/lib/utils'
import styles from './GeneratingCard.module.scss'

interface GeneratingCardProps {
  count: number
  onClick: () => void
}

export const GeneratingCard = memo(({ count, onClick }: GeneratingCardProps) => {
  const { t } = useTransClient('brandPromotion')

  if (count <= 0)
    return null

  return (
    <div
      data-testid="draftbox-generating-card"
      className={cn(
        'mb-4 h-[160px] rounded-lg border border-primary/20 bg-primary/5 overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary/40',
        styles.generatingCard,
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center h-full gap-4 relative z-10">
        <MorphingIcon size={32} />
        <span className="text-sm font-medium text-primary">
          {t('detail.generatingDrafts', { count })}
        </span>
      </div>
    </div>
  )
})

GeneratingCard.displayName = 'GeneratingCard'
