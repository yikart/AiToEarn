/**
 * MobileNavList - 移动端导航列表
 * 路由导航可折叠/展开（持久化），功能项（GitHub/帮助文档）始终显示
 */
import type { MobileNavListProps } from '../types'
import type { IRouterDataItem } from '@/app/layout/routerData'
import { ChevronDown, ChevronUp, Code2, HelpCircle } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { DOCS_URL, GITHUB_REPO } from '@/app/layout/shared/constants'
import { useGitHubStars } from '@/app/layout/shared/hooks/useGitHubStars'
import { useVisibleRouterData } from '@/app/layout/shared/hooks/useVisibleRouterData'
import { cn } from '@/lib/utils'
import { useSystemStore } from '@/store/system'
import { MobileMyChannelsButton } from './MobileMyChannelsButton'
import { MobileNavItem } from './MobileNavItem'

function isRouteActive(item: IRouterDataItem, currentRoute: string): boolean {
  if (item.path === currentRoute) {
    return true
  }

  return item.children?.some(child => isRouteActive(child, currentRoute)) ?? false
}

export function MobileNavList({ currentRoute, onClose, onOpenMyChannels }: MobileNavListProps) {
  const { t } = useTransClient(['route', 'common'])
  const starCount = useGitHubStars()
  const visibleRoutes = useVisibleRouterData()

  const { mobileNavExpanded, setMobileNavExpanded } = useSystemStore(
    useShallow(state => ({
      mobileNavExpanded: state.mobileNavExpanded,
      setMobileNavExpanded: state.setMobileNavExpanded,
    })),
  )

  const funcItemClassName = cn(
    'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all w-full',
    'text-muted-foreground hover:bg-brand-cyan/10 hover:text-brand-cyan',
  )

  const renderRouteItem = (item: IRouterDataItem, level = 0): React.ReactNode => {
    const isActive = isRouteActive(item, currentRoute)

    return (
      <div key={item.path || item.translationKey} className="space-y-1">
        {item.path ? (
          <MobileNavItem
            path={item.path}
            translationKey={item.translationKey}
            icon={level === 0 ? item.icon : undefined}
            isActive={isActive}
            onClose={onClose}
            className={cn(level > 0 && 'ml-6 py-2.5 text-sm')}
          />
        ) : null}
        {item.children?.length ? (
          <div className={cn('space-y-1 border-l border-border/70 pl-2', level === 0 && 'ml-4')}>
            {item.children.map((child: IRouterDataItem) => renderRouteItem(child, level + 1))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <nav className="flex flex-col gap-1 p-4" data-testid="mobile-nav-list">
      {/* 导航折叠/展开按钮 */}
      <button
        onClick={() => setMobileNavExpanded(!mobileNavExpanded)}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all w-full cursor-pointer',
          'text-muted-foreground hover:bg-brand-cyan/10 hover:text-brand-cyan',
          mobileNavExpanded && 'bg-brand-cyan/10 text-brand-cyan',
        )}
        data-testid="mobile-nav-toggle"
      >
        <span className="flex-1 text-left">{t('route:navigation')}</span>
        {mobileNavExpanded ? (
          <ChevronUp size={18} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={18} className="text-muted-foreground" />
        )}
      </button>

      {/* 路由导航项 - 折叠/展开 */}
      {mobileNavExpanded && (
        <div className="flex flex-col gap-1" data-testid="mobile-nav-routes">
          {visibleRoutes.map((item: IRouterDataItem) => renderRouteItem(item))}

          {/* 我的频道 */}
          <MobileMyChannelsButton onClose={onClose} onOpenMyChannels={onOpenMyChannels} />
        </div>
      )}

      {/* 功能导航项 - 始终显示 */}
      <a
        href={`https://github.com/${GITHUB_REPO}`}
        target="_blank"
        rel="noopener noreferrer"
        className={funcItemClassName}
        data-testid="mobile-github-link"
      >
        <span className="flex items-center justify-center">
          <Code2 size={20} />
        </span>
        <span>GitHub</span>
        {starCount && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {starCount}
          </span>
        )}
      </a>

      <a
        href={DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={funcItemClassName}
        data-testid="mobile-docs-link"
      >
        <span className="flex items-center justify-center">
          <HelpCircle size={20} />
        </span>
        <span>{t('common:helpDocs')}</span>
      </a>
    </nav>
  )
}
