import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'

export const KeysetPaginationSchema = z.object({
  before: z.string().nullish().describe('前一页游标, 对应平台使用keyset分页时, 传递该参数获取前一页数据'),
  after: z.string().nullish().describe('后一页游标, 对应平台使用keyset分页时, 传递该参数获取下一页数据'),
  limit: z.number().min(1).max(50).nullish().describe('每页数量,默认20, 对应平台使用keyset分页时, 传递该参数设置每页数量'),
}).describe('Keyset分页参数')

export const OffsetPaginationSchema = z.object({
  pageNo: z.number({ message: 'page number' }).min(1).nullish().default(1).describe('分页页码,默认1, 对应平台使用offset分页时, 传递该参数设置页码'),
  pageSize: z.number({ message: 'page size' }).min(1).max(100).nullish().default(20).describe('每页数量,默认20, 对应平台使用offset分页时, 传递该参数设置每页数量'),
}).describe('Offset分页参数')

export const FetchPostCommentsSchema = z.object({
  accountId: z.string({ message: 'accountId is required' }).describe('账号ID, account列表中的account字段'),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest'], { message: 'platform is required' }).describe('平台'),
  postId: z.string({ message: 'Post ID is required' }).describe('作品ID'),
  pagination: z.union([KeysetPaginationSchema, OffsetPaginationSchema]).nullish().describe('分页参数'),
}).describe('获取作品评论请求参数')

export const FetchCommentRepliesSchema = z.object({
  accountId: z.string({ message: 'accountId is required' }).describe('账号ID, account列表中的account字段'),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest'], { message: 'platform is required' }).describe('平台'),
  commentId: z.string({ message: 'comment ID is required' }).describe('评论ID'),
  pagination: z.union([KeysetPaginationSchema, OffsetPaginationSchema]).nullish().describe('分页参数'),
}).describe('获取作品评论请求参数')

export const FetchPostCommentsResponseSchema = z.object({
  comments: z.array(z.object({
    id: z.string().describe('评论ID'),
    message: z.string().describe('评论内容'),
    author: z.object({
      username: z.string().describe('评论用户名称'),
      avatar: z.string().nullish().describe('评论用户头像'),
    }).describe('评论用户信息'),
    createdAt: z.string().describe('评论创建时间, ISO 8601格式'),
    hasReplies: z.boolean().describe('是否有回复评论'),
  })).describe('评论列表'),
  total: z.number().nullish().describe('评论总数, 仅对应平台使用offset分页时返回该字段'),
  cursor: z.object({
    before: z.string().nullish().describe('前一页游标, 对应平台使用keyset分页时返回该字段, meta(facebook/instagram/threads)平台使用keyset分页'),
    after: z.string().nullish().describe('后一页游标, 对应平台使用keyset分页时返回该字段, meta(facebook/instagram/threads)平台使用keyset分页'),
  }).nullish().describe('分页游标, 仅对应平台使用keyset分页时返回该字段, meta(facebook/instagram/threads)平台使用keyset分页'),
}).describe('获取作品评论响应数据')

export const PublishCommentRequestSchema = z.object({
  accountId: z.string({ message: 'accountId is required' }).describe('account列表中的account字段'),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest'], { message: 'platform is required' }).describe('平台'),
  postId: z.string({ message: 'Post ID is required' }).describe('作品ID'),
  message: z.string({ message: 'Comment message is required' }).min(1).max(500).describe('评论内容, 最大500字符'),
}).describe('发布评论请求参数')

export const publishCommentReplyRequestSchema = z.object({
  accountId: z.string({ message: 'accountId is required' }).describe('account列表中的account字段'),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest'], { message: 'platform is required' }).describe('平台'),
  commentId: z.string({ message: 'Comment ID is required' }).describe('评论ID'),
  message: z.string({ message: 'Comment message is required' }).min(1).max(500).describe('评论内容, 最大500字符'),
}).describe('发布评论回复请求参数')

export const PublishCommentResponseSchema = z.object({
  id: z.string().nullish().describe('发布成功的评论ID'),
  success: z.boolean().describe('是否发布成功'),
  error: z.string().nullish().describe('发布失败时的错误信息'),
}).describe('发布评论响应数据')

export const FetchPostsRequestSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  uid: z.string().describe('userId, account表中的uid字段'),
  page: z.number().min(1).nullable().default(1).describe('页码, 默认1'),
  pageSize: z.number().min(1).max(100).nullable().default(20).describe('每页数量, 默认20, 最大100'),
})

export const FetchMetaPostsRequestSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  accountId: z.string().describe('accountId, account表中的id字段'),
  after: z.string().nullish().describe('后一页游标'),
  before: z.string().nullish().describe('前一页游标'),
  pagination: z.union([KeysetPaginationSchema, OffsetPaginationSchema]).nullish().describe('分页参数'),
})

