import { createZodDto } from '@yikart/common'
import z from 'zod'

const GetAuthUrlSchema = z.object({
  scopes: z.array(z.string()).optional().describe('OAuth 权限范围'),
  spaceId: z.string().optional().describe('空间 ID'),
  callbackUrl: z.string().url().optional().describe('OAuth 完成后回调地址'),
  callbackMethod: z.enum(['GET', 'POST']).optional().describe('回调方式，默认 GET'),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

const CreateAccountAndSetAccessTokenSchema = z.object({
  code: z.string().describe('授权码'),
  state: z.string().describe('状态码'),
})
export class CreateAccountAndSetAccessTokenDto extends createZodDto(CreateAccountAndSetAccessTokenSchema) {}

const TimelineQueryBaseSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  sinceId: z.string().optional().describe('起始推文 ID'),
  untilId: z.string().optional().describe('截止推文 ID'),
  maxResults: z.string().optional().describe('最大结果数'),
  paginationToken: z.string().optional().describe('分页 Token'),
  startTime: z.string().optional().describe('开始时间'),
  endTime: z.string().optional().describe('结束时间'),
})

const UserTimelineSchema = TimelineQueryBaseSchema.extend({
  userId: z.string().describe('用户 ID'),
  exclude: z.array(z.enum(['retweets', 'replies'])).optional().describe('排除类型'),
})
export class UserTimelineDto extends createZodDto(UserTimelineSchema) {}

const TwitterAccountSchema = z.object({
  accountId: z.string().describe('账号 ID'),
})
export class TwitterAccountDto extends createZodDto(TwitterAccountSchema) {}

const TwitterHomeTimelineSchema = TimelineQueryBaseSchema.extend({
  exclude: z.array(z.enum(['retweets', 'replies'])).optional().describe('排除类型'),
})
export class TwitterHomeTimelineDto extends createZodDto(TwitterHomeTimelineSchema) {}

const TwitterMyPostsSchema = TimelineQueryBaseSchema.extend({
  exclude: z.array(z.enum(['retweets', 'replies'])).optional().describe('排除类型'),
})
export class TwitterMyPostsDto extends createZodDto(TwitterMyPostsSchema) {}

const TwitterMyUserListSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  maxResults: z.string().optional().describe('最大结果数'),
  paginationToken: z.string().optional().describe('分页 Token'),
})
export class TwitterMyUserListDto extends createZodDto(TwitterMyUserListSchema) {}

const TwitterMyListSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  maxResults: z.string().optional().describe('最大结果数'),
  paginationToken: z.string().optional().describe('分页 Token'),
})
export class TwitterMyListDto extends createZodDto(TwitterMyListSchema) {}

const TwitterMyPinnedListSchema = z.object({
  accountId: z.string().describe('账号 ID'),
})
export class TwitterMyPinnedListDto extends createZodDto(TwitterMyPinnedListSchema) {}

const TwitterMyLikedPostsSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  maxResults: z.string().optional().describe('最大结果数'),
  paginationToken: z.string().optional().describe('分页 Token'),
})
export class TwitterMyLikedPostsDto extends createZodDto(TwitterMyLikedPostsSchema) {}

const TwitterMentionsSchema = TimelineQueryBaseSchema
export class TwitterMentionsDto extends createZodDto(TwitterMentionsSchema) {}

const TwitterSearchTweetsSchema = TimelineQueryBaseSchema.extend({
  query: z.string().trim().min(1).describe('搜索关键词'),
})
export class TwitterSearchTweetsDto extends createZodDto(TwitterSearchTweetsSchema) {}

const TwitterUserByUsernameSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  username: z.string().trim().min(1).describe('Twitter 用户名，支持带 @'),
})
export class TwitterUserByUsernameDto extends createZodDto(TwitterUserByUsernameSchema) {}

const TwitterUserPostsSchema = TimelineQueryBaseSchema.extend({
  exclude: z.array(z.enum(['retweets', 'replies'])).optional().describe('排除类型'),
})
export class TwitterUserPostsDto extends createZodDto(TwitterUserPostsSchema) {}

const TwitterUserListSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  maxResults: z.string().optional().describe('最大结果数'),
  paginationToken: z.string().optional().describe('分页 Token'),
})
export class TwitterUserListDto extends createZodDto(TwitterUserListSchema) {}

const TwitterUserLikedPostsSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  maxResults: z.string().optional().describe('最大结果数'),
  paginationToken: z.string().optional().describe('分页 Token'),
})
export class TwitterUserLikedPostsDto extends createZodDto(TwitterUserLikedPostsSchema) {}

const TwitterBookmarksSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  maxResults: z.string().optional().describe('最大结果数'),
  paginationToken: z.string().optional().describe('分页 Token'),
})
export class TwitterBookmarksDto extends createZodDto(TwitterBookmarksSchema) {}

const TwitterPostActionSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  tweetId: z.string().describe('推文 ID'),
})
export class TwitterPostActionDto extends createZodDto(TwitterPostActionSchema) {}

const TwitterResolveTweetSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  tweetRef: z.string().trim().min(1).describe('推文链接、短链或推文 ID'),
})
export class TwitterResolveTweetDto extends createZodDto(TwitterResolveTweetSchema) {}

const TwitterTweetListSchema = TwitterPostActionSchema.extend({
  maxResults: z.string().optional().describe('最大结果数'),
  paginationToken: z.string().optional().describe('分页 Token'),
})
export class TwitterTweetListDto extends createZodDto(TwitterTweetListSchema) {}

const TwitterReplyActionSchema = TwitterPostActionSchema.extend({
  text: z.string().trim().min(1).max(280).describe('回复内容'),
})
export class TwitterReplyActionDto extends createZodDto(TwitterReplyActionSchema) {}

const TwitterQuoteActionSchema = TwitterPostActionSchema.extend({
  text: z.string().trim().min(1).max(280).describe('引用内容'),
})
export class TwitterQuoteActionDto extends createZodDto(TwitterQuoteActionSchema) {}

const TwitterHideReplySchema = TwitterPostActionSchema
export class TwitterHideReplyDto extends createZodDto(TwitterHideReplySchema) {}
