import type { MobileMyChannelsButtonProps } from '../types'
/**
 * MobileMyChannelsButton - 移动端我的频道按钮
 */
import { Tv } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'

export function MobileMyChannelsButton({
  onClose,
  onOpenMyChannels,
}: MobileMyChannelsButtonProps) {
  const { t } = useTransClient('account')

  return (
    <button
      onClick={() => {
        onClose()
        onOpenMyChannels()
      }}
      data-testid="mobile-my-channels"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all w-full',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span className="flex items-center justify-center text-primary">
        <Tv size={20} />
      </span>
      <span>{t('channelManager.myChannels')}</span>
    </button>
  )
}
