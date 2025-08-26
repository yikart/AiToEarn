import { GenderEnum, UserStatus } from '@libs/database/schema'
/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator'

export class UserIdDto {
  @IsString({ message: '用户ID' })
  @Expose()
  readonly id: string
}

export class UserInfoDto extends UserIdDto {
  @IsBoolean({ message: '是否全部字段' })
  @IsOptional()
  @Expose()
  readonly all?: boolean
}

export class LoginByPasswordDto {
  @IsPhoneNumber('CN', { message: '手机号' })
  @Expose()
  readonly phone: string

  @IsString({ message: '密码' })
  @Expose()
  readonly password: string
}

export class ChangePasswordDto {
  @IsString({ message: '密码' })
  @Expose()
  readonly password: string
}

export class UpdateUserInfoDto {
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string

  @IsString({ message: '昵称' })
  @IsOptional()
  @Expose()
  readonly name?: string

  @IsString({ message: '头像' })
  @IsOptional()
  @Expose()
  avatar?: string

  @IsEnum(GenderEnum, { message: '性别' })
  @IsOptional()
  @Expose()
  readonly gender?: GenderEnum

  @IsString({ message: '简介' })
  @IsOptional()
  @Expose()
  readonly desc?: string
}

export class UpdateUserStatusDto {
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string

  @IsEnum(UserStatus, { message: '状态' })
  @Expose()
  readonly status: UserStatus
}

export class NewMailDto {
  @ApiProperty({ title: '邮箱', required: true })
  @IsEmail({}, { message: '邮箱' })
  @Expose()
  readonly mail: string

  @IsString({ message: '密码' })
  @Expose()
  readonly password: string

  @IsString({ message: '密码盐' })
  @Expose()
  readonly salt: string

  @IsString({ message: '邀请码' })
  @IsOptional()
  @Expose()
  readonly inviteCode?: string
}

export class UserMailDto {
  @IsEmail({}, { message: '邮箱' })
  @Expose()
  readonly mail: string

  @IsBoolean({ message: '是否全部字段' })
  @IsOptional()
  @Expose()
  readonly all?: boolean
}

export class MailLoginDto {
  @IsEmail({}, { message: '邮箱' })
  @Expose()
  readonly mail: string

  @IsString({ message: '密码' })
  @Expose()
  readonly password: string
}

export class MailRegistUrlDto {
  @IsEmail({}, { message: '邮箱' })
  @Expose()
  readonly mail: string

  @IsString({ message: '验证码' })
  @Expose()
  readonly code: string
}

export class GetRegistByMailBackDto {
  @IsString({ message: '验证码' })
  @Expose()
  readonly code: string

  @IsEmail({}, { message: '邮箱' })
  @Expose()
  readonly mail: string

  @IsString({ message: '密码' })
  @Expose()
  readonly password: string

  @IsString({ message: '邀请码' })
  @IsOptional()
  @Expose()
  readonly inviteCode?: string
}

export class MailRepasswordDto {
  @IsEmail({}, { message: '邮箱' })
  @Expose()
  readonly mail: string
}

export class UpdateUserPasswordDto {
  @IsString({ message: '用户ID' })
  @Expose()
  readonly id: string

  @IsString({ message: '密码' })
  @Expose()
  readonly password: string

  @IsString({ message: '盐' })
  @Expose()
  readonly salt: string
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

export class GetUserByPopularizeCodeDto {
  @IsString({ message: '推广码' })
  @Expose()
  readonly code: string
}
