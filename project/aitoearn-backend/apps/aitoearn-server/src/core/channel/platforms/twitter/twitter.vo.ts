import { createZodDto } from '@yikart/common'
import { z } from 'zod'

// ==================== Base Schemas ====================

const TwitterApiErrorVoSchema = z.object({
  title: z.string().optional().describe('错误标题'),
  detail: z.string().optional().describe('错误详情'),
  type: z.string().optional().describe('错误类型'),
  status: z.number().optional().describe('HTTP 状态码'),
})

const TwitterUserPublicMetricsVoSchema = z.object({
  followersCount: z.number().optional().describe('粉丝数'),
  followingCount: z.number().optional().describe('关注数'),
  tweetCount: z.number().optional().describe('推文数'),
  listedCount: z.number().optional().describe('被列入列表数'),
  likeCount: z.number().optional().describe('点赞数'),
  mediaCount: z.number().optional().describe('媒体数'),
})

const TwitterPostPublicMetricVoSchema = z.object({
  bookmarkCount: z.number().optional().describe('书签数'),
  impressionCount: z.number().optional().describe('展示数'),
  likeCount: z.number().optional().describe('点赞数'),
  replyCount: z.number().optional().describe('回复数'),
  retweetCount: z.number().optional().describe('转发数'),
  quoteCount: z.number().optional().describe('引用数'),
})

const TwitterPostAttachmentVoSchema = z.object({
  mediaKeys: z.array(z.string()).optional().describe('媒体 Key 列表'),
  mediaSourceTweetId: z.array(z.string()).optional().describe('媒体来源推文 ID 列表'),
  pollIds: z.array(z.string()).optional().describe('投票 ID 列表'),
})

const TwitterReferencedTweetVoSchema = z.object({
  type: z.enum(['retweeted', 'quoted', 'replied_to']).optional().describe('引用类型'),
  id: z.string().optional().describe('被引用推文 ID'),
})

const TwitterMediaVariantVoSchema = z.object({
  bitRate: z.number().optional().describe('比特率'),
  contentType: z.string().optional().describe('内容类型'),
  url: z.string().optional().describe('媒体 URL'),
})

const TwitterWithheldVoSchema = z.object({
  copyright: z.boolean().optional().describe('是否因版权原因受限'),
  countryCodes: z.array(z.string()).optional().describe('限制展示的国家代码列表'),
  scope: z.string().optional().describe('限制范围'),
})

const TwitterMediaMetadataVoSchema = z.object({
  altText: z.string().optional().describe('媒体无障碍描述文本'),
  durationMs: z.number().optional().describe('媒体时长毫秒数'),
  height: z.number().optional().describe('媒体高度'),
  mediaKey: z.string().optional().describe('媒体 Key'),
  previewImageUrl: z.string().optional().describe('预览图 URL'),
  type: z.string().optional().describe('媒体类型'),
  url: z.string().optional().describe('媒体 URL'),
  variants: z.array(TwitterMediaVariantVoSchema).optional().describe('媒体变体'),
  width: z.number().optional().describe('媒体宽度'),
})

// ==================== Entity Schemas ====================

export const TwitterUserInfoVoSchema = z.object({
  id: z.string().describe('用户 ID'),
  name: z.string().describe('显示名称'),
  profileImageUrl: z.string().optional().describe('头像 URL'),
  username: z.string().describe('用户名'),
  verified: z.boolean().optional().describe('是否认证'),
  createdAt: z.string().optional().describe('创建时间'),
  protected: z.boolean().optional().describe('是否私密账号'),
  publicMetrics: TwitterUserPublicMetricsVoSchema.optional().describe('公开指标'),
  withheld: TwitterWithheldVoSchema.optional().describe('展示限制信息'),
})

