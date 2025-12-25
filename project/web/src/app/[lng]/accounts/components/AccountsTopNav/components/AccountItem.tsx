import type { SocialAccount } from '@/api/types/account.type'
import Image from 'next/image'
import { memo } from 'react'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import AccountStatusView from './AccountStatusView'

interface AccountItemProps {
  account: SocialAccount
  isActive: boolean
  onSelect: (account: SocialAccount) => void
  indent?: boolean
}

const AccountItem = memo(({ account, isActive, onSelect, indent = false }: AccountItemProps) => {
  const { t } = useTransClient('account')
  const platInfo = AccountPlatInfoMap.get(account.type)

  return (
    <div
      onClick={() => onSelect(account)}
      className={cn(
        'flex items-center gap-3 px-3 py-2 mx-2 rounded-sm transition-colors group relative',
        indent && 'ml-8',
        isActive && 'bg-accent text-accent-foreground',
        'cursor-pointer hover:bg-muted/50',
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={getOssUrl(account.avatar)} alt={account.nickname} />
        <AvatarFallback>
          {account.nickname?.[0] || account.account?.[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {account.nickname || account.account}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {platInfo?.icon && (
            <Image
              src={platInfo.icon}
              alt={platInfo.name}
              width={16}
              height={16}
              className="rounded-sm shrink-0"
            />
          )}
          <span className="text-xs text-muted-foreground shrink-0">
            {platInfo?.name}
          </span>
          <AccountStatusView account={account} />
          {account.fansCount !== undefined && account.fansCount !== null && (
            <span className="text-xs text-muted-foreground shrink-0">
              {t('fansCount')}: {account.fansCount ?? 0}
            </span>
          )}
        </div>
      </div>

    </div>
  )
})

AccountItem.displayName = 'AccountItem'

export default AccountItem

