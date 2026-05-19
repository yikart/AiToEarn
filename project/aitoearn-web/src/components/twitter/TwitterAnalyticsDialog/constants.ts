/** Twitter 前端展示/余额预检价格，单位：积分。 */
export interface TwitterCreditsRow {
  labelKey: string
  priceKey: string
}

export const TWITTER_READ_CREDIT_ROWS: TwitterCreditsRow[] = [
  { labelKey: 'profileLookup', priceKey: 'onePerUse' },
  { labelKey: 'searchMentionsConversation', priceKey: 'upToTwoPointFivePerItem' },
  { labelKey: 'tweetFeeds', priceKey: 'upToThreePointFivePerItem' },
  { labelKey: 'tweetDetail', priceKey: 'upToThreePointFivePerItem' },
  { labelKey: 'reposts', priceKey: 'halfPerItem' },
  { labelKey: 'userLists', priceKey: 'onePerItem' },
  { labelKey: 'normalLists', priceKey: 'onePerItem' },
  { labelKey: 'pinnedLists', priceKey: 'sixteenPerUse' },
]

export const TWITTER_WRITE_API_CREDIT_ROWS: TwitterCreditsRow[] = [
  { labelKey: 'replyQuote', priceKey: 'onePointFivePerUse' },
  { labelKey: 'publishTweet', priceKey: 'onePointFivePerUse' },
  { labelKey: 'likeRepost', priceKey: 'onePointFivePerUse' },
  { labelKey: 'undoLikeRepost', priceKey: 'onePerUse' },
  { labelKey: 'bookmarkReplyVisibility', priceKey: 'halfPerUse' },
  { labelKey: 'deleteTweet', priceKey: 'halfPerUse' },
  { labelKey: 'mediaMetadata', priceKey: 'halfPerUse' },
]
