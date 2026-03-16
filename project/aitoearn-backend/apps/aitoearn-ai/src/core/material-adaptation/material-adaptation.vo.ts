import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { PlatformOptionsSchema } from './material-adaptation.dto'

export const MaterialAdaptationVoSchema = z.object({
  id: z.string().describe('适配记录 ID'),
  materialId: z.string().describe('素材 ID'),
  platform: z.string().describe('目标平台'),
  title: z.string().optional().describe('平台标题'),
  desc: z.string().optional().describe('平台描述'),
  topics: z.array(z.string()).describe('话题标签'),
  platformOptions: PlatformOptionsSchema.optional().describe('平台发布配置'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class MaterialAdaptationVo extends createZodDto(
  MaterialAdaptationVoSchema,
  'MaterialAdaptationVo',
) {}
