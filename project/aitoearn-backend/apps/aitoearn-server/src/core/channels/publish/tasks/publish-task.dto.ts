import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { PublishUpdateDataSchema } from './publish-update.schema'

export const UpdatePublishAtBodySchema = z.object({
  publishAt: z.coerce.date().describe('目标发布时间'),
})

export class UpdatePublishAtBodyDto extends createZodDto(UpdatePublishAtBodySchema) {}

export const UpdatePublishedBodySchema = PublishUpdateDataSchema.describe('已发布内容更新数据')

export class UpdatePublishedBodyDto extends createZodDto(UpdatePublishedBodySchema) {}
