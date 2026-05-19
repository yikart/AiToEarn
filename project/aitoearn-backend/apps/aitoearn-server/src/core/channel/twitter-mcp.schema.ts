import { z } from 'zod'

const accountIdField = z.string().describe('Twitter account ID')
const tweetIdField = z.string().describe('Tweet ID')
const maxResultsField = z.string().optional().describe('Maximum results')
const paginationTokenField = z.string().optional().describe('Pagination token')
const userIdField = z.string().trim().min(1).describe('Twitter user ID')

export const twitterAccountSchema = z.object({
  accountId: accountIdField,
})
export type TwitterAccountParams = z.infer<typeof twitterAccountSchema>

export const resolveTweetSchema = z.object({
  accountId: accountIdField,
  tweetRef: z.string().trim().min(1).describe('Tweet URL, short link, or tweet ID'),
})
export type ResolveTweetParams = z.infer<typeof resolveTweetSchema>

export const searchTweetsSchema = z.object({
  accountId: accountIdField,
  query: z.string().trim().min(1).describe('Search query'),
  sinceId: z.string().optional().describe('Since tweet ID'),
  untilId: z.string().optional().describe('Until tweet ID'),
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
  startTime: z.string().optional().describe('Start time'),
  endTime: z.string().optional().describe('End time'),
})
export type SearchTweetsParams = z.infer<typeof searchTweetsSchema>

export const getTwitterUserByUsernameSchema = z.object({
  accountId: accountIdField,
  username: z.string().trim().min(1).describe('Twitter username, with or without @'),
})
export type GetTwitterUserByUsernameParams = z.infer<typeof getTwitterUserByUsernameSchema>

export const listMyTweetsSchema = z.object({
  accountId: accountIdField,
  sinceId: z.string().optional().describe('Since tweet ID'),
  untilId: z.string().optional().describe('Until tweet ID'),
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
  startTime: z.string().optional().describe('Start time'),
  endTime: z.string().optional().describe('End time'),
  exclude: z.array(z.enum(['retweets', 'replies'])).optional().describe('Excluded tweet types'),
})
export type ListMyTweetsParams = z.infer<typeof listMyTweetsSchema>

export const listUserTweetsByIdSchema = z.object({
  accountId: accountIdField,
  userId: userIdField,
  sinceId: z.string().optional().describe('Since tweet ID'),
  untilId: z.string().optional().describe('Until tweet ID'),
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
  startTime: z.string().optional().describe('Start time'),
  endTime: z.string().optional().describe('End time'),
  exclude: z.array(z.enum(['retweets', 'replies'])).optional().describe('Excluded tweet types'),
})
export type ListUserTweetsByIdParams = z.infer<typeof listUserTweetsByIdSchema>

export const listHomeTimelineSchema = z.object({
  accountId: accountIdField,
  sinceId: z.string().optional().describe('Since tweet ID'),
  untilId: z.string().optional().describe('Until tweet ID'),
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
  startTime: z.string().optional().describe('Start time'),
  endTime: z.string().optional().describe('End time'),
  exclude: z.array(z.enum(['retweets', 'replies'])).optional().describe('Excluded tweet types'),
})
export type ListHomeTimelineParams = z.infer<typeof listHomeTimelineSchema>

export const listMyConnectionsSchema = z.object({
  accountId: accountIdField,
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
})
export type ListMyConnectionsParams = z.infer<typeof listMyConnectionsSchema>

export const listMyListsSchema = z.object({
  accountId: accountIdField,
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
})
export type ListMyListsParams = z.infer<typeof listMyListsSchema>

export const listMyPinnedListsSchema = z.object({
  accountId: accountIdField,
})
export type ListMyPinnedListsParams = z.infer<typeof listMyPinnedListsSchema>

export const listUserConnectionsByIdSchema = z.object({
  accountId: accountIdField,
  userId: userIdField,
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
})
export type ListUserConnectionsByIdParams = z.infer<typeof listUserConnectionsByIdSchema>

export const listMyLikedTweetsSchema = z.object({
  accountId: accountIdField,
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
})
export type ListMyLikedTweetsParams = z.infer<typeof listMyLikedTweetsSchema>

export const listUserLikedTweetsByIdSchema = z.object({
  accountId: accountIdField,
  userId: userIdField,
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
})
export type ListUserLikedTweetsByIdParams = z.infer<typeof listUserLikedTweetsByIdSchema>

export const listMyBookmarksSchema = z.object({
  accountId: accountIdField,
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
})
export type ListMyBookmarksParams = z.infer<typeof listMyBookmarksSchema>

export const listMyMentionsSchema = z.object({
  accountId: accountIdField,
  sinceId: z.string().optional().describe('Since tweet ID'),
  untilId: z.string().optional().describe('Until tweet ID'),
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
  startTime: z.string().optional().describe('Start time'),
  endTime: z.string().optional().describe('End time'),
})
export type ListMyMentionsParams = z.infer<typeof listMyMentionsSchema>

export const tweetActionSchema = z.object({
  accountId: accountIdField,
  tweetId: tweetIdField,
})
export type TweetActionParams = z.infer<typeof tweetActionSchema>

export const tweetListSchema = tweetActionSchema.extend({
  maxResults: maxResultsField,
  paginationToken: paginationTokenField,
})
export type TweetListParams = z.infer<typeof tweetListSchema>

export const replyTweetSchema = tweetActionSchema.extend({
  text: z.string().trim().min(1).max(280).describe('Reply text'),
})
export type ReplyTweetParams = z.infer<typeof replyTweetSchema>

export const quoteTweetSchema = tweetActionSchema.extend({
  text: z.string().trim().min(1).max(280).describe('Quote text'),
})
export type QuoteTweetParams = z.infer<typeof quoteTweetSchema>
