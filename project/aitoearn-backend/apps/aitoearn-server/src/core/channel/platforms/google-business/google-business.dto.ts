import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const GetAuthUrlSchema = z.object({
  callbackUrl: z.string().url().optional().describe('OAuth 完成后回调地址'),
  callbackMethod: z.enum(['GET', 'POST']).optional().describe('回调方式，默认 GET'),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema, 'GetAuthUrlDto') {}

export const GoogleBusinessAuthCallbackDtoSchema = z.object({
  code: z.string().describe('OAuth 授权码'),
  state: z.string().describe('状态码'),
})
export class GoogleBusinessAuthCallbackDto extends createZodDto(
  GoogleBusinessAuthCallbackDtoSchema,
  'GoogleBusinessAuthCallbackDto',
) {}

export const GoogleBusinessCredentialSchema = z.object({
  accessToken: z.string().describe('访问令牌'),
  refreshToken: z.string().describe('刷新令牌'),
  expiresAt: z.date().describe('过期时间'),
  accountId: z.string().describe('Google 账户 ID'),
  accountName: z.string().describe('账户名称'),
  locationId: z.string().describe('店铺 ID'),
  locationName: z.string().describe('店铺名称'),
  locationAddress: z.string().optional().describe('店铺地址'),
})
export type GoogleBusinessCredential = z.infer<typeof GoogleBusinessCredentialSchema>
