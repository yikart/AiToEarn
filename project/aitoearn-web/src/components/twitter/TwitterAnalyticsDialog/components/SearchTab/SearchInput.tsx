/**
 * SearchInput - 搜索输入组件
 */
import { Search, User } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  defaultValue?: string
  onSearch: (query: string) => void
  onUserLookup: (username: string) => void
}

export default function SearchInput({ defaultValue, onSearch, onUserLookup }: SearchInputProps) {
  const { t } = useTransClient('account')
  const [query, setQuery] = useState(defaultValue ?? '')

  const handleSearch = useCallback(() => {
    if (query.trim())
      onSearch(query.trim())
  }, [query, onSearch])

  const handleUserLookup = useCallback(() => {
    if (query.trim())
      onUserLookup(query.trim())
  }, [query, onUserLookup])

  return (
    <div className="flex gap-2 p-4 border-b border-border">
      <Input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter')
            handleSearch()
        }}
        placeholder={t('twitter.searchPlaceholder')}
        className="flex-1"
      />
      <Button variant="outline" size="sm" onClick={handleSearch} className="cursor-pointer">
        <Search className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={handleUserLookup} title={t('twitter.lookupUser')} className="cursor-pointer">
        <User className="h-4 w-4" />
      </Button>
    </div>
  )
}