export const PostSchema = z.object({
  postId: z.string().describe('帖子ID'),
  platform: z.string().describe('平台'),
  title: z.string().nullable().describe('标题'),
  content: z.string().nullable().describe('内容'),
  thumbnail: z.string().nullable().describe('封面/缩略图链接'),
  mediaType: z.enum(['video', 'image', 'article']).describe('媒体类型 video | image | article'),
  permaLink: z.string().nullable().describe('作品外部链接'),
  publishTime: z.number().describe('发布时间，时间戳. 毫秒级'),
  viewCount: z.number().describe('浏览数'),
  commentCount: z.number().describe('评论数'),
  likeCount: z.number().describe('点赞数'),
  shareCount: z.number().describe('分享数'),
  clickCount: z.number().describe('点击数'),
  impressionCount: z.number().describe('曝光数'),
  favoriteCount: z.number().describe('收藏数'),
}).describe('帖子数据')

export const FetchPostsResponseSchema = z.object({
  total: z.number().describe('总数'),
  posts: z.array(PostSchema).describe('帖子列表'),
  hasMore: z.boolean().describe('是否有更多数据, 当值为true时再请求下一页'),
})

export const CommentSchema = z.object({
  id: z.string(),
  comment: z.string(),
})

export const ReplyToCommentsSchema = z.object({
  accountId: z.string().describe('账号ID, account列表中的Id字段'),
  postId: z.string().describe('作品ID'),
  prompt: z.string().min(1).max(500).optional().describe('提示语, 最大500字符'),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest']).describe('平台'),
  model: z.string().describe('AI模型名称, 调用AI模块模型列表接口获取'),
  comments: z.array(CommentSchema).optional().describe('评论列表, 传递该参数时, 表示选择评论回复,不传递该参数表示自动回复全部评论'),
})

export const AIGenCommentSchema = z.object({
  model: z.string().describe('AI模型名称, 调用AI模块模型列表接口获取'),
  prompt: z.string().max(500).optional().describe('提示语, 最大500字符'),
  comments: z.array(CommentSchema).describe('评论列表'),
})

export const AIGenCommentResponseSchema = z.object({
  id: z.string(),
  comment: z.string(),
  reply: z.string(),
})

export const ReplyToCommentsResponseSchema = z.object({
  id: z.string(),
})

export const FetchAllPostsRequestSchema = z.object({
  platform: z.enum([
    'bilibili',
    'douyin',
    'facebook',
    'wxGzh',
    'instagram',
    'KWAI',
    'pinterest',
    'threads',
    'tiktok',
    'twitter',
    'xhs',
    'youtube',
  ]).describe('平台'),
  userId: z.string().optional().describe('userId, account表中的userId字段'),
  uid: z.string().optional().describe('userId, account表中的uid字段'),
  range: z.object({
    start: z.string().describe('开始时间，ISO格式'),
    end: z.string().describe('结束时间，ISO格式'),
  }).optional().describe('数据查询时间范围，默认查询所有'),
})

export class FetchPostCommentsRequestDto extends createZodDto(FetchPostCommentsSchema) {}
export class FetchPostCommentsResponseDto extends createZodDto(FetchPostCommentsResponseSchema) {}
export class FetchCommentRepliesDto extends createZodDto(FetchCommentRepliesSchema) {}
export class PublishCommentRequestDto extends createZodDto(PublishCommentRequestSchema) {}
export class PublishCommentReplyRequestDto extends createZodDto(publishCommentReplyRequestSchema) {}
export class PublishCommentResponseDto extends createZodDto(PublishCommentResponseSchema) {}
export class KeysetPagination extends createZodDto(KeysetPaginationSchema) {}
export class OffsetPagination extends createZodDto(OffsetPaginationSchema) {}
export class FetchPostsRequestDto extends createZodDto(FetchPostsRequestSchema) { }
export class ReplyToCommentsDto extends createZodDto(ReplyToCommentsSchema) {}
export class AIGenCommentDto extends createZodDto(AIGenCommentSchema) {}
export class FetchMetaPostsRequestDto extends createZodDto(FetchMetaPostsRequestSchema) {}

export class PostVo extends createZodDto(PostSchema) { }
export class FetchPostsResponseVo extends createZodDto(FetchPostsResponseSchema) { }
export class AIGenCommentResponseVo extends createZodDto(AIGenCommentResponseSchema) {}
export class ReplyToCommentsResponseVo extends createZodDto(ReplyToCommentsResponseSchema) {}
export class FetchAllPostsRequestDto extends createZodDto(FetchAllPostsRequestSchema) {}

// Like / Unlike
export const LikePostRequestSchema = z.object({
  accountId: z.string({ message: 'accountId is required' }).describe('account列表中的account字段'),
  platform: z.enum(['facebook']).describe('平台，仅支持facebook'),
  postId: z.string({ message: 'Post ID is required' }).describe('作品ID'),
})

export const LikePostResponseSchema = z.object({
  success: z.boolean().describe('是否成功'),
})

export class LikePostRequestDto extends createZodDto(LikePostRequestSchema) {}
export class LikePostResponseDto extends createZodDto(LikePostResponseSchema) {}
