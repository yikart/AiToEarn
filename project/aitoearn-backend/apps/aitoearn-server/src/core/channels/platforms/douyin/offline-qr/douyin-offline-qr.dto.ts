import { createZodDto } from '@yikart/common'
import { PublishRecordSource } from '@yikart/mongodb'
import { z } from 'zod'
import { PublishContentInputSchema } from '../../../publish/schemas/publish-content.schema'
import { DouyinOptionSchema } from '../douyin.schema'

export const CreateDouyinOfflineQrPublishSchema = z.object({
  materialGroupId: z.string().min(1).describe('素材组 ID'),
  materialId: z.string().min(1).describe('素材 ID'),
  content: PublishContentInputSchema.describe('发布内容'),
  option: DouyinOptionSchema.optional().describe('抖音发布选项'),
  source: z.enum([PublishRecordSource.OfflineQr, PublishRecordSource.Web]).optional().describe('发布来源'),
})

export class CreateDouyinOfflineQrPublishDto extends createZodDto(
  CreateDouyinOfflineQrPublishSchema,
  'CreateDouyinOfflineQrPublishDto',
) {}
