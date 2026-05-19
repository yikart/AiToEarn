import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const GoogleBusinessAuthUrlVoSchema = z.object({
  url: z.string().url().describe('Google Business 授权地址'),
  state: z.string().describe('授权状态码'),
})

export const GoogleBusinessAuthStatusVoSchema = z.object({
  state: z.string().describe('授权状态码'),
  userId: z.string().describe('用户 ID'),
  status: z.union([z.literal(0), z.literal(1)]).describe('授权状态，0 处理中，1 已完成'),
  accountId: z.string().optional().describe('授权完成后的账号 ID'),
  callbackUrl: z.string().optional().describe('回调地址'),
  callbackMethod: z.enum(['GET', 'POST']).optional().describe('回调方式'),
})

export class GoogleBusinessAuthUrlVo extends createZodDto(GoogleBusinessAuthUrlVoSchema, 'GoogleBusinessAuthUrlVo') {}
export class GoogleBusinessAuthStatusVo extends createZodDto(GoogleBusinessAuthStatusVoSchema, 'GoogleBusinessAuthStatusVo') {}
