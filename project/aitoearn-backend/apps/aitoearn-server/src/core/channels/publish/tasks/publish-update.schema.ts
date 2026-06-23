import { z } from 'zod'
import { createPublishMediaOptionsSchema } from '../../platforms/publish-media-adaptation.schema'

export const PublishUpdateMediaSchema = z.object({
  url: z.string().min(1).describe('媒体 URL'),
  options: createPublishMediaOptionsSchema(),
})

export const PublishUpdateCoverSchema = z.object({
  url: z.string().min(1).describe('封面 URL'),
  options: createPublishMediaOptionsSchema(),
})

export const PublishUpdateContentSchema = z.object({
  title: z.string().optional().describe('更新后的标题'),
  body: z.string().optional().describe('更新后的正文'),
  media: z.array(PublishUpdateMediaSchema).optional().describe('更新后的媒体列表'),
  cover: z.union([PublishUpdateCoverSchema, z.null()]).optional().describe('更新后的封面，传 null 表示移除封面'),
})

export const PublishUpdateDataSchema = z.object({
  content: PublishUpdateContentSchema.optional().describe('更新后的发布内容'),
  option: z.record(z.string(), z.unknown()).optional().describe('更新后的平台选项'),
}).refine(data => data.content !== undefined || data.option !== undefined, {
  message: 'content or option is required',
})

export type PublishUpdateData = z.infer<typeof PublishUpdateDataSchema>
