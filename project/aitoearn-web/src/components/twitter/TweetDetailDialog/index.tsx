/**
 * TweetDetailDialog - 推文详情弹窗
 * 展示推文详情、上下文列表、互动与回复/引用入口。
 */
import type { TwitterMediaItem, TwitterTweet, TwitterUser } from '@/api/types/twitter'
import { EyeOff, Loader2, MessageSquare, Quote, Send } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  apiTwitterQuote,
  apiTwitterReply,
  apiTwitterReplyHide,
  apiTwitterReplyUnhide,
  apiTwitterTweetConversation,
  apiTwitterTweetDetail,
  apiTwitterTweetLikingUsers,
  apiTwitterTweetQuotes,
  apiTwitterTweetRepostedBy,
  apiTwitterTweetReposts,
} from '@/api/plat/twitter'
import { useTransClient } from '@/app/i18n/client'
import TweetCard, { findTweetMedia, findTweetUser } from '@/components/twitter/TweetCard'
import TweetMetrics from '@/components/twitter/TweetMetrics'
import TwitterTweetPanel from '@/components/twitter/TwitterAnalyticsDialog/components/TwitterTweetPanel'
import TwitterUserPanel from '@/components/twitter/TwitterAnalyticsDialog/components/TwitterUserPanel'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

interface TweetDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  tweetId: string
}

type DetailTab = 'conversation' | 'quotes' | 'reposts' | 'repostedBy' | 'likingUsers'
type ComposeMode = 'reply' | 'quote'

