import { CloudSpaceRegion, CloudSpaceStatus, createPaginationVo, createZodDto } from '@yikart/common'
import z from 'zod'

// 浏览器环境VO
export const cloudSpaceVoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  region: z.enum(CloudSpaceRegion),
  status: z.enum(CloudSpaceStatus),
  ip: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  remoteUrl: z.string().optional(),
})

export class CloudSpaceVo extends createZodDto(cloudSpaceVoSchema, 'CloudSpaceVo') {}

// 环境列表分页VO
export class CloudSpaceListVo extends createPaginationVo(cloudSpaceVoSchema, 'CloudSpaceListVo') {}
