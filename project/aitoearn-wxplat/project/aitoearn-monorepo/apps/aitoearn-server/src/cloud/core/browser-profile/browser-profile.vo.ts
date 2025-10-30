import { createPaginationVo, createZodDto } from '@yikart/common'
import z from 'zod'

// 浏览器Profile VO
export const browserProfileVoSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  profileId: z.string(),
  cloudSpaceId: z.string().optional(),
  config: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export class BrowserProfileVo extends createZodDto(browserProfileVoSchema, 'BrowserProfileVo') {}

// Profile列表分页VO
export class BrowserProfileListVo extends createPaginationVo(browserProfileVoSchema, 'BrowserProfileListVo') {}
