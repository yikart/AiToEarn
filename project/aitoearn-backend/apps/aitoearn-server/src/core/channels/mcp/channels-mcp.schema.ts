import { AccountType } from '@yikart/common'
import { PublishRecordSource, PublishStatus, PublishType } from '@yikart/mongodb'
import { z } from 'zod'
import { ChannelPaginationInputWithDefaultSchema } from '../platforms/platform-pagination.dto'
import { ChannelEngagementFunctionName } from '../platforms/platforms.interface'
import { CreatePublishFlowSchema, PublishFlowContextSchema } from '../publish/flows/publish-flow.dto'
import { PublishUpdateDataSchema } from '../publish/tasks/publish-update.schema'

export const CreateChannelPublishFlowSchema = CreatePublishFlowSchema.extend({
  context: PublishFlowContextSchema.omit({ source: true }).optional().describe('外部业务关联，source 固定为 MCP'),
})
export type CreateChannelPublishFlowParams = z.infer<typeof CreateChannelPublishFlowSchema>

const PublishTimeRangeSchema = z
  .array(z.coerce.date())
  .length(2)
  .transform(value => value as [Date, Date])
  .describe('发布时间范围')

export const ListChannelPublishRecordsSchema = z.object({
  accountId: z.string().optional().describe('账号 ID'),
  accountType: z.enum(AccountType).optional().describe('账号平台'),
  flowId: z.string().optional().describe('发布 flow ID'),
  source: z.enum(PublishRecordSource).optional().describe('发布来源'),
  status: z.coerce.number().pipe(z.enum(PublishStatus)).optional().describe('发布状态'),
  type: z.enum(PublishType).optional().describe('发布类型'),
  time: PublishTimeRangeSchema.optional(),
  uid: z.string().optional().describe('平台账号 UID'),
})
export type ListChannelPublishRecordsParams = z.infer<typeof ListChannelPublishRecordsSchema>

export const GetChannelPublishRecordByRecordIdSchema = z.object({
  recordId: z.string().min(1).describe('发布记录 ID'),
})
export type GetChannelPublishRecordByRecordIdParams = z.infer<typeof GetChannelPublishRecordByRecordIdSchema>

export const GetChannelPublishRecordByTaskIdSchema = z.object({
  taskId: z.string().min(1).describe('发布任务 ID'),
})
export type GetChannelPublishRecordByTaskIdParams = z.infer<typeof GetChannelPublishRecordByTaskIdSchema>

export const GetChannelPublishRecordByFlowIdSchema = z.object({
  flowId: z.string().min(1).describe('发布 flow ID'),
})
export type GetChannelPublishRecordByFlowIdParams = z.infer<typeof GetChannelPublishRecordByFlowIdSchema>

export const ChannelPublishTaskSchema = z.object({
  taskId: z.string().min(1).describe('发布任务 ID'),
})
export type ChannelPublishTaskParams = z.infer<typeof ChannelPublishTaskSchema>

export const UpdateChannelPublishAtSchema = ChannelPublishTaskSchema.extend({
  publishAt: z.coerce.date().describe('目标发布时间'),
})
export type UpdateChannelPublishAtParams = z.infer<typeof UpdateChannelPublishAtSchema>

export const RequestChannelPublishUpdateSchema = ChannelPublishTaskSchema.extend({
  data: PublishUpdateDataSchema.describe('新版发布更新数据'),
})
export type RequestChannelPublishUpdateParams = z.infer<typeof RequestChannelPublishUpdateSchema>

export const ChannelPlatformSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
})
export type ChannelPlatformParams = z.infer<typeof ChannelPlatformSchema>

export const ListBilibiliChannelPlatformCategoriesSchema = z.object({
  accountId: z.string().min(1).describe('Bilibili 账号 ID'),
})
export type ListBilibiliChannelPlatformCategoriesParams = z.infer<typeof ListBilibiliChannelPlatformCategoriesSchema>

export const ListYoutubeChannelPlatformCategoriesSchema = z.object({
  accountId: z.string().min(1).describe('YouTube 账号 ID'),
  id: z.string().optional().describe('YouTube 分类 ID'),
  regionCode: z.string().default('US').describe('YouTube 地区代码'),
})
export type ListYoutubeChannelPlatformCategoriesParams = z.infer<typeof ListYoutubeChannelPlatformCategoriesSchema>

export const ChannelWorkAccountSchema = z.object({
  accountId: z.string().min(1).optional().describe('账号 ID'),
  platform: z.enum(AccountType).describe('平台'),
})
export type ChannelWorkAccountParams = z.infer<typeof ChannelWorkAccountSchema>

export const GetChannelWorkLinkInfoSchema = ChannelWorkAccountSchema.extend({
  link: z.string().min(1).describe('作品链接'),
})
export type GetChannelWorkLinkInfoParams = z.infer<typeof GetChannelWorkLinkInfoSchema>

export const ChannelWorkSchema = ChannelWorkAccountSchema.extend({
  platformWorkId: z.string().min(1).describe('平台作品 ID'),
})
export type ChannelWorkParams = z.infer<typeof ChannelWorkSchema>

export const ListChannelWorksSchema = z.object({
  accountId: z.string().min(1).describe('账号 ID'),
  platform: z.enum(AccountType).describe('平台'),
  pagination: ChannelPaginationInputWithDefaultSchema.describe('分页参数'),
})
export type ListChannelWorksParams = z.infer<typeof ListChannelWorksSchema>

export const GetChannelAccountAnalyticsSchema = z.object({
  accountId: z.string().min(1).describe('账号 ID'),
  since: z.coerce.date().optional().describe('开始时间'),
  until: z.coerce.date().optional().describe('结束时间'),
})
export type GetChannelAccountAnalyticsParams = z.infer<typeof GetChannelAccountAnalyticsSchema>

export const VerifyChannelWorkOwnershipSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  platformWorkId: z.string().min(1).describe('平台作品 ID'),
  candidateAccountId: z.string().min(1).describe('候选账号 ID'),
})
export type VerifyChannelWorkOwnershipParams = z.infer<typeof VerifyChannelWorkOwnershipSchema>

export const ListChannelEngagementCommentsSchema = z.object({
  accountId: z.string().min(1).describe('账号 ID'),
  platform: z.enum(AccountType).describe('平台'),
  platformWorkId: z.string().min(1).describe('平台作品 ID'),
  pagination: ChannelPaginationInputWithDefaultSchema.describe('分页参数'),
})
export type ListChannelEngagementCommentsParams = z.infer<typeof ListChannelEngagementCommentsSchema>

export const SubmitChannelEngagementCommentSchema = z.object({
  accountId: z.string().min(1).describe('账号 ID'),
  platform: z.enum(AccountType).describe('平台'),
  platformWorkId: z.string().min(1).describe('平台作品 ID'),
  content: z.string().min(1).describe('评论内容'),
  parentCommentId: z.string().optional().describe('父评论 ID'),
})
export type SubmitChannelEngagementCommentParams = z.infer<typeof SubmitChannelEngagementCommentSchema>

export const CallChannelEngagementFunctionSchema = z.object({
  accountId: z.string().min(1).describe('动作执行账号 ID'),
  platform: z.enum(AccountType).describe('平台'),
  name: z.enum(ChannelEngagementFunctionName).describe('互动函数名称'),
  data: z.record(z.string(), z.unknown()).describe('函数参数：delete_comment/hide_reply/unhide_reply 传 commentId；work 动作传 platformWorkId；quote 额外传 content；follow/unfollow 传 targetPlatformUid'),
})
export type CallChannelEngagementFunctionParams = z.infer<typeof CallChannelEngagementFunctionSchema>
