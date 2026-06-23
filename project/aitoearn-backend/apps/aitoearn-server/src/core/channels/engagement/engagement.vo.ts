import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'
import { ChannelPaginationResultVoSchema } from '../platforms/platform-pagination.vo'
import { ChannelEngagementActionType, ChannelEngagementTargetType } from '../platforms/platforms.interface'

export const ChannelCommentVoSchema = z.object({
  platformCommentId: z.string().describe('平台评论 ID'),
  platformWorkId: z.string().optional().describe('平台作品 ID'),
  parentCommentId: z.string().optional().describe('父评论 ID'),
  authorName: z.string().optional().describe('评论作者名称'),
  authorPlatformUid: z.string().optional().describe('评论作者平台 UID'),
  content: z.string().describe('评论内容'),
  createdAt: z.coerce.date().optional().describe('评论时间'),
  likeCount: z.number().int().nonnegative().optional().describe('点赞数'),
  replyCount: z.number().int().nonnegative().optional().describe('回复数'),
})

export const ChannelCommentListVoSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  items: z.array(ChannelCommentVoSchema).describe('评论列表'),
  pagination: ChannelPaginationResultVoSchema.describe('分页结果'),
})

export class ChannelCommentListVo extends createZodDto(
  ChannelCommentListVoSchema,
  'ChannelCommentListVo',
) {}

export const ChannelEngagementActionVoSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  actionType: z.enum(ChannelEngagementActionType).describe('互动动作类型'),
  targetType: z.enum(ChannelEngagementTargetType).describe('互动目标类型'),
  targetId: z.string().describe('互动目标 ID'),
  platformActionId: z.string().optional().describe('平台返回的动作 ID'),
  success: z.boolean().describe('操作是否成功'),
  createdAt: z.coerce.date().optional().describe('动作创建时间'),
})

export class ChannelEngagementActionVo extends createZodDto(
  ChannelEngagementActionVoSchema,
  'ChannelEngagementActionVo',
) {}
