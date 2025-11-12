import { createZodDto, KeysetPaginationSchema, OffsetPaginationSchema } from '@yikart/common'
import { z } from 'zod'

export const fetchPostsRequestSchema = z.object({
  accountId: z.string({ message: 'accountId is required' }).describe('账号ID'),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest'], { message: 'platform is required' }).describe('平台'),
  after: z.string().nullish().describe('后一页游标'),
  before: z.string().nullish().describe('前一页游标'),
  pagination: z.union([KeysetPaginationSchema, OffsetPaginationSchema]).nullish().describe('分页参数'),
})

export const fetchPostCommentsRequestSchema = z.object({
  accountId: z.string({ message: 'accountId is required' }).describe('账号ID'),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest'], { message: 'platform is required' }).describe('平台'),
  postId: z.string().describe('作品ID'),
  pagination: z.union([KeysetPaginationSchema, OffsetPaginationSchema]).nullish().describe('分页参数'),
})

export const fetchCommentRepliesSchema = z.object({
  accountId: z.string({ message: 'accountId is required' }).describe('账号ID'),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest'], { message: 'platform is required' }).describe('平台'),
  commentId: z.string().describe('评论ID'),
  pagination: z.union([KeysetPaginationSchema, OffsetPaginationSchema]).nullish().describe('分页参数'),
})

export const PublishCommentRequestSchema = z.object({
  accountId: z.string().describe('账号ID'),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest'], { message: 'platform is required' }).describe('平台'),
  postId: z.string().describe('作品ID'),
  message: z.string().min(1).max(500).describe('评论内容, 最大500字符'),
})

export const publishCommentReplyRequestSchema = z.object({
  accountId: z.string().describe('账号ID'),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest'], { message: 'platform is required' }).describe('平台'),
  commentId: z.string().describe('评论ID'),
  message: z.string().min(1).max(500).describe('评论内容, 最大500字符'),
})

export const AIGenCommentConfigSchema = z.object({
  accountId: z.string().describe('账号ID'),
  prompt: z.string().min(1).max(500).describe('提示语, 最大500字符'),
  maxTokens: z.number().min(10).max(1000).nullish().default(100).describe('AI生成内容的最大长度, 默认100'),
  temperature: z.number().min(0).max(1).nullish().default(0.7).describe('AI生成内容的随机性, 0-1之间, 默认0.7'),
  model: z.string().describe('AI模型名称, 例如:gpt-3.5-turbo, gpt-4'),
})

export const CommentSchema = z.object({
  id: z.string(),
  comment: z.string(),
})

export const ReplyToCommentsSchema = z.object({
  accountId: z.string().describe('账号ID'),
  userId: z.string().describe('用户ID'),
  postId: z.string().describe('作品ID'),
  prompt: z.string().min(1).max(500).optional().describe('提示语, 最大500字符'),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest']).describe('平台'),
  model: z.string().describe('AI模型名称, 例如:gpt-3.5-turbo, gpt-4'),
  comments: z.array(CommentSchema).optional().describe('评论列表'),
})

export const AIGenCommentSchema = z.object({
  userId: z.string().describe('用户ID'),
  model: z.string().describe('AI模型名称, 例如:gpt-3.5-turbo, gpt-4'),
  prompt: z.string().max(500).optional().describe('提示语, 最大500字符'),
  comments: z.array(CommentSchema).describe('评论列表'),
})

export class FetchPostsRequest extends createZodDto(fetchPostsRequestSchema) {}
export class FetchPostCommentsRequest extends createZodDto(fetchPostCommentsRequestSchema) {}
export class FetchCommentRepliesRequest extends createZodDto(fetchCommentRepliesSchema) {}
export class KeysetPagination extends createZodDto(KeysetPaginationSchema) {}
export class OffsetPagination extends createZodDto(OffsetPaginationSchema) {}
export class PublishCommentRequest extends createZodDto(PublishCommentRequestSchema) {}
export class PublishCommentReplyRequest extends createZodDto(publishCommentReplyRequestSchema) {}
export class AIGenCommentConfig extends createZodDto(AIGenCommentConfigSchema) {}
export class Comment extends createZodDto(CommentSchema) {}
export class ReplyToCommentsDto extends createZodDto(ReplyToCommentsSchema) {}
export class AIGenCommentDto extends createZodDto(AIGenCommentSchema) {}
