/**
 * ConfigFormPanel - 配置表单滚动区域
 * 每个分组作为锚点节点供左侧目录联动。
 */
'use client'

import type { ConfigFormPanelProps } from '../../types'
import { getValueAtPath } from '../../utils/configPath'
import { ConfigField } from '../ConfigField'

export function ConfigFormPanel({
  sections,
  config,
  disabled,
  scrollContainerRef,
  onValueChange,
}: ConfigFormPanelProps) {
  return (
    <div
      ref={(node) => {
        scrollContainerRef.current = node
      }}
      className="h-full overflow-y-auto scroll-smooth bg-background px-3 py-3"
    >
      <div className="flex flex-col gap-3 pb-6">
        {sections.map(section => (
          <section
            key={section.id}
            data-config-section-id={section.id}
            className="scroll-mt-3 border-b border-border/70 pb-3 last:border-b-0"
          >
            <div className="px-1 pb-2 pt-1">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">{section.label}</h3>
                {section.description && <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>}
              </div>
            </div>

            <div className="space-y-2">
              {section.paths.map((path) => {
                const value = getValueAtPath(config, path)
                const fieldKey = String(path[path.length - 1] ?? section.id)
                return (
                  <ConfigField
                    key={path.join('.')}
                    path={path}
                    fieldKey={fieldKey}
                    value={value}
                    disabled={disabled}
                    onValueChange={onValueChange}
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
