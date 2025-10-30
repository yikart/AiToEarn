/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { createZodDto } from '@yikart/common'
import z from 'zod'

const MailLoginSchema = z.object({
  mail: z.string().email({ message: '邮箱' }),
  password: z.string({ message: '密码' }),
})

export class MailLoginDto extends createZodDto(MailLoginSchema) {}

const MailRegistUrlSchema = z.object({
  mail: z.string().email({ message: '邮箱' }),
})
export class MailRegistUrlDto extends createZodDto(MailRegistUrlSchema) {}

export const RegistByMailSchema = z.object({
  mail: z.string().email().describe('邮箱'),
  code: z.string().describe('验证码'),
  password: z.string().describe('密码'),
  inviteCode: z.string().describe('邀请码').optional(),
})
export class RegistByMailDto extends createZodDto(RegistByMailSchema) { }

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
