/**
 * PluginUpdatePopover - 插件更新提示气泡
 * 用于在 hover trigger 时展示插件更新信息、下载入口和教程链接
 */

'use client'

import type * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import { BookOpen, CloudDownload, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { PluginVersionLast } from '@/constant'
import { isChineseLanguage } from '@/lib/i18n/languageConfig'
import { PLUGIN_DOWNLOAD_LINKS } from '@/store/plugin/constants'

interface PluginUpdatePopoverProps {
  /** 当前插件版本 */
  currentVersion: string
  /** 触发器 */
  children: React.ReactElement
  /** 气泡对齐方式 */
  align?: HoverCardPrimitive.HoverCardContentProps['align']
  /** 气泡方向 */
  side?: HoverCardPrimitive.HoverCardContentProps['side']
  /** 气泡偏移 */
  sideOffset?: number
}

export function PluginUpdatePopover({
  currentVersion,
  children,
  align = 'end',
  side = 'top',
  sideOffset = 8,
}: PluginUpdatePopoverProps) {
  const { t, i18n } = useTranslation('plugin')
  const updateLink = isChineseLanguage(i18n.resolvedLanguage || i18n.language)
    ? PLUGIN_DOWNLOAD_LINKS.china
    : PLUGIN_DOWNLOAD_LINKS.github

  return (
    <HoverCard openDelay={120} closeDelay={120}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="w-[320px] rounded-xl border border-border p-3"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t('version.popoverTitle', { version: PluginVersionLast })}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t('version.current')}
              {' '}
              v
              {currentVersion}
              <span className="mx-1.5">·</span>
              {t('version.latest')}
              {' '}
              v
              {PluginVersionLast}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" asChild>
              <a
                href={updateLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CloudDownload className="h-3.5 w-3.5" />
                {t('version.updateButton')}
              </a>
            </Button>

            <Link
              href="/websit/plugin-update-docs"
              className="inline-flex h-8 items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              {t('version.viewUpdateGuide')}
            </Link>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/10 px-2.5 py-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-[11px] leading-4 text-muted-foreground">
              {t('version.googleStoreNotice')}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
