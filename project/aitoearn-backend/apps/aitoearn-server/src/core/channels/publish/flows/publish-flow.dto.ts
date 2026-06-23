import type { AccountType } from '@yikart/common'
import type { PublishContentInput, PublishContentOverride } from '../schemas/publish-content.schema'
import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { PublishRecordSource } from '@yikart/mongodb'
import { z } from 'zod'
import { createPlatformPublishOptionItemSchema } from '../../platforms/publish.schema'
import { PublishContentInputSchema, PublishContentOverrideSchema } from '../schemas/publish-content.schema'

const PublishFlowItemSchema = createPlatformPublishOptionItemSchema({
  accountId: z.string().describe('账号 ID'),
  overrides: PublishContentOverrideSchema.optional().describe('平台覆盖内容'),
})

export const PublishFlowContextSchema = z.object({
  taskId: z.string().optional().describe('外部任务 ID'),
  materialGroupId: z.string().optional().describe('素材组 ID'),
  materialId: z.string().optional().describe('素材 ID'),
  source: z.enum(PublishRecordSource).optional().describe('发布来源'),
})

export const CreatePublishFlowSchema = z.object({
  flowId: z.string().optional().describe('外部流水 ID'),
  content: PublishContentInputSchema.describe('跨平台共享内容'),
  publishAt: z.coerce.date().describe('目标发布时间'),
  context: PublishFlowContextSchema.optional().describe('外部业务关联'),
  items: z.array(PublishFlowItemSchema).min(1).describe('平台发布项'),
})

export class CreatePublishFlowDto extends createZodDto(CreatePublishFlowSchema) {}

export interface CreatePublishFlowCommand {
  flowId?: string
  content: PublishContentInput
  publishAt: Date
  context?: z.infer<typeof PublishFlowContextSchema>
  items: Array<{
    accountId: string
    platform: AccountType
    option?: Record<string, unknown>
    overrides?: PublishContentOverride
  }>
}

export const PublishFlowQuerySchema = PaginationDtoSchema.extend({
  userId: z.string().optional().describe('用户 ID'),
  status: z.string().optional().describe('状态筛选'),
})

export class PublishFlowQueryDto extends createZodDto(PublishFlowQuerySchema) {}