export const TwitterPostDetailVoSchema = z.object({
  id: z.string().optional().describe('推文 ID'),
  text: z.string().optional().describe('推文内容'),
  authorId: z.string().optional().describe('作者 ID'),
  attachments: TwitterPostAttachmentVoSchema.optional().describe('附件'),
  communityId: z.string().optional().describe('社区 ID'),
  conversationId: z.string().optional().describe('对话 ID'),
  createdAt: z.string().optional().describe('创建时间'),
  displayTextRange: z.array(z.number()).optional().describe('显示文本范围'),
  editHistoryTweetIds: z.array(z.string()).optional().describe('编辑历史推文 ID'),
  inReplyToUserId: z.string().optional().describe('回复目标用户 ID'),
  mediaMetadata: z.array(TwitterMediaMetadataVoSchema).optional().describe('媒体元数据'),
  publicMetrics: TwitterPostPublicMetricVoSchema.optional().describe('公开指标'),
  referencedTweets: z.array(TwitterReferencedTweetVoSchema).optional().describe('引用的推文'),
})

export const TwitterIncludeMediaVoSchema = z.object({
  mediaKey: z.string().optional().describe('媒体 Key'),
  type: z.string().optional().describe('媒体类型'),
  url: z.string().optional().describe('媒体 URL'),
  previewImageUrl: z.string().optional().describe('预览图 URL'),
  variants: z.array(TwitterMediaVariantVoSchema).optional().describe('媒体变体'),
})

export const TwitterListVoSchema = z.object({
  id: z.string().describe('列表 ID'),
  name: z.string().describe('列表名称'),
  description: z.string().optional().describe('列表描述'),
  followerCount: z.number().optional().describe('关注列表的用户数'),
  memberCount: z.number().optional().describe('列表成员数'),
  ownerId: z.string().optional().describe('列表拥有者用户 ID'),
  private: z.boolean().optional().describe('是否私密列表'),
  createdAt: z.string().optional().describe('创建时间'),
})

// ==================== Envelope Schemas ====================

const TwitterIncludesVoSchema = z.object({
  media: z.array(TwitterIncludeMediaVoSchema).optional().describe('包含的媒体'),
  users: z.array(TwitterUserInfoVoSchema).optional().describe('包含的用户'),
})

const TwitterTimelineMetaVoSchema = z.object({
  newestId: z.string().optional().describe('最新 ID'),
  oldestId: z.string().optional().describe('最旧 ID'),
  resultCount: z.number().optional().describe('结果数量'),
  nextToken: z.string().optional().describe('下一页 Token'),
  previousToken: z.string().optional().describe('上一页 Token'),
})

// ==================== Response VOs ====================

const TwitterAuthUrlVoSchema = z.object({
  url: z.string().describe('OAuth 授权地址'),
  taskId: z.string().describe('任务 ID'),
  state: z.string().describe('状态码'),
})
export class TwitterAuthUrlVo extends createZodDto(TwitterAuthUrlVoSchema, 'TwitterAuthUrlVo') {}

const TwitterAuthTaskInfoVoSchema = z.object({
  state: z.string().describe('状态码'),
  status: z.union([z.literal(0), z.literal(1)]).describe('授权状态，0 处理中，1 已完成'),
  userId: z.string().describe('用户 ID'),
  taskId: z.string().describe('任务 ID'),
  accountId: z.string().optional().describe('账号 ID'),
  spaceId: z.string().optional().describe('空间 ID'),
  callbackUrl: z.string().optional().describe('回调地址'),
  callbackMethod: z.enum(['GET', 'POST']).optional().describe('回调方式'),
})
export class TwitterAuthTaskInfoVo extends createZodDto(TwitterAuthTaskInfoVoSchema, 'TwitterAuthTaskInfoVo') {}

const TwitterUserInfoResponseVoSchema = z.object({
  data: TwitterUserInfoVoSchema.optional().describe('用户信息'),
  errors: z.array(TwitterApiErrorVoSchema).optional().describe('错误列表'),
})
export class TwitterUserInfoResponseVo extends createZodDto(TwitterUserInfoResponseVoSchema, 'TwitterUserInfoResponseVo') {}

const TwitterTimelineResponseVoSchema = z.object({
  data: z.array(TwitterPostDetailVoSchema).optional().describe('推文列表'),
  errors: z.array(TwitterApiErrorVoSchema).optional().describe('错误列表'),
  includes: TwitterIncludesVoSchema.optional().describe('包含的关联数据'),
  meta: TwitterTimelineMetaVoSchema.optional().describe('分页信息'),
})
export class TwitterTimelineResponseVo extends createZodDto(TwitterTimelineResponseVoSchema, 'TwitterTimelineResponseVo') {}

