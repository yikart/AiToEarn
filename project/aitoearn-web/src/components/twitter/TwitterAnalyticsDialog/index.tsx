/**
 * TwitterExploreDialog - Twitter 控制台
 * 统一承载 Twitter 浏览、查询、列表、隐私与推文详情能力。
 */
import type { LucideIcon } from 'lucide-react'
import type { TwitterPanelId } from './types'
import {
  AlertTriangle,
  AtSign,
  Ban,
  Bookmark,
  Compass,
  Heart,
  Home,
  List,
  Lock,
  MessageSquare,
  PenLine,
  Search,
  Shield,
  UserCheck,
  UserRoundSearch,
  Users,
} from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  apiTwitterBookmarks,
  apiTwitterHomeTimeline,
  apiTwitterMyBlocks,
  apiTwitterMyFollowedLists,
  apiTwitterMyFollowers,
  apiTwitterMyFollowing,
  apiTwitterMyLikedPosts,
  apiTwitterMyListMemberships,
  apiTwitterMyMutes,
  apiTwitterMyOwnedLists,
  apiTwitterMyPinnedLists,
  apiTwitterMyPosts,
  apiTwitterUserMentions,
} from '@/api/plat/twitter'
import { directTrans, useTransClient } from '@/app/i18n/client'
import TweetDetailDialog from '@/components/twitter/TweetDetailDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useSystemStore } from '@/store/system'
import CreditsPreviewTable from './components/CreditsPreviewTable'
import SearchPanel from './components/SearchPanel'
import TweetLookupPanel from './components/TweetLookupPanel'
import ListPanel from './components/TwitterListPanel'
import TweetPanel from './components/TwitterTweetPanel'
import UserPanel from './components/TwitterUserPanel'
import UserLookupPanel from './components/UserLookupPanel'

export interface TwitterExploreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  username?: string
}

