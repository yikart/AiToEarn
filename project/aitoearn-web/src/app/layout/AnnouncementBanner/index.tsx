/**
 * AnnouncementBanner - 全局公告横幅组件
 * 在主内容区顶部显示促销信息，点击跳转草稿箱，用户关闭后永久不再显示（持久化到 IndexedDB）
 */
'use client'

import { ChevronRight, Megaphone, X } from 'lucide-react'
import Link from 'next/link'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { useSystemStore } from '@/store/system'
import { appCurrencySymbol } from '@/utils/currency'

function AnnouncementBanner() {
  const { t } = useTransClient('common')

  const { dismissSeedanceBanner, setDismissSeedanceBanner, _hasHydrated } = useSystemStore(
    useShallow(state => ({
      dismissSeedanceBanner: state.dismissSeedanceBanner,
      setDismissSeedanceBanner: state.setDismissSeedanceBanner,
      _hasHydrated: state._hasHydrated,
    })),
  )

  // 等待 hydration 完成避免闪烁，或已关闭则不渲染
  if (!_hasHydrated || dismissSeedanceBanner) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground text-sm w-full max-w-full overflow-hidden">
      <Link href="/draft-box" className="flex items-center gap-2 min-w-0 flex-1 hover:text-foreground transition-colors">
        <Megaphone className="w-4 h-4 shrink-0" />
        <span className="truncate">{t('announcementBanner.videoPromo', { price: `${appCurrencySymbol}0.003` })}</span>
        <ChevronRight className="w-4 h-4 shrink-0" />
      </Link>
      <button
        className="shrink-0 p-1 rounded-full hover:bg-foreground/10 transition-colors cursor-pointer"
        onClick={() => setDismissSeedanceBanner(true)}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default AnnouncementBanner
