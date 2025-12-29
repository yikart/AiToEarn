/**
 * PluginNotInstalled - 插件未安装状态组件
 * 显示下载引导和安装说明
 */

'use client'

import { BookOpen, Chrome, Github, Puzzle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { PLUGIN_DOWNLOAD_LINKS } from '@/store/plugin/constants'

/**
 * 插件未安装状态组件
 */
export function PluginNotInstalled() {
  const { t } = useTranslation('plugin')

  return (
    <div className="flex flex-col items-center py-8 px-4">
      {/* 图标 */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Puzzle className="h-10 w-10 text-primary" />
      </div>

      {/* 标题 */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {t('header.downloadPlugin')}
      </h3>

      {/* 描述 */}
      <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
        {t('header.downloadDescription')}
      </p>

      {/* 下载按钮 */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          className="w-full gap-2"
          asChild
        >
          <a
            href={PLUGIN_DOWNLOAD_LINKS.chrome}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Chrome className="h-4 w-4" />
            {t('header.chromeWebStore')}
          </a>
        </Button>

        <Button
          variant="outline"
          className="w-full gap-2"
          asChild
        >
          <a
            href={PLUGIN_DOWNLOAD_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
            {t('header.githubRelease')}
          </a>
        </Button>

        {/* <Button
          variant="ghost"
          className="w-full gap-2"
          asChild
        >
          <a
            href="/websit/plugin-guide"
            target="_blank"-
            rel="noopener noreferrer"
          >
            <BookOpen className="h-4 w-4" />
            {t('header.viewGuide')}
          </a>
        </Button> */}
      </div>
    </div>
  )
}
