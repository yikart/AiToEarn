/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { createZodDto } from '@yikart/common'
import z from 'zod'

const PhoneSchema = z.string().regex(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
const AccountSchema = z.string().refine(
  value => z.string().email().safeParse(value).success || PhoneSchema.safeParse(value).success,
  { message: '请输入有效的手机号或邮箱' },
)
const PasswordSchema = z.string().min(6, { message: '密码至少6位' }).max(64, { message: '密码最多64位' })

export const MailLoginSchema = z.object({
  mail: z.string().email().describe('邮箱'),
})

export class MailLoginDto extends createZodDto(MailLoginSchema, 'MailLoginDto') {}

export const MailVerifySchema = z.object({
  mail: z.string().email().describe('邮箱'),
  code: z.string().length(6, { message: '验证码为6位' }).describe('邮箱验证码'),
  inviteCode: z.string().describe('邀请码').optional(),
})

export class MailVerifyDto extends createZodDto(MailVerifySchema, 'MailVerifyDto') {}

export const MailRepasswordVerifySchema = z.object({
  mail: z.string().email().describe('邮箱'),
  code: z.string().describe('验证码'),
  password: z.string().describe('密码'),
})
export class MailRepasswordVerifyDto extends createZodDto(MailRepasswordVerifySchema, 'MailRepasswordVerifyDto') {}

const MailRepasswordSchema = z.object({
  mail: z.string().email({ message: '邮箱' }),
})
export class MailRepasswordDto extends createZodDto(MailRepasswordSchema) {}

const GoogleLoginSchema = z.object({
  clientId: z.string({ message: 'Google客户端ID' }),
  credential: z.string({ message: 'Google认证凭证' }),
})

export class GoogleLoginDto extends createZodDto(GoogleLoginSchema) {}

const UserCancelSchema = z.object({
  code: z.string({ message: '验证码' }),
})

export class UserCancelDto extends createZodDto(UserCancelSchema) {}

const PhoneLoginSchema = z.object({
  phone: PhoneSchema.describe('手机号'),
})
export class PhoneLoginDto extends createZodDto(PhoneLoginSchema) {}

const PhoneVerifySchema = z.object({
  phone: PhoneSchema.describe('手机号'),
  code: z.string().length(6, { message: '验证码为6位数字' }).describe('短信验证码'),
})
export class PhoneVerifyDto extends createZodDto(PhoneVerifySchema) {}

export const PasswordLoginSchema = z.object({
  account: AccountSchema.describe('手机号或邮箱'),
  password: PasswordSchema.describe('密码'),
})
export class PasswordLoginDto extends createZodDto(PasswordLoginSchema, 'PasswordLoginDto') {}

export const PasswordRegisterSchema = PasswordLoginSchema.extend({
  inviteCode: z.string().describe('邀请码').optional(),
})
export class PasswordRegisterDto extends createZodDto(PasswordRegisterSchema, 'PasswordRegisterDto') {}
