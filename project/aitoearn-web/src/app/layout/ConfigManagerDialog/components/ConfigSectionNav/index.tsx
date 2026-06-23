/**
 * ConfigSectionNav - 配置分组目录
 * 支持当前滚动分组高亮与点击锚点滚动。
 */
'use client'

import type { ConfigSectionView } from '../../types'
import { useEffect, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/utils/className'

interface ConfigSectionNavProps {
  sections: ConfigSectionView[]
  activeSectionId: string
  disabled?: boolean
  onSectionClick: (sectionId: string) => void
}

export function ConfigSectionNav({ sections, activeSectionId, disabled, onSectionClick }: ConfigSectionNavProps) {
  const { t } = useTransClient('configManager')
  const navRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const nav = navRef.current
    if (!nav || !activeSectionId)
      return

    const activeItem = Array.from(nav.querySelectorAll<HTMLElement>('[data-config-section-nav-id]'))
      .find(item => item.dataset.configSectionNavId === activeSectionId)

    if (!activeItem)
      return

    nav.scrollTo({
      top: Math.max(0, activeItem.offsetTop - nav.clientHeight / 2 + activeItem.clientHeight / 2),
      behavior: 'smooth',
    })
  }, [activeSectionId, sections])

  return (
    <nav ref={navRef} className="flex h-full flex-col gap-1 overflow-y-auto p-3 pb-[45%]" aria-label="Configuration sections">
      {sections.map((section) => {
        const active = section.id === activeSectionId
        return (
          <button
            key={section.id}
            type="button"
            data-config-section-nav-id={section.id}
            aria-current={active ? 'true' : undefined}
            disabled={disabled}
            onClick={() => onSectionClick(section.id)}
            className={cn(
              'group relative flex cursor-pointer flex-col rounded-lg px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              active
                ? 'bg-brand-cyan/10 text-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {active && <span className="absolute left-0 top-2 h-[calc(100%-16px)] w-0.5 rounded-full bg-gradient-back" />}
            <span className="flex items-center justify-between gap-3 text-sm font-medium">
              <span>{section.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                {section.notRecommended && (
                  <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning ring-1 ring-warning/30">
                    {t('status.notRecommended')}
                  </span>
                )}
                {section.modifiedFieldCount > 0 && (
                  <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning ring-1 ring-warning/30">
                    {section.modifiedFieldCount}
                  </span>
                )}
                <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground ring-1 ring-border">
                  {section.fieldCount}
                </span>
              </span>
            </span>
            {section.description && (
              <span className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
                {section.description}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
