import { createPaginationVo, createZodDto } from '@yikart/common'
import z from 'zod'

// Multilogin账号VO
export const multiloginAccountVoSchema = z.object({
  id: z.string(),
  email: z.string(),
  maxProfiles: z.number(),
  currentProfiles: z.number(),
  token: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export class MultiloginAccountVo extends createZodDto(multiloginAccountVoSchema, 'MultiloginAccountVo') {}

// 账号列表分页VO
export class MultiloginAccountListVo extends createPaginationVo(multiloginAccountVoSchema, 'MultiloginAccountListVo') {}
