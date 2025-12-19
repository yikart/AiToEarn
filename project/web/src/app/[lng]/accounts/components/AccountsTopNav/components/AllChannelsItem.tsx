import { Layers } from 'lucide-react'
import { memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface AllChannelsItemProps {
  isActive: boolean
  onClick: () => void
}

const AllChannelsItem = memo(({ isActive, onClick }: AllChannelsItemProps) => {
  const { t } = useTransClient('account')

  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-3 cursor-pointer mx-2',
        isActive && 'bg-accent text-accent-foreground',
      )}
    >
      <Layers className="h-8 w-8 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <div className="text-sm font-medium">
          {t('allChannels')}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {t('viewAllChannels')}
        </div>
      </div>
    </DropdownMenuItem>
  )
})

AllChannelsItem.displayName = 'AllChannelsItem'

export default AllChannelsItem

