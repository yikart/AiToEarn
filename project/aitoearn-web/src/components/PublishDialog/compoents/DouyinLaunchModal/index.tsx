/**
 * DouyinLaunchModal - 移动端抖音唤起引导弹窗
 * 引导用户点击按钮打开抖音 App 完成发布
 * 使用多策略唤起（iframe + location.href + 超时降级）
 */
'use client'

import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { openApp } from '@/utils/appLaunch'

type LaunchState = 'idle' | 'launching' | 'failed'

interface DouyinLaunchModalProps {
  open: boolean
  permalink: string
  onClose: () => void
}

export function DouyinLaunchModal({ open, permalink, onClose }: DouyinLaunchModalProps) {
  const { t } = useTransClient('publish')
  const douyinConfig = AccountPlatInfoMap.get(PlatType.Douyin)
  const [launchState, setLaunchState] = useState<LaunchState>('idle')

  const handleLaunch = useCallback(() => {
    setLaunchState('launching')
    openApp(permalink, () => setLaunchState('failed'))
  }, [permalink])

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setLaunchState('idle')
      onClose()
    }
  }, [onClose])

  const isLaunching = launchState === 'launching'
  const isFailed = launchState === 'failed'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[90vw] max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t('douyin.mobileLaunchTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-4">
          {douyinConfig?.icon && (
            <Image
              src={douyinConfig.icon}
              alt="Douyin"
              width={64}
              height={64}
              className="rounded-xl"
            />
          )}

          <p className="text-sm text-muted-foreground text-center px-2">
            {isFailed ? t('douyin.launchFailed') : t('douyin.mobileLaunchDesc')}
          </p>

          <Button
            className="w-full cursor-pointer"
            size="lg"
            disabled={isLaunching}
            onClick={isFailed ? handleLaunch : handleLaunch}
          >
            {isLaunching && <Loader2 className="animate-spin" />}
            {isFailed ? t('douyin.retryOpen') : t('douyin.openApp')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