interface NavItem {
  id: TwitterPanelId
  label: string
  icon: LucideIcon
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const TwitterExploreDialog = memo(({ open, onOpenChange, accountId, username }: TwitterExploreDialogProps) => {
  const { t } = useTransClient('account')
  const [activePanel, setActivePanel] = useState<TwitterPanelId>('home')
  const [confirmed, setConfirmed] = useState(false)
  const [dontShow, setDontShow] = useState(false)
  const [detailTweetId, setDetailTweetId] = useState('')

  const { skipTwitterExploreConfirm, setSkipTwitterExploreConfirm } = useSystemStore(
    useShallow(state => ({
      skipTwitterExploreConfirm: state.skipTwitterExploreConfirm,
      setSkipTwitterExploreConfirm: state.setSkipTwitterExploreConfirm,
    })),
  )

  useEffect(() => {
    if (open) {
      setActivePanel('home')
      setConfirmed(false)
      setDontShow(false)
      setDetailTweetId('')
    }
  }, [open, accountId])

  const navGroups = useMemo<NavGroup[]>(() => [
    {
      title: t('twitter.navFeed'),
      items: [
        { id: 'home', label: t('twitter.timeline'), icon: Home },
        { id: 'search', label: t('twitter.search'), icon: Search },
        { id: 'tweetLookup', label: t('twitter.tweetLookup'), icon: MessageSquare },
      ],
    },
    {
      title: t('twitter.navMyAccount'),
      items: [
        { id: 'myTweets', label: t('twitter.myTweets'), icon: PenLine },
        { id: 'mentions', label: t('twitter.mentions'), icon: AtSign },
        { id: 'bookmarks', label: t('twitter.bookmarks'), icon: Bookmark },
        { id: 'likedPosts', label: t('twitter.likedPosts'), icon: Heart },
        { id: 'followers', label: t('twitter.followers'), icon: Users },
        { id: 'following', label: t('twitter.following'), icon: UserCheck },
      ],
    },
    {
      title: t('twitter.navDiscovery'),
      items: [
        { id: 'userLookup', label: t('twitter.userLookup'), icon: UserRoundSearch },
      ],
    },
    {
      title: t('twitter.navLists'),
      items: [
        { id: 'ownedLists', label: t('twitter.ownedLists'), icon: List },
        { id: 'followedLists', label: t('twitter.followedLists'), icon: List },
        { id: 'listMemberships', label: t('twitter.listMemberships'), icon: List },
        { id: 'pinnedLists', label: t('twitter.pinnedLists'), icon: Lock },
      ],
    },
    {
      title: t('twitter.navPrivacy'),
      items: [
        { id: 'blocks', label: t('twitter.blocks'), icon: Ban },
        { id: 'mutes', label: t('twitter.mutes'), icon: Shield },
      ],
    },
  ], [t])

  const flatNavItems = useMemo(() => navGroups.flatMap(group => group.items), [navGroups])
  const activeTitle = flatNavItems.find(item => item.id === activePanel)?.label ?? t('twitter.timeline')
  const showConfirm = open && !skipTwitterExploreConfirm && !confirmed

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setConfirmed(false)
      setDontShow(false)
      setDetailTweetId('')
    }
    onOpenChange(isOpen)
  }, [onOpenChange])

  const handleConfirm = useCallback(() => {
    if (dontShow) {
      setSkipTwitterExploreConfirm(true)
    }
    setConfirmed(true)
  }, [dontShow, setSkipTwitterExploreConfirm])

  const renderPanel = () => {
    const reloadKey = `${accountId}:${activePanel}`

    switch (activePanel) {
      case 'home':
        return (
          <TweetPanel
            title={t('twitter.timeline')}
            description={t('twitter.timelineDesc')}
            accountId={accountId}
            loadPage={paginationToken => apiTwitterHomeTimeline({ accountId, paginationToken })}
            reloadKey={reloadKey}
            onTweetClick={setDetailTweetId}
          />
        )
      case 'myTweets':
        return (
          <TweetPanel
            title={t('twitter.myTweets')}
            description={t('twitter.myTweetsDesc')}
            accountId={accountId}
            loadPage={paginationToken => apiTwitterMyPosts({ accountId, paginationToken })}
            reloadKey={reloadKey}
            onTweetClick={setDetailTweetId}
          />
        )
      case 'mentions':
        return (
          <TweetPanel
            title={t('twitter.mentions')}
            description={t('twitter.mentionsDesc')}
            accountId={accountId}
            loadPage={paginationToken => apiTwitterUserMentions({ accountId, paginationToken })}
            reloadKey={reloadKey}
            onTweetClick={setDetailTweetId}
          />
        )
      case 'bookmarks':
        return (
          <TweetPanel
            title={t('twitter.bookmarks')}
            description={t('twitter.bookmarksDesc')}
            accountId={accountId}
            loadPage={paginationToken => apiTwitterBookmarks({ accountId, paginationToken })}
            reloadKey={reloadKey}
            onTweetClick={setDetailTweetId}
            initialBookmarked
          />
        )
      case 'likedPosts':
        return (
          <TweetPanel
            title={t('twitter.likedPosts')}
            description={t('twitter.likedPostsDesc')}
            accountId={accountId}
            loadPage={paginationToken => apiTwitterMyLikedPosts({ accountId, paginationToken })}
            reloadKey={reloadKey}
            onTweetClick={setDetailTweetId}
            initialLiked
          />
        )
      case 'followers':
        return (
          <UserPanel
            title={t('twitter.followers')}
            description={t('twitter.followersDesc')}
            loadPage={paginationToken => apiTwitterMyFollowers({ accountId, paginationToken })}
            reloadKey={reloadKey}
          />
        )
      case 'following':
        return (
          <UserPanel
            title={t('twitter.following')}
            description={t('twitter.followingDesc')}
            loadPage={paginationToken => apiTwitterMyFollowing({ accountId, paginationToken })}
            reloadKey={reloadKey}
          />
        )
      case 'blocks':
        return (
          <UserPanel
            title={t('twitter.blocks')}
            description={t('twitter.blocksDesc')}
            loadPage={paginationToken => apiTwitterMyBlocks({ accountId, paginationToken })}
            reloadKey={reloadKey}
          />
        )
      case 'mutes':
        return (
          <UserPanel
            title={t('twitter.mutes')}
            description={t('twitter.mutesDesc')}
            loadPage={paginationToken => apiTwitterMyMutes({ accountId, paginationToken })}
            reloadKey={reloadKey}
          />
        )
      case 'ownedLists':
        return (
          <ListPanel
            title={t('twitter.ownedLists')}
            description={t('twitter.ownedListsDesc')}
            loadPage={paginationToken => apiTwitterMyOwnedLists({ accountId, paginationToken })}
            reloadKey={reloadKey}
          />
        )
      case 'followedLists':
        return (
          <ListPanel
            title={t('twitter.followedLists')}
            description={t('twitter.followedListsDesc')}
            loadPage={paginationToken => apiTwitterMyFollowedLists({ accountId, paginationToken })}
            reloadKey={reloadKey}
          />
        )
      case 'listMemberships':
        return (
          <ListPanel
            title={t('twitter.listMemberships')}
            description={t('twitter.listMembershipsDesc')}
            loadPage={paginationToken => apiTwitterMyListMemberships({ accountId, paginationToken })}
            reloadKey={reloadKey}
          />
        )
      case 'pinnedLists':
        return (
          <ListPanel
            title={t('twitter.pinnedLists')}
            description={t('twitter.pinnedListsDesc')}
            loadPage={paginationToken => apiTwitterMyPinnedLists({ accountId, paginationToken })}
            reloadKey={reloadKey}
          />
        )
      case 'search':
        return <SearchPanel accountId={accountId} onTweetClick={setDetailTweetId} />
      case 'userLookup':
        return <UserLookupPanel accountId={accountId} onTweetClick={setDetailTweetId} />
      case 'tweetLookup':
        return <TweetLookupPanel accountId={accountId} />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex h-[90vh] max-w-6xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="flex min-w-0 items-center gap-2 text-base">
            <Compass className="h-5 w-5 shrink-0" />
            <span className="truncate">{t('twitter.explore')}</span>
            {username && (
              <span className="truncate text-sm font-normal text-muted-foreground">
                @
                {username}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {showConfirm ? (
          <div className="flex min-h-0 flex-1 flex-col items-center gap-6 overflow-y-auto px-6 py-6">
            <div className="flex max-w-md flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t('twitter.creditsConfirmTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('twitter.creditsConfirmDesc')}</p>
            </div>

            <CreditsPreviewTable />

            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={dontShow} onCheckedChange={value => setDontShow(value === true)} />
              {t('twitter.dontShowAgain')}
            </label>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleClose(false)}>
                {directTrans('common', 'actions.cancel')}
              </Button>
              <Button onClick={handleConfirm}>
                {t('twitter.confirmContinue')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden min-h-0 border-r border-border bg-muted/20 md:flex md:flex-col">
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{t('twitter.console')}</p>
                <p className="mt-1 truncate text-sm font-medium text-foreground">{activeTitle}</p>
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-4 p-3">
                  {navGroups.map(group => (
                    <div key={group.title} className="space-y-1">
                      <p className="px-2 text-xs font-medium text-muted-foreground">{group.title}</p>
                      {group.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActivePanel(item.id)}
                            className={cn(
                              'flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
                              activePanel === item.id
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </aside>

            <div className="flex min-h-0 flex-col">
              <div className="border-b border-border px-4 py-2 md:hidden">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {flatNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActivePanel(item.id)}
                        className={cn(
                          'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors',
                          activePanel === item.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 text-muted-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="min-h-0 flex-1">{renderPanel()}</div>
            </div>
          </div>
        )}

        {detailTweetId && (
          <TweetDetailDialog
            open
            onOpenChange={(nextOpen) => {
              if (!nextOpen)
                setDetailTweetId('')
            }}
            accountId={accountId}
            tweetId={detailTweetId}
          />
        )}
      </DialogContent>
    </Dialog>
  )
})

TwitterExploreDialog.displayName = 'TwitterExploreDialog'

export default TwitterExploreDialog
