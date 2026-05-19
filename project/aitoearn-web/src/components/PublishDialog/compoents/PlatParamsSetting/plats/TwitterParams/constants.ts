import type { TwitterReplySettings } from '@/api/types/twitter'

export const TWITTER_REPLY_SETTINGS: TwitterReplySettings[] = [
  'following',
  'mentionedUsers',
  'subscribers',
  'verified',
]

export const TWITTER_DEFAULT_POLL_DURATION = 1440

export const TWITTER_MAX_POLL_OPTIONS = 4

export const TWITTER_MIN_POLL_OPTIONS = 2

export const TWITTER_MAX_TAGGED_USERS = 10

export const TWITTER_MAX_ALT_TEXT_LENGTH = 1000
