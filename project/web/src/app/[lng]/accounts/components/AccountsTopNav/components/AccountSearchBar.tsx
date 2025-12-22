import { Search } from 'lucide-react'
import { memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Input } from '@/components/ui/input'

interface AccountSearchBarProps {
  searchText: string
  onSearchChange: (text: string) => void
}

const AccountSearchBar = memo(({ searchText, onSearchChange }: AccountSearchBarProps) => {
  const { t } = useTransClient('account')

  return (
    <div className="p-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('listMode.searchChannels')}
          value={searchText}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  )
})

AccountSearchBar.displayName = 'AccountSearchBar'

export default AccountSearchBar

