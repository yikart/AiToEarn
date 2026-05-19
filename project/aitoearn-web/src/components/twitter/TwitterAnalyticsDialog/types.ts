import type { TwitterListResponseVo, TwitterTimelineResponseVo, TwitterUserListResponseVo } from '@/api/types/twitter'

export type TwitterPanelId
  = | 'home'
    | 'myTweets'
    | 'mentions'
    | 'bookmarks'
    | 'likedPosts'
    | 'followers'
    | 'following'
    | 'blocks'
    | 'mutes'
    | 'ownedLists'
    | 'followedLists'
    | 'listMemberships'
    | 'pinnedLists'
    | 'search'
    | 'userLookup'
    | 'tweetLookup'

export type TwitterApiResult<T> = {
  code: string | number
  data: T
  message: string
} | null

export type TwitterTweetPageLoader = (paginationToken?: string) => Promise<TwitterApiResult<TwitterTimelineResponseVo>>

export type TwitterUserPageLoader = (paginationToken?: string) => Promise<TwitterApiResult<TwitterUserListResponseVo>>

export type TwitterListPageLoader = (paginationToken?: string) => Promise<TwitterApiResult<TwitterListResponseVo>>
