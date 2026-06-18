import { AccountType, ChannelAuthSessionStatus, createZodDto } from '@yikart/common'
import { z } from 'zod'
import { LocaleTextSchema } from '../platforms/platforms.vo'

export const AuthStartVoSchema = z.object({
  url: z.string().describe('平台授权 URL 或二维码图片 data URL'),
  sessionId: z.string().describe('授权 Session ID'),
  expiresAt: z.date().describe('授权 Session 过期时间'),
  authInstructions: LocaleTextSchema.optional().describe('授权操作提示语'),
})

export class AuthStartVo extends createZodDto(AuthStartVoSchema) {}

export const AuthConnectedAccountVoSchema = z.object({
  accountId: z.string().describe('本地账号 ID'),
  platform: z.enum(AccountType).describe('平台类型'),
  platformUid: z.string().describe('平台账号 UID'),
  account: z.string().optional().describe('平台账号补充唯一标识'),
  displayName: z.string().describe('平台账号展示名'),
  avatarUrl: z.string().optional().describe('平台账号头像 URL'),
})

export const AuthSelectableAccountVoSchema = z.object({
  platform: z.enum(AccountType).describe('平台类型'),
  platformUid: z.string().describe('平台账号 UID'),
  account: z.string().optional().describe('平台账号补充唯一标识'),
  displayName: z.string().describe('平台账号展示名'),
  avatarUrl: z.string().optional().describe('平台账号头像 URL'),
  parentPlatformUid: z.string().optional().describe('父级平台账号 UID'),
})

export const AuthSessionStatusVoSchema = z.object({
  sessionId: z.string().describe('授权 Session ID'),
  status: z.enum(ChannelAuthSessionStatus).describe('授权 Session 状态'),
  requiresSelection: z.boolean().describe('是否需要选择二级账号'),
  errorCode: z.number().optional().describe('授权失败错误码'),
  expiresAt: z.date().optional().describe('授权 Session 过期时间'),
  accountId: z.string().optional().describe('首个本地账号 ID'),
  accountIds: z.array(z.string()).optional().describe('本地账号 ID 列表'),
  accounts: z.array(AuthConnectedAccountVoSchema).optional().describe('已连接账号列表'),
  selectableAccounts: z.array(AuthSelectableAccountVoSchema).optional().describe('可选择的平台账号列表'),
})

export class AuthSessionStatusVo extends createZodDto(
  AuthSessionStatusVoSchema,
  'AuthSessionStatusVo',
) {}
