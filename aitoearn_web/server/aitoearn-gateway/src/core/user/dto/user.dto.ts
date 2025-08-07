/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { GenderEnum } from 'src/common/enums/all.enum'
import { UserVipCycleType } from 'src/transports/user/comment'

export class ChangePasswordDto {
  @IsString({ message: '密码' })
  @Expose()
  readonly password: string
}

export class UpdateUserInfoDto {
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

export class UpdateVipInfoDto {
  @ApiProperty({
    description: '充值时间周期类型',
    enum: UserVipCycleType,
    required: true,
  })
  @IsEnum(UserVipCycleType, { message: '充值时间周期类型' })
  @Type(() => Number)
  @Expose()
  readonly cycleType: UserVipCycleType
}
