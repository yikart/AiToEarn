/**
 * FavoriteButton - 收藏按钮组件
 * 功能：支持收藏/取消收藏操作，带 loading 状态和红心动画
 */

'use client'

import { Heart, Loader2 } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface IFavoriteButtonProps {
  /** 是否已收藏 */
  isFavorited: boolean
  /** 是否加载中 */
  isLoading?: boolean
  /** 点击回调 */
  onClick?: (e: React.MouseEvent) => void
  /** 是否只显示图标（不显示文字） */
  iconOnly?: boolean
  /** 按钮变体 */
  variant?: 'default' | 'ghost' | 'outline'
  /** 自定义类名 */
  className?: string
  /** 图标大小 */
  iconSize?: 'sm' | 'md' | 'lg'
}

/**
 * FavoriteButton - 可复用的收藏按钮
 */
export function FavoriteButton({
  isFavorited,
  isLoading = false,
  onClick,
  iconOnly = false,
  variant = 'ghost',
  className,
  iconSize = 'md',
}: IFavoriteButtonProps) {
  const { t } = useTransClient('chat')

  const iconSizeClass = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[iconSize]

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (isLoading)
      return
    onClick?.(e)
  }

  return (
    <Button
      variant={variant}
      size={iconOnly ? 'icon' : 'sm'}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'cursor-pointer transition-colors',
        iconOnly ? 'h-8 w-8' : 'h-8 px-2 gap-1',
        className,
      )}
      aria-label={isFavorited ? t('task.unfavorite') : t('task.favorite')}
    >
      {isLoading ? (
        <Loader2 className={cn(iconSizeClass, 'animate-spin')} />
      ) : (
        <Heart
          className={cn(
            iconSizeClass,
            'transition-colors',
            isFavorited && 'text-red-500 fill-red-500',
          )}
        />
      )}
      {!iconOnly && (
        <span className="text-xs">{isFavorited ? t('task.unfavorite') : t('task.favorite')}</span>
      )}
    </Button>
  )
}

export default FavoriteButton
