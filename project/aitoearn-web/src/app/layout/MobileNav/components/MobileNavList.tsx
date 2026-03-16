import type { MobileNavListProps } from '../types'
/**
 * MobileNavList - 移动端导航列表，包含主导航和"更多"折叠菜单
 */
import {
  ChevronDown,
  ChevronUp,
  Globe,
  MoreHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { routerData } from '@/app/layout/routerData'
import { NAV_GROUP_KEYS } from '@/app/layout/shared'
import { cn } from '@/lib/utils'
import { MobileMyChannelsButton } from './MobileMyChannelsButton'
import { MobileNavItem } from './MobileNavItem'

export function MobileNavList({
  currentRoute,
  onClose,
  onOpenMyChannels,
}: MobileNavListProps) {
  const { t } = useTransClient(['route', 'common'])
  const [moreOpen, setMoreOpen] = useState(false)

  // Main items: only Home and Publish (accounts)
  const mainItems = routerData.filter(i => !NAV_GROUP_KEYS.includes(i.translationKey as typeof NAV_GROUP_KEYS[number]))
  // Grouped items in specified order
  const groupedItems = NAV_GROUP_KEYS
    .map(key => routerData.find(i => i.translationKey === key))
    .filter((i): i is (typeof routerData)[0] => i !== undefined)

  // Auto-expand if current route is in grouped items
  useEffect(() => {
    const isCurrentRouteInGroup = groupedItems.some(item => item.path === currentRoute)
    if (isCurrentRouteInGroup && !moreOpen) {
      setMoreOpen(true)
    }
  }, [currentRoute, groupedItems, moreOpen])

  return (
    <nav className="flex flex-col gap-1 p-4" data-testid="mobile-nav-list">
      {/* Main navigation items: Home, Publish */}
      {mainItems.map(item => (
        <MobileNavItem
          key={item.path || item.name}
          path={item.path || '/'}
          translationKey={item.translationKey}
          icon={item.icon}
          isActive={item.path === currentRoute}
          onClose={onClose}
        />
      ))}

      {/* 我的频道 */}
      <MobileMyChannelsButton onClose={onClose} onOpenMyChannels={onOpenMyChannels} />

      {/* "More" collapsible section */}
      {groupedItems.length > 0 && (
        <div className="mt-1">
          {/* More button */}
          <button
            onClick={() => setMoreOpen(s => !s)}
            data-testid="mobile-more-btn"
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all w-full',
              'text-muted-foreground hover:bg-muted hover:text-foreground',
              moreOpen && 'bg-muted text-foreground',
            )}
          >
            <span className="flex items-center justify-center">
              <MoreHorizontal size={20} />
            </span>
            <span className="flex-1 text-left">{t('sidebar.more')}</span>
            {moreOpen ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </button>

          {/* Expanded items */}
          {moreOpen && (
            <div className="mt-1 ml-2 flex flex-col gap-1" data-testid="mobile-more-group">
              {groupedItems.map(item => (
                <MobileNavItem
                  key={item.path || item.name}
                  path={item.path || '/'}
                  translationKey={item.translationKey}
                  icon={item.icon}
                  isActive={item.path === currentRoute}
                  onClose={onClose}
                />
              ))}

              {/* 前往官网 */}
              <Link
                href="/welcome"
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all',
                  'text-muted-foreground hover:bg-muted hover:text-foreground',
                  currentRoute === '/welcome' && 'bg-primary/10 text-primary',
                )}
              >
                <Globe size={20} className="text-muted-foreground" />
                <span>{t('common:goToWebsite')}</span>
              </Link>

            </div>
          )}
        </div>
      )}
    </nav>
  )
}
