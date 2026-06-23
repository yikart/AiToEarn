import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'
import { ChannelPaginationInputWithDefaultSchema } from '../platforms/platform-pagination.dto'
import { ChannelEngagementFunctionName } from '../platforms/platforms.interface'

export const EngagementExecutionQuerySchema = z.object({
  accountId: z.string().min(1).describe('动作执行账号 ID'),
})

export class EngagementExecutionQueryDto extends createZodDto(EngagementExecutionQuerySchema) {}

export const EngagementCommentsQuerySchema = EngagementExecutionQuerySchema.extend({
  platform: z.enum(AccountType).describe('平台'),
  platformWorkId: z.string().min(1).describe('平台作品 ID'),
  pagination: ChannelPaginationInputWithDefaultSchema.describe('分页参数'),
})

export class EngagementCommentsQueryDto extends createZodDto(EngagementCommentsQuerySchema) {}

export const CreateEngagementCommentBodySchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  platformWorkId: z.string().min(1).describe('平台作品 ID'),
  content: z.string().min(1).describe('评论内容'),
  parentCommentId: z.string().optional().describe('父评论 ID'),
})

export class CreateEngagementCommentBodyDto extends createZodDto(CreateEngagementCommentBodySchema) {}

export const DeleteEngagementCommentFunctionDataSchema = z.object({
  commentId: z.string().min(1).describe('评论 ID'),
})

export const EngagementCommentFunctionDataSchema = z.object({
  commentId: z.string().min(1).describe('评论或回复 ID'),
})

export const EngagementWorkFunctionDataSchema = z.object({
  platformWorkId: z.string().min(1).describe('平台作品 ID'),
})

export const QuoteEngagementWorkFunctionDataSchema = EngagementWorkFunctionDataSchema.extend({
  content: z.string().min(1).describe('引用发布内容'),
})

export const EngagementAccountFunctionDataSchema = z.object({
  targetPlatformUid: z.string().min(1).describe('目标平台账号 UID'),
})

export const CallEngagementFunctionBodySchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  name: z.enum(ChannelEngagementFunctionName).describe('互动函数名称'),
  data: z.record(z.string(), z.unknown()).describe('函数参数'),
})

export class CallEngagementFunctionBodyDto extends createZodDto(CallEngagementFunctionBodySchema) {}

export function getEngagementFunctionDataSchema(name: ChannelEngagementFunctionName): z.ZodTypeAny {
  switch (name) {
    case ChannelEngagementFunctionName.DeleteComment:
      return DeleteEngagementCommentFunctionDataSchema
    case ChannelEngagementFunctionName.HideReply:
    case ChannelEngagementFunctionName.UnhideReply:
      return EngagementCommentFunctionDataSchema
    case ChannelEngagementFunctionName.Like:
    case ChannelEngagementFunctionName.Unlike:
    case ChannelEngagementFunctionName.Repost:
    case ChannelEngagementFunctionName.UndoRepost:
    case ChannelEngagementFunctionName.Bookmark:
    case ChannelEngagementFunctionName.RemoveBookmark:
      return EngagementWorkFunctionDataSchema
    case ChannelEngagementFunctionName.Quote:
      return QuoteEngagementWorkFunctionDataSchema
    case ChannelEngagementFunctionName.Follow:
    case ChannelEngagementFunctionName.Unfollow:
      return EngagementAccountFunctionDataSchema
  }
}
