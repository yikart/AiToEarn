/**
 * TweetLookupPanel - 推文链接/ID 查询入口
 */
import { ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'
import { apiTwitterResolveTweet } from '@/api/plat/twitter'
import { useTransClient } from '@/app/i18n/client'
import TweetDetailDialog from '@/components/twitter/TweetDetailDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

interface TweetLookupPanelProps {
  accountId: string
}

export default function TweetLookupPanel({ accountId }: TweetLookupPanelProps) {
  const { t } = useTransClient('account')
  const [inputValue, setInputValue] = useState('')
  const [tweetId, setTweetId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResolve = async () => {
    const tweetRef = inputValue.trim()
    if (!tweetRef || loading)
      return
    setLoading(true)
    const res = await apiTwitterResolveTweet({ accountId, tweetRef })
    if (res?.code === 0 && res.data?.tweetId) {
      setTweetId(res.data.tweetId)
    }
    else {
      toast.error(res?.message || t('twitter.tweetNotFound'))
    }
    setLoading(false)
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold text-foreground">{t('twitter.tweetLookup')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('twitter.tweetLookupDesc')}</p>
        <div className="mt-4 flex gap-2">
          <Input
            value={inputValue}
            onChange={event => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter')
                handleResolve()
            }}
            placeholder={t('twitter.tweetLookupPlaceholder')}
            className="h-9"
          />
          <Button type="button" onClick={handleResolve} disabled={!inputValue.trim() || loading} loading={loading}>
            <Search className="h-4 w-4" />
            {t('twitter.openTweet')}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center text-sm text-muted-foreground">
        <ExternalLink className="h-8 w-8 text-muted-foreground" />
        <p>{t('twitter.tweetLookupEmpty')}</p>
      </div>

      {tweetId && (
        <TweetDetailDialog
          open
          onOpenChange={(open) => {
            if (!open)
              setTweetId('')
          }}
          accountId={accountId}
          tweetId={tweetId}
        />
      )}
    </section>
  )
}
