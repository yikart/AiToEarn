/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from '@yikart/common'
import { Expose } from 'class-transformer'
import { IsEmail, IsString } from 'class-validator'
import z from 'zod'

export class MailLoginDto {
  @ApiProperty({ title: '邮箱', required: true })
  @IsEmail({}, { message: '邮箱' })
  @Expose()
  readonly mail: string

  @ApiProperty({ required: true })
  @IsString({ message: '密码' })
  @Expose()
  readonly password: string
}

export class MailRegistUrlDto {
  @ApiProperty({ title: '邮箱', required: true })
  @IsEmail({}, { message: '邮箱' })
  @Expose()
  readonly mail: string

  @ApiProperty({ required: true })
  @IsString({ message: '验证码' })
  @Expose()
  readonly code: string
}

export const RegistByMailSchema = z.object({
  mail: z.email().describe('邮箱'),
  code: z.string().describe('验证码'),
  password: z.string().describe('密码'),
  inviteCode: z.string().describe('邀请码').optional(),
})
export class RegistByMailDto extends createZodDto(RegistByMailSchema) {}

export class MailRepasswordDto {
  @ApiProperty({ title: '邮箱', required: true })
  @IsEmail({}, { message: '邮箱' })
  @Expose()
  readonly mail: string
}

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google客户端ID' })
  @IsString()
  @Expose()
  clientId: string

  @ApiProperty({ description: 'Google认证凭证' })
  @IsString()
  @Expose()
  credential: string
}

export class UserCancelDto {
  @ApiProperty({ required: true })
  @IsString({ message: '验证码' })
  @Expose()
  readonly code: string
}
