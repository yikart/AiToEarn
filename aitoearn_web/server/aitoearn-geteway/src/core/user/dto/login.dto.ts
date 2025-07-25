/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsEmail, IsOptional, IsString } from 'class-validator'

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

export class GetRegistByMailBackDto {
  @ApiProperty({ required: true })
  @IsString({ message: '验证码' })
  @Expose()
  readonly code: string

  @ApiProperty({ title: '邮箱', required: true })
  @IsEmail({}, { message: '邮箱' })
  @Expose()
  readonly mail: string

  @ApiProperty({ required: true })
  @IsString({ message: '密码' })
  @Expose()
  readonly password: string

  @ApiProperty({ required: false })
  @IsString({ message: '邀请码' })
  @IsOptional()
  @Expose()
  readonly inviteCode?: string
}

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