const TwitterUserListResponseVoSchema = z.object({
  data: z.array(TwitterUserInfoVoSchema).optional().describe('用户列表'),
  errors: z.array(TwitterApiErrorVoSchema).optional().describe('错误列表'),
  meta: TwitterTimelineMetaVoSchema.optional().describe('分页信息'),
})
export class TwitterUserListResponseVo extends createZodDto(TwitterUserListResponseVoSchema, 'TwitterUserListResponseVo') {}

const TwitterListResponseVoSchema = z.object({
  data: z.array(TwitterListVoSchema).optional().describe('列表数据'),
  errors: z.array(TwitterApiErrorVoSchema).optional().describe('错误列表'),
  includes: TwitterIncludesVoSchema.optional().describe('包含的关联数据'),
  meta: TwitterTimelineMetaVoSchema.optional().describe('分页信息'),
})
export class TwitterListResponseVo extends createZodDto(TwitterListResponseVoSchema, 'TwitterListResponseVo') {}

const TwitterPostDetailResponseVoSchema = z.object({
  data: TwitterPostDetailVoSchema.optional().describe('推文详情'),
  errors: z.array(TwitterApiErrorVoSchema).optional().describe('错误列表'),
  includes: TwitterIncludesVoSchema.optional().describe('包含的关联数据'),
  tweetId: z.string().describe('推文 ID'),
  tweetUrl: z.string().describe('推文 URL'),
})
export class TwitterPostDetailResponseVo extends createZodDto(TwitterPostDetailResponseVoSchema, 'TwitterPostDetailResponseVo') {}

const TwitterResolveTweetVoSchema = z.object({
  tweetId: z.string().describe('推文 ID'),
  tweetUrl: z.string().describe('推文 URL'),
  resolvedUrl: z.string().describe('解析后的 URL'),
})
export class TwitterResolveTweetVo extends createZodDto(TwitterResolveTweetVoSchema, 'TwitterResolveTweetVo') {}

const TwitterCreatePostResponseVoSchema = z.object({
  data: z.object({
    id: z.string().optional().describe('推文 ID'),
    text: z.string().optional().describe('推文内容'),
  }).optional().describe('创建结果'),
  errors: z.array(TwitterApiErrorVoSchema).optional().describe('错误列表'),
})
export class TwitterCreatePostResponseVo extends createZodDto(TwitterCreatePostResponseVoSchema, 'TwitterCreatePostResponseVo') {}

const TwitterLikePostResponseVoSchema = z.object({
  data: z.object({
    liked: z.boolean().optional().describe('是否已点赞'),
  }).optional().describe('操作结果'),
  errors: z.array(TwitterApiErrorVoSchema).optional().describe('错误列表'),
})
export class TwitterLikePostResponseVo extends createZodDto(TwitterLikePostResponseVoSchema, 'TwitterLikePostResponseVo') {}

const TwitterRePostResponseVoSchema = z.object({
  data: z.object({
    retweeted: z.boolean().optional().describe('是否已转发'),
  }).optional().describe('操作结果'),
  errors: z.array(TwitterApiErrorVoSchema).optional().describe('错误列表'),
})
export class TwitterRePostResponseVo extends createZodDto(TwitterRePostResponseVoSchema, 'TwitterRePostResponseVo') {}

const TwitterBookmarkMutationResponseVoSchema = z.object({
  data: z.record(z.string(), z.boolean()).optional().describe('操作结果'),
  errors: z.array(TwitterApiErrorVoSchema).optional().describe('错误列表'),
})
export class TwitterBookmarkMutationResponseVo extends createZodDto(TwitterBookmarkMutationResponseVoSchema, 'TwitterBookmarkMutationResponseVo') {}

const TwitterHideReplyResponseVoSchema = z.object({
  data: z.record(z.string(), z.boolean()).optional().describe('操作结果'),
  errors: z.array(TwitterApiErrorVoSchema).optional().describe('错误列表'),
})
export class TwitterHideReplyResponseVo extends createZodDto(TwitterHideReplyResponseVoSchema, 'TwitterHideReplyResponseVo') {}
