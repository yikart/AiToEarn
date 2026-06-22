import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const SelectedAccountIdentitySchema = z.object({
  platformUid: z.string().min(1).describe('平台账号 UID'),
  account: z.string().min(1).optional().describe('平台账号补充唯一标识'),
})

export const StartAuthQuerySchema = z.object({
  callbackUrl: z.url({ protocol: /^https?$/, hostname: z.regexes.hostname }).optional().describe('授权完成后浏览器 POST relay 的回调地址'),
  redirectUri: z.httpUrl().optional().describe('授权完成后浏览器跳转地址'),
  groupId: z.string().optional().describe('账号组 ID，不传则使用默认组'),
})

export class StartAuthQueryDto extends createZodDto(StartAuthQuerySchema) {}

export const AuthCallbackQuerySchema = z.object({
  code: z.string().optional().describe('OAuth 授权码'),
  state: z.string().optional().describe('OAuth state'),
  error: z.string().optional().describe('OAuth 错误码'),
  error_description: z.string().optional().describe('OAuth 错误说明'),
  token: z.string().optional().describe('抖音小程序登录 code'),
  nickname: z.string().optional().describe('抖音小程序昵称'),
  avatar: z.string().optional().describe('抖音小程序头像 URL'),
}).describe('平台 OAuth callback 查询参数')

export class AuthCallbackQueryDto extends createZodDto(AuthCallbackQuerySchema) {}

export const AuthCallbackBodySchema = AuthCallbackQuerySchema.extend({
  tickets: z.record(z.string(), z.string()).optional().describe('抖音小程序授权 ticket'),
}).describe('平台 OAuth callback 请求体')

export class AuthCallbackBodyDto extends createZodDto(AuthCallbackBodySchema) {}

export const SubmitAuthSelectionsSchema = z.object({
  accounts: z.array(SelectedAccountIdentitySchema).describe('选中的平台账号身份'),
})

export class SubmitAuthSelectionsDto extends createZodDto(SubmitAuthSelectionsSchema) {}