const TweetDetailDialog = memo(({ open, onOpenChange, accountId, tweetId }: TweetDetailDialogProps) => {
  const { t } = useTransClient('account')
  const [activeTweetId, setActiveTweetId] = useState(tweetId)
  const [loading, setLoading] = useState(false)
  const [tweet, setTweet] = useState<TwitterTweet | null>(null)
  const [users, setUsers] = useState<TwitterUser[]>([])
  const [media, setMedia] = useState<TwitterMediaItem[]>([])
  const [activeTab, setActiveTab] = useState<DetailTab>('conversation')
  const [composeMode, setComposeMode] = useState<ComposeMode>('reply')
  const [composeText, setComposeText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyVisibilityLoading, setReplyVisibilityLoading] = useState<'hide' | 'unhide' | null>(null)

  useEffect(() => {
    if (open) {
      setActiveTweetId(tweetId)
    }
  }, [open, tweetId])

  useEffect(() => {
    if (!open || !accountId || !activeTweetId)
      return

    let cancelled = false

    async function fetchDetail() {
      setLoading(true)
      const res = await apiTwitterTweetDetail({ accountId, tweetId: activeTweetId })
      if (cancelled)
        return

      if (res?.code === 0 && res.data) {
        setTweet(res.data.data)
        setUsers(res.data.includes?.users ?? [])
        setMedia(res.data.includes?.media ?? [])
      }
      else {
        setTweet(null)
        toast.error(res?.message || t('twitter.tweetNotFound'))
      }
      setLoading(false)
    }

    fetchDetail()

    return () => {
      cancelled = true
    }
  }, [activeTweetId, accountId, open, t])

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setTweet(null)
      setUsers([])
      setMedia([])
      setComposeText('')
      setComposeMode('reply')
      setActiveTab('conversation')
    }
    onOpenChange(isOpen)
  }, [onOpenChange])

  const handleSubmitCompose = useCallback(async () => {
    const text = composeText.trim()
    if (!text || submitting)
      return

    setSubmitting(true)
    const res = composeMode === 'reply'
      ? await apiTwitterReply({ accountId, tweetId: activeTweetId, text })
      : await apiTwitterQuote({ accountId, tweetId: activeTweetId, text })

    if (res?.code === 0) {
      toast.success(composeMode === 'reply' ? t('twitter.replySent') : t('twitter.quoteSent'))
      setComposeText('')
      setActiveTab(composeMode === 'reply' ? 'conversation' : 'quotes')
    }
    else {
      toast.error(res?.message || t('twitter.failed'))
    }
    setSubmitting(false)
  }, [accountId, activeTweetId, composeMode, composeText, submitting, t])

  const handleReplyVisibility = useCallback(async (next: 'hide' | 'unhide') => {
    if (replyVisibilityLoading)
      return

    setReplyVisibilityLoading(next)
    const res = next === 'hide'
      ? await apiTwitterReplyHide({ accountId, tweetId: activeTweetId })
      : await apiTwitterReplyUnhide({ accountId, tweetId: activeTweetId })

    if (res?.code === 0) {
      toast.success(next === 'hide' ? t('twitter.replyHidden') : t('twitter.replyVisible'))
    }
    else {
      toast.error(res?.message || t('twitter.failed'))
    }
    setReplyVisibilityLoading(null)
  }, [accountId, activeTweetId, replyVisibilityLoading, t])

  const tweetUser = tweet ? findTweetUser(tweet, users) : undefined
  const tweetMedia = tweet ? findTweetMedia(tweet, media) : []

  const tabItems = useMemo(() => [
    { value: 'conversation' as DetailTab, label: t('twitter.conversation') },
    { value: 'quotes' as DetailTab, label: t('twitter.quotes') },
    { value: 'reposts' as DetailTab, label: t('twitter.reposts') },
    { value: 'repostedBy' as DetailTab, label: t('twitter.repostedBy') },
    { value: 'likingUsers' as DetailTab, label: t('twitter.likingUsers') },
  ], [t])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex h-[88vh] max-w-5xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="text-base">{t('twitter.tweetDetail')}</DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
          <div className="min-h-0 overflow-y-auto border-b border-border lg:border-b-0 lg:border-r">
            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tweet ? (
              <>
                <TweetCard
                  tweet={tweet}
                  user={tweetUser}
                  media={tweetMedia}
                  accountId={accountId}
                  className="hover:bg-background"
                />

                <div className="space-y-4 border-b border-border px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={composeMode === 'reply' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setComposeMode('reply')}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t('twitter.reply')}
                    </Button>
                    <Button
                      type="button"
                      variant={composeMode === 'quote' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setComposeMode('quote')}
                    >
                      <Quote className="h-4 w-4" />
                      {t('twitter.quote')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!!replyVisibilityLoading}
                      onClick={() => handleReplyVisibility('hide')}
                    >
                      {replyVisibilityLoading === 'hide' ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
                      {t('twitter.hideReply')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!!replyVisibilityLoading}
                      onClick={() => handleReplyVisibility('unhide')}
                    >
                      {replyVisibilityLoading === 'unhide' ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
                      {t('twitter.unhideReply')}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      value={composeText}
                      onChange={event => setComposeText(event.target.value)}
                      maxLength={280}
                      placeholder={composeMode === 'reply' ? t('twitter.replyPlaceholder') : t('twitter.quotePlaceholder')}
                      className="min-h-24 resize-none"
                      disabled={submitting}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        {composeText.length}
                        /280
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSubmitCompose}
                        disabled={!composeText.trim() || submitting}
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {composeMode === 'reply' ? t('twitter.reply') : t('twitter.quote')}
                      </Button>
                    </div>
                  </div>
                </div>

                {tweet.publicMetrics && (
                  <div className="px-5 py-4">
                    <h3 className="mb-3 text-sm font-medium text-foreground">{t('twitter.metrics')}</h3>
                    <TweetMetrics tweet={{ ...tweet, publicMetrics: tweet.publicMetrics }} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-[360px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                {t('twitter.tweetNotFound')}
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="shrink-0 border-b border-border px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {tabItems.map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setActiveTab(item.value)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm transition-colors',
                      activeTab === item.value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1">
              {activeTab === 'conversation' && (
                <TwitterTweetPanel
                  title={t('twitter.conversation')}
                  accountId={accountId}
                  loadPage={paginationToken => apiTwitterTweetConversation({ accountId, tweetId: activeTweetId, paginationToken })}
                  reloadKey={activeTweetId}
                  onTweetClick={setActiveTweetId}
                />
              )}
              {activeTab === 'quotes' && (
                <TwitterTweetPanel
                  title={t('twitter.quotes')}
                  accountId={accountId}
                  loadPage={paginationToken => apiTwitterTweetQuotes({ accountId, tweetId: activeTweetId, paginationToken })}
                  reloadKey={activeTweetId}
                  onTweetClick={setActiveTweetId}
                />
              )}
              {activeTab === 'reposts' && (
                <TwitterTweetPanel
                  title={t('twitter.reposts')}
                  accountId={accountId}
                  loadPage={paginationToken => apiTwitterTweetReposts({ accountId, tweetId: activeTweetId, paginationToken })}
                  reloadKey={activeTweetId}
                  onTweetClick={setActiveTweetId}
                  initialRetweeted
                />
              )}
              {activeTab === 'repostedBy' && (
                <TwitterUserPanel
                  title={t('twitter.repostedBy')}
                  loadPage={paginationToken => apiTwitterTweetRepostedBy({ accountId, tweetId: activeTweetId, paginationToken })}
                  reloadKey={activeTweetId}
                />
              )}
              {activeTab === 'likingUsers' && (
                <TwitterUserPanel
                  title={t('twitter.likingUsers')}
                  loadPage={paginationToken => apiTwitterTweetLikingUsers({ accountId, tweetId: activeTweetId, paginationToken })}
                  reloadKey={activeTweetId}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

TweetDetailDialog.displayName = 'TweetDetailDialog'

export default TweetDetailDialog
