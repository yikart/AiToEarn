/**
 * UserLookupPanel - Twitter 用户查询与用户维度资源
 */
import type { TwitterUser } from '@/api/types/twitter'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  apiTwitterUserByUsername,
  apiTwitterUserPostsForUser,
  apiTwitterUsersFollowers,
  apiTwitterUsersFollowing,
  apiTwitterUsersLikedPosts,
} from '@/api/plat/twitter'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import TwitterTweetPanel from '../TwitterTweetPanel'
import TwitterUserPanel, { UserRow } from '../TwitterUserPanel'

interface UserLookupPanelProps {
  accountId: string
  onTweetClick: (tweetId: string) => void
}

type UserLookupTab = 'posts' | 'followers' | 'following' | 'likedPosts'

export default function UserLookupPanel({ accountId, onTweetClick }: UserLookupPanelProps) {
  const { t } = useTransClient('account')
  const [inputValue, setInputValue] = useState('')
  const [user, setUser] = useState<TwitterUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<UserLookupTab>('posts')

  const tabs = useMemo(() => [
    { value: 'posts' as UserLookupTab, label: t('twitter.tweets') },
    { value: 'followers' as UserLookupTab, label: t('twitter.followers') },
    { value: 'following' as UserLookupTab, label: t('twitter.following') },
    { value: 'likedPosts' as UserLookupTab, label: t('twitter.likedPosts') },
  ], [t])

  const handleSearch = async () => {
    const username = inputValue.trim()
    if (!username || loading)
      return
    setLoading(true)
    const res = await apiTwitterUserByUsername({ accountId, username })
    if (res?.code === 0 && res.data?.data) {
      setUser(res.data.data)
      setActiveTab('posts')
    }
    else {
      setUser(null)
      toast.error(res?.message || t('twitter.userNotFound'))
    }
    setLoading(false)
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold text-foreground">{t('twitter.userLookup')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('twitter.userLookupDesc')}</p>
        <div className="mt-4 flex gap-2">
          <Input
            value={inputValue}
            onChange={event => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter')
                handleSearch()
            }}
            placeholder={t('twitter.usernamePlaceholder')}
            className="h-9"
          />
          <Button type="button" onClick={handleSearch} disabled={!inputValue.trim() || loading} loading={loading}>
            <Search className="h-4 w-4" />
            {t('twitter.lookupUser')}
          </Button>
        </div>
      </div>

      {user ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <UserRow user={user} className="border-b border-border bg-muted/20" />
          <div className="border-b border-border px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    activeTab === tab.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {activeTab === 'posts' && (
              <TwitterTweetPanel
                title={t('twitter.tweets')}
                accountId={accountId}
                loadPage={paginationToken => apiTwitterUserPostsForUser({ accountId, userId: user.id, paginationToken })}
                reloadKey={`${user.id}:posts`}
                onTweetClick={onTweetClick}
              />
            )}
            {activeTab === 'likedPosts' && (
              <TwitterTweetPanel
                title={t('twitter.likedPosts')}
                accountId={accountId}
                loadPage={paginationToken => apiTwitterUsersLikedPosts({ accountId, userId: user.id, paginationToken })}
                reloadKey={`${user.id}:likedPosts`}
                onTweetClick={onTweetClick}
                initialLiked
              />
            )}
            {activeTab === 'followers' && (
              <TwitterUserPanel
                title={t('twitter.followers')}
                loadPage={paginationToken => apiTwitterUsersFollowers({ accountId, userId: user.id, paginationToken })}
                reloadKey={`${user.id}:followers`}
              />
            )}
            {activeTab === 'following' && (
              <TwitterUserPanel
                title={t('twitter.following')}
                loadPage={paginationToken => apiTwitterUsersFollowing({ accountId, userId: user.id, paginationToken })}
                reloadKey={`${user.id}:following`}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {t('twitter.userLookupEmpty')}
        </div>
      )}
    </section>
  )
}
