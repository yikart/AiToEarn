/**
 * TweetPreviewBar - 推文链接预览条
 * 用户粘贴推文链接后自动预览推文内容
 */
import type { TwitterMediaItem, TwitterTweet, TwitterUser } from '@/api/types/twitter'
import { Loader2, X } from 'lucide-react'
import { memo, useEffect, useRef, useState } from 'react'
import { apiTwitterResolveTweet, apiTwitterTweetDetail } from '@/api/plat/twitter'
import { useTransClient } from '@/app/i18n/client'
import TweetCard, { findTweetMedia, findTweetUser } from '@/components/twitter/TweetCard'
import { Button } from '@/components/ui/button'

interface TweetPreviewBarProps {
  accountId: string
  url: string
  onClear: () => void
}

const TWITTER_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/\w+\/status\/(\d+)/

function extractTweetId(url: string): string | null {
  const match = url.match(TWITTER_URL_REGEX)
  return match?.[1] ?? null
}

const TweetPreviewBar = memo(({ accountId, url, onClear }: TweetPreviewBarProps) => {
  const { t } = useTransClient('account')
  const [loading, setLoading] = useState(false)
  const [tweet, setTweet] = useState<TwitterTweet | null>(null)
  const [user, setUser] = useState<TwitterUser | undefined>()
  const [media, setMedia] = useState<TwitterMediaItem[]>([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!accountId || !url)
      return

    const fetchTweet = async () => {
      setLoading(true)
      try {
        // First try to resolve the URL
        let tweetId = extractTweetId(url)

        if (!tweetId) {
          const resolveRes = await apiTwitterResolveTweet({ accountId, tweetRef: url })
          if (resolveRes?.code === 0 && resolveRes.data) {
            tweetId = resolveRes.data.tweetId
          }
        }

        if (!tweetId) {
          if (mountedRef.current)
            setLoading(false)
          return
        }

        const detailRes = await apiTwitterTweetDetail({ accountId, tweetId })
        if (mountedRef.current && detailRes?.code === 0 && detailRes.data) {
          setTweet(detailRes.data.data)
          setUser(findTweetUser(detailRes.data.data, detailRes.data.includes?.users))
          setMedia(findTweetMedia(detailRes.data.data, detailRes.data.includes?.media))
        }
      }
      catch {
        // ignore
      }
      if (mountedRef.current)
        setLoading(false)
    }

    fetchTweet()
  }, [accountId, url])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 border border-border rounded-lg bg-muted/30">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t('twitter.loadingTweet')}</span>
      </div>
    )
  }

  if (!tweet)
    return null

  return (
    <div className="relative border border-border rounded-lg overflow-hidden bg-background">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="absolute top-2 right-2 h-6 w-6 p-0 z-10 cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
      <TweetCard tweet={tweet} user={user} media={media} compact />
    </div>
  )
})

TweetPreviewBar.displayName = 'TweetPreviewBar'

export default TweetPreviewBar
