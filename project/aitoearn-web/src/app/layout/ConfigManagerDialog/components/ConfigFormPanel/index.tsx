/**
 * ConfigFormPanel - 配置表单滚动区域
 * 每个分组作为锚点节点供左侧目录联动。
 */
'use client'

import type { ConfigFormPanelProps } from '../../types'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Badge } from '@/components/ui/badge'
import { joinPath } from '../../utils/configPath'
import { getConfigSectionValue } from '../../utils/configSections'
import { ConfigField } from '../ConfigField'

export function ConfigFormPanel({
  sections,
  config,
  originalConfig,
  disabled,
  scrollContainerRef,
  focusRequest,
  highlightedPathKey,
  initialScrollTop,
  onFocusRequestHandled,
  onValueChange,
  onNavigateToJson,
  onScrollTopChange,
}: ConfigFormPanelProps) {
  const { t } = useTransClient('configManager')
  const shouldRestoreInitialScrollRef = useRef(!focusRequest)
  const didRestoreInitialScrollRef = useRef(false)

  useLayoutEffect(() => {
    if (!shouldRestoreInitialScrollRef.current || didRestoreInitialScrollRef.current)
      return

    const container = scrollContainerRef.current
    if (!container)
      return

    container.scrollTop = initialScrollTop
    didRestoreInitialScrollRef.current = true
  }, [initialScrollTop, scrollContainerRef])

  useEffect(() => {
    if (!focusRequest)
      return

    let firstFrame = 0
    let secondFrame = 0
    const targetPathKey = joinPath(focusRequest.path)

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const container = scrollContainerRef.current
        if (!container)
          return

        const target = Array.from(container.querySelectorAll<HTMLElement>('[data-config-path-key]'))
          .find(element => element.dataset.configPathKey === targetPathKey)

        if (!target)
          return

        const containerRect = container.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()
        container.scrollTop = Math.max(0, targetRect.top - containerRect.top + container.scrollTop - 72)
        onFocusRequestHandled(focusRequest.id)
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [focusRequest, onFocusRequestHandled, scrollContainerRef])

  return (
    <div
      ref={(node) => {
        scrollContainerRef.current = node
      }}
      className="h-full overflow-y-auto bg-background"
      onScroll={(event) => {
        onScrollTopChange(event.currentTarget.scrollTop)
      }}
    >
      <div className="space-y-3 px-3 py-3 pb-6">
        {sections.map(section => (
          <section
            key={section.id}
            data-config-section-id={section.id}
            className="scroll-mt-3"
          >
            <div className="px-3 pb-2 pt-3">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="shrink-0 text-sm font-semibold text-foreground">{section.label}</h3>
                {section.notRecommended && (
                  <Badge variant="outline" className="h-5 shrink-0 border-warning/30 bg-warning/10 px-1.5 py-0 text-[10px] font-normal leading-none text-warning">
                    {t('status.notRecommended')}
                  </Badge>
                )}
                <div className="h-px min-w-0 flex-1 bg-border" aria-hidden />
              </div>
              {section.description && (
                <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
                  {section.description}
                </p>
              )}
            </div>
            <div className="mx-3 mb-3 overflow-hidden rounded-md border border-border bg-background divide-y divide-border/70">
              {section.paths.map((path) => {
                const value = getConfigSectionValue(config, path)
                const originalValue = originalConfig ? getConfigSectionValue(originalConfig, path) : undefined
                const fieldKey = String(path[path.length - 1] ?? section.id)
                return (
                  <ConfigField
                    key={path.join('.')}
                    path={path}
                    fieldKey={fieldKey}
                    value={value}
                    originalValue={originalValue}
                    disabled={disabled}
                    focusPath={focusRequest?.path ?? null}
                    highlightedPathKey={highlightedPathKey}
                    onValueChange={onValueChange}
                    onNavigateToJson={onNavigateToJson}
                  />
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
