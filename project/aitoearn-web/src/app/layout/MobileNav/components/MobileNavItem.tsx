import type { MobileNavItemProps } from '../types'
/**
 * MobileNavItem - 移动端单个导航项
 */
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { useTransClient } from '@/app/i18n/client'
import { useGetClientLng } from '@/hooks/useSystem'
import { cn } from '@/lib/utils'

export function MobileNavItem({
  path,
  translationKey,
  icon,
  isActive,
  onClose,
  className,
}: MobileNavItemProps) {
  const { t } = useTransClient('route')
  const lng = useGetClientLng()
  const fullPath = path.startsWith('/') ? `/${lng}${path}` : `/${lng}/${path}`

  return (
    <Link
      href={fullPath}
      onClick={onClose}
      data-testid={`mobile-nav-item-${translationKey}`}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all',
        'text-muted-foreground hover:bg-brand-cyan/10 hover:text-brand-cyan',
        isActive && 'bg-brand-cyan/10 text-brand-cyan',
        className,
      )}
    >
      <span className={cn('flex items-center justify-center', isActive && 'text-brand-cyan')}>
        {icon || <FileText size={20} />}
      </span>
      <span>{t(translationKey)}</span>
    </Link>
  )
}
