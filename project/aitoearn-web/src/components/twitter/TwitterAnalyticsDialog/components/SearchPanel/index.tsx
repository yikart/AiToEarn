/**
 * SearchPanel - Twitter 推文搜索面板
 */
import { Search } from 'lucide-react'
import { useState } from 'react'
import { apiTwitterSearchTweets } from '@/api/plat/twitter'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TwitterTweetPanel from '../TwitterTweetPanel'

interface SearchPanelProps {
  accountId: string
  onTweetClick: (tweetId: string) => void
}

export default function SearchPanel({ accountId, onTweetClick }: SearchPanelProps) {
  const { t } = useTransClient('account')
  const [inputValue, setInputValue] = useState('')
  const [query, setQuery] = useState('')

  const handleSubmit = () => {
    setQuery(inputValue.trim())
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold text-foreground">{t('twitter.search')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('twitter.searchDesc')}</p>
        <div className="mt-4 flex gap-2">
          <Input
            value={inputValue}
            onChange={event => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter')
                handleSubmit()
            }}
            placeholder={t('twitter.searchPlaceholder')}
            className="h-9"
          />
          <Button type="button" onClick={handleSubmit} disabled={!inputValue.trim()}>
            <Search className="h-4 w-4" />
            {t('twitter.search')}
          </Button>
        </div>
      </div>

      {query ? (
        <TwitterTweetPanel
          title={t('twitter.searchResults')}
          description={query}
          accountId={accountId}
          loadPage={paginationToken => apiTwitterSearchTweets({ accountId, query, paginationToken })}
          reloadKey={query}
          onTweetClick={onTweetClick}
        />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {t('twitter.searchEmpty')}
        </div>
      )}
    </section>
  )
}
