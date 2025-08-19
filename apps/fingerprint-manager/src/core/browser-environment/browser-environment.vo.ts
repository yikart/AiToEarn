import { BrowserEnvironmentRegion, BrowserEnvironmentStatus, createPaginationVo, createZodDto } from '@aitoearn/common'
import z from 'zod'

// 浏览器环境VO
export const browserEnvironmentVoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  region: z.enum(BrowserEnvironmentRegion),
  status: z.enum(BrowserEnvironmentStatus),
  ip: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export class BrowserEnvironmentVo extends createZodDto(browserEnvironmentVoSchema, 'BrowserEnvironmentVo') {}

// 环境列表分页VO
export class BrowserEnvironmentListVo extends createPaginationVo(browserEnvironmentVoSchema, 'BrowserEnvironmentListVo') {}
