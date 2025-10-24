import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { PublishType } from '../../../libs/database/schema/publishTask.schema'

export const CreatePublishingTaskSchema = z.object({
  accounts: z.array(z.string()).describe('账户ID数组').optional(),
  mediaType: z.enum(PublishType).describe('类型'),
  title: z.string().nullish().describe('标题'),
  desc: z.string().nullish().describe('内容'),
  videoUrl: z.string().nullish().describe('视频链接'),
  coverUrl: z.string().nullish().describe('封面链接'),
  imgUrlList: z.string().nullish().describe('图片链接数组，逗号分隔'),
  publishingTime: z.string().nullish().describe('发布时间，格式：YYYY-MM-DD HH:mm:ss'),
  topics: z.string(),
})

export const CreatePublishSchema = z.object({
  flowId: z.string().describe('流水ID').nullable().optional().transform(val => !val ? undefined : val),
  accountId: z.string().describe('账户ID'),
  type: z.enum(PublishType).describe('类型'),
  title: z.string().nullable().optional().transform(val => !val ? undefined : val),
  desc: z.string().nullable().optional().transform(val => !val ? undefined : val),
  videoUrl: z.string().nullable().optional().transform(val => !val ? undefined : val),
  coverUrl: z.string().nullable().optional().transform(val => !val ? undefined : val),
  imgUrlList: z.string().nullable().optional().transform(val => !val ? undefined : val),
  publishTime: z.string().nullable().optional().transform(val => !val ? undefined : val),
  topics: z.string(),
})

export class CreatePublishDto extends createZodDto(CreatePublishSchema) {}
export class CreatePublishingTaskDto extends createZodDto(CreatePublishingTaskSchema) {}
