/**
 * PluginNotInstalled - 插件未安装状态组件
 * 显示下载引导和安装说明，移动端显示桌面端专用提示
 */

'use client'

import { BookOpen, Chrome, CloudDownload, Github, Monitor, Puzzle } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/useIsMobile'
import { PLUGIN_DOWNLOAD_LINKS } from '@/store/plugin/constants'

/**
 * 移动端提示组件 - 提示用户前往 PC 端使用插件
 */
function MobilePluginTip() {
  const { t } = useTranslation('plugin')

  return (
    <div className="flex flex-col items-center py-6 px-4">
      {/* 图标 */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Monitor className="h-8 w-8 text-primary" />
      </div>

      {/* 标题 */}
      <h3 className="mb-2 text-base font-semibold text-foreground">{t('mobile.title')}</h3>

      {/* 描述 */}
      <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
        {t('mobile.description')}
      </p>

      {/* 前往 PC 端提示 */}
      <div className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <Monitor className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm font-medium text-primary">{t('mobile.goToPC')}</span>
      </div>

      {/* 插件介绍卡片 */}
      <div className="w-full rounded-lg border border-border bg-muted/30 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Puzzle className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">{t('header.downloadPlugin')}</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t('mobile.introduction')}
        </p>
      </div>
    </div>
  )
}

/**
 * 插件未安装状态组件
 */
export function PluginNotInstalled() {
  const { t } = useTranslation('plugin')
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobilePluginTip />
  }

  return (
    <div className="flex flex-col items-center py-8 px-4">
      {/* 图标 */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Puzzle className="h-10 w-10 text-primary" />
      </div>

      {/* 标题 */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">{t('header.downloadPlugin')}</h3>

      {/* 描述 */}
      <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
        {t('header.downloadDescription')}
      </p>

      {/* 下载按钮 */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button className="w-full gap-2" asChild>
          <a href={PLUGIN_DOWNLOAD_LINKS.chrome} target="_blank" rel="noopener noreferrer">
            <Chrome className="h-4 w-4" />
            {t('header.chromeWebStore')}
          </a>
        </Button>

        <Button variant="outline" className="w-full gap-2" asChild>
          <a href={PLUGIN_DOWNLOAD_LINKS.github} target="_blank" rel="noopener noreferrer">
            <Github className="h-4 w-4" />
            {t('header.githubRelease')}
          </a>
        </Button>

        <Button variant="outline" className="w-full gap-2" asChild>
          <a href={PLUGIN_DOWNLOAD_LINKS.china} target="_blank" rel="noopener noreferrer">
            <CloudDownload className="h-4 w-4" />
            {t('header.chinaDownload')}
          </a>
        </Button>
      </div>

      {/* 查看安装教程链接 */}
      <Link
        href="/websit/plugin-guide"
        className="mt-6 flex items-center justify-center gap-2 w-full max-w-xs px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
      >
        <BookOpen className="h-5 w-5" />
        <span className="font-medium">{t('header.viewGuide')}</span>
      </Link>
    </div>
  )
}
