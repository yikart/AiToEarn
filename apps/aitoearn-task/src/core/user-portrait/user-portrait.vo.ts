import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const userPortraitVoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  contentTags: z.record(z.string(), z.number()),
  totalFollowers: z.number(),
  totalWorks: z.number(),
  totalViews: z.number(),
  totalLikes: z.number(),
  totalCollects: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export class UserPortraitVo extends createZodDto(userPortraitVoSchema) {}

export const userPortraitListVoSchema = z.object({
  list: z.array(userPortraitVoSchema),
  total: z.number(),
})

export class UserPortraitListVo extends createZodDto(userPortraitListVoSchema) {}
