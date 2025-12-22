import type { SocialAccount } from '@/api/types/account.type'
import { DeleteOutlined, EllipsisOutlined, LoadingOutlined } from '@ant-design/icons'
import Image from 'next/image'
import { memo, useState } from 'react'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import AccountStatusView from './AccountStatusView'

interface AccountItemProps {
  account: SocialAccount
  isActive: boolean
  onSelect: (account: SocialAccount) => void
  onDelete: (account: SocialAccount) => void
  deleteLoading?: string | null
  indent?: boolean
}

const AccountItem = memo(({ account, isActive, onSelect, onDelete, deleteLoading, indent = false }: AccountItemProps) => {
  const { t } = useTransClient('account')
  const platInfo = AccountPlatInfoMap.get(account.type)
  const [operationMenuOpen, setOperationMenuOpen] = useState(false)
  const isDeleting = deleteLoading === account.id

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOperationMenuOpen(false)
    onDelete(account)
  }

  return (
    <div
      onClick={() => !isDeleting && onSelect(account)}
      className={cn(
        'flex items-center gap-3 px-3 py-2 mx-2 rounded-sm transition-colors group relative',
        indent && 'ml-8',
        isActive && 'bg-accent text-accent-foreground',
        isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50',
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

      {isDeleting ? (
        <div className="p-1">
          <LoadingOutlined className="h-4 w-4 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <DropdownMenu open={operationMenuOpen} onOpenChange={setOperationMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOperationMenuOpen(true)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded cursor-pointer"
            >
              <EllipsisOutlined className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <DeleteOutlined className="mr-2" />
              {t('deleteAccount')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
})

AccountItem.displayName = 'AccountItem'

export default AccountItem

