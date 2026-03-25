import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'

export const MaterialGroupVoSchema = z.object({
  id: z.string().describe('草稿箱 ID'),
  userId: z.string().describe('用户 ID'),
  name: z.string().describe('草稿箱名称'),
  desc: z.string().optional().describe('描述'),
  isDefault: z.boolean().describe('是否默认'),
  platforms: z.array(z.enum(AccountType)).default([]).describe('平台限制'),
  openAffiliate: z.boolean().optional().describe('是否开启推广'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})
export class MaterialGroupVo extends createZodDto(MaterialGroupVoSchema, 'MaterialGroupVo') {}
