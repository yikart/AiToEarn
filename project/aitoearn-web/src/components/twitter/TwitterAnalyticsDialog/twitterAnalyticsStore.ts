/**
 * Twitter Analytics Store
 * 管理 Twitter 数据弹窗的状态
 */
import type { TwitterMediaItem, TwitterPaginationMeta, TwitterTweet, TwitterUser } from '@/api/types/twitter'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { apiTwitterUsersMe } from '@/api/plat/twitter'

export type TwitterAnalyticsTab = 'timeline' | 'myTweets' | 'likedPosts' | 'mentions' | 'search' | 'bookmarks' | 'following' | 'followers'

interface TweetPage {
  tweets: TwitterTweet[]
  users: TwitterUser[]
  media: TwitterMediaItem[]
  meta?: TwitterPaginationMeta
  loading: boolean
  hasMore: boolean
}

interface UserPage {
  users: TwitterUser[]
  meta?: TwitterPaginationMeta
  loading: boolean
  hasMore: boolean
}

function emptyPage(): TweetPage {
  return { tweets: [], users: [], media: [], meta: undefined, loading: false, hasMore: true }
}

function emptyUserPage(): UserPage {
  return { users: [], meta: undefined, loading: false, hasMore: true }
}

export const useTwitterAnalyticsStore = create(
  combine(
    {
      open: false,
      accountId: '',
      userId: '',
      activeTab: 'timeline' as TwitterAnalyticsTab,

      // Timeline
      timeline: emptyPage(),
      timelineExcludeRetweets: false,
      timelineExcludeReplies: false,

      // Mentions
      mentions: emptyPage(),

      // My Tweets
      myTweets: emptyPage(),

      // Search
      searchQuery: '',
      searchResults: emptyPage(),
      searchUser: null as TwitterUser | null,

      // Bookmarks
      bookmarks: emptyPage(),

      // Liked Posts
      likedPosts: emptyPage(),

      // Following
      following: emptyUserPage(),

      // Followers
      followers: emptyUserPage(),
    },
    set => ({
      setOpen(open: boolean) {
        set({ open })
      },

      setAccountId(accountId: string) {
        set({ accountId, userId: '', ...emptyAllPages() })
        // 异步获取当前用户 ID，供 myTweets/likedPosts/following/followers 使用
        apiTwitterUsersMe({ accountId }).then((res) => {
          if (res?.code === 0 && res.data?.data?.id) {
            set({ userId: res.data.data.id })
          }
        })
      },

      setActiveTab(tab: TwitterAnalyticsTab) {
        set({ activeTab: tab })
      },

      // Timeline
      setTimeline(data: Partial<TweetPage>) {
        set(state => ({ timeline: { ...state.timeline, ...data } }))
      },
      appendTimeline(tweets: TwitterTweet[], users: TwitterUser[], media: TwitterMediaItem[], meta?: TwitterPaginationMeta) {
        set(state => ({
          timeline: {
            tweets: [...state.timeline.tweets, ...tweets],
            users: mergeUsers(state.timeline.users, users),
            media: [...state.timeline.media, ...media],
            meta,
            loading: false,
            hasMore: !!meta?.nextToken,
          },
        }))
      },
      setTimelineFilters(excludeRetweets?: boolean, excludeReplies?: boolean) {
        set(state => ({
          timelineExcludeRetweets: excludeRetweets ?? state.timelineExcludeRetweets,
          timelineExcludeReplies: excludeReplies ?? state.timelineExcludeReplies,
        }))
      },

      // Mentions
      setMentions(data: Partial<TweetPage>) {
        set(state => ({ mentions: { ...state.mentions, ...data } }))
      },
      appendMentions(tweets: TwitterTweet[], users: TwitterUser[], media: TwitterMediaItem[], meta?: TwitterPaginationMeta) {
        set(state => ({
          mentions: {
            tweets: [...state.mentions.tweets, ...tweets],
            users: mergeUsers(state.mentions.users, users),
            media: [...state.mentions.media, ...media],
            meta,
            loading: false,
            hasMore: !!meta?.nextToken,
          },
        }))
      },

      // Search
      setSearchQuery(query: string) {
        set({ searchQuery: query })
      },
      setSearchResults(data: Partial<TweetPage>) {
        set(state => ({ searchResults: { ...state.searchResults, ...data } }))
      },
      appendSearchResults(tweets: TwitterTweet[], users: TwitterUser[], media: TwitterMediaItem[], meta?: TwitterPaginationMeta) {
        set(state => ({
          searchResults: {
            tweets: [...state.searchResults.tweets, ...tweets],
            users: mergeUsers(state.searchResults.users, users),
            media: [...state.searchResults.media, ...media],
            meta,
            loading: false,
            hasMore: !!meta?.nextToken,
          },
        }))
      },
      setSearchUser(user: TwitterUser | null) {
        set({ searchUser: user })
      },

      // Bookmarks
      setBookmarks(data: Partial<TweetPage>) {
        set(state => ({ bookmarks: { ...state.bookmarks, ...data } }))
      },
      appendBookmarks(tweets: TwitterTweet[], users: TwitterUser[], media: TwitterMediaItem[], meta?: TwitterPaginationMeta) {
        set(state => ({
          bookmarks: {
            tweets: [...state.bookmarks.tweets, ...tweets],
            users: mergeUsers(state.bookmarks.users, users),
            media: [...state.bookmarks.media, ...media],
            meta,
            loading: false,
            hasMore: !!meta?.nextToken,
          },
        }))
      },

      // My Tweets
      setMyTweets(data: Partial<TweetPage>) {
        set(state => ({ myTweets: { ...state.myTweets, ...data } }))
      },
      appendMyTweets(tweets: TwitterTweet[], users: TwitterUser[], media: TwitterMediaItem[], meta?: TwitterPaginationMeta) {
        set(state => ({
          myTweets: {
            tweets: [...state.myTweets.tweets, ...tweets],
            users: mergeUsers(state.myTweets.users, users),
            media: [...state.myTweets.media, ...media],
            meta,
            loading: false,
            hasMore: !!meta?.nextToken,
          },
        }))
      },

      // Liked Posts
      setLikedPosts(data: Partial<TweetPage>) {
        set(state => ({ likedPosts: { ...state.likedPosts, ...data } }))
      },
      appendLikedPosts(tweets: TwitterTweet[], users: TwitterUser[], media: TwitterMediaItem[], meta?: TwitterPaginationMeta) {
        set(state => ({
          likedPosts: {
            tweets: [...state.likedPosts.tweets, ...tweets],
            users: mergeUsers(state.likedPosts.users, users),
            media: [...state.likedPosts.media, ...media],
            meta,
            loading: false,
            hasMore: !!meta?.nextToken,
          },
        }))
      },

      // Following
      setFollowing(data: Partial<UserPage>) {
        set(state => ({ following: { ...state.following, ...data } }))
      },
      appendFollowing(users: TwitterUser[], meta?: TwitterPaginationMeta) {
        set(state => ({
          following: {
            users: mergeUsers(state.following.users, users),
            meta,
            loading: false,
            hasMore: !!meta?.nextToken,
          },
        }))
      },

      // Followers
      setFollowers(data: Partial<UserPage>) {
        set(state => ({ followers: { ...state.followers, ...data } }))
      },
      appendFollowers(users: TwitterUser[], meta?: TwitterPaginationMeta) {
        set(state => ({
          followers: {
            users: mergeUsers(state.followers.users, users),
            meta,
            loading: false,
            hasMore: !!meta?.nextToken,
          },
        }))
      },

      // Reset all
      reset() {
        set({
          open: false,
          accountId: '',
          userId: '',
          activeTab: 'timeline',
          ...emptyAllPages(),
          timelineExcludeRetweets: false,
          timelineExcludeReplies: false,
          searchQuery: '',
          searchUser: null,
        })
      },
    }),
  ),
)

function emptyAllPages() {
  return {
    timeline: emptyPage(),
    mentions: emptyPage(),
    searchResults: emptyPage(),
    bookmarks: emptyPage(),
    myTweets: emptyPage(),
    likedPosts: emptyPage(),
    following: emptyUserPage(),
    followers: emptyUserPage(),
  }
}

function mergeUsers(existing: TwitterUser[], incoming: TwitterUser[]): TwitterUser[] {
  const map = new Map(existing.map(u => [u.id, u]))
  for (const u of incoming) {
    map.set(u.id, u)
  }
  return Array.from(map.values())
}
