import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { TableDto } from '@/common/dto/table.dto'
/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { AccountStatus, AccountType } from '@/libs'

export class AccountIdDto {
  @IsString({ message: '账号ID' })
  @Expose()
  readonly accountId: string
}

export class UserIdDto {
  @IsString({ message: '用户ID' })
  @Expose()
  readonly userId: string
}

export class CreateAccountDto extends UserIdDto {
  @ApiProperty({ description: '平台类型', enum: AccountType })
  @IsEnum(AccountType)
  @Expose()
  type: AccountType

  @ApiProperty({ description: '登录Cookie' })
  @IsOptional()
  @IsString()
  @Expose()
  loginCookie?: string

  @ApiProperty({ description: 'refresh_token' })
  @IsOptional()
  @IsString()
  @Expose()
  refresh_token?: string

  @ApiProperty({ description: 'access_token' })
  @IsOptional()
  @IsString()
  @Expose()
  access_token?: string

  @ApiProperty({ description: '登录时间' })
  @IsDate({ message: '登录时间不是有效的日期' })
  @Transform(({ value }) => {
    if (!value)
      return undefined
    return new Date(value)
  })
  @IsOptional()
  @Expose()
  loginTime?: Date

  @ApiProperty({ description: '平台用户ID' })
  @IsString()
  @Expose()
  uid: string

  @ApiProperty({ description: '账号' })
  @IsString()
  @Expose()
  account: string

  @ApiProperty({ description: '头像' })
  @IsString()
  @Expose()
  avatar: string

  @ApiProperty({ description: '昵称' })
  @IsString()
  @Expose()
  nickname: string

  @ApiProperty({ description: '粉丝数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  fansCount?: number

  @ApiProperty({ description: '阅读数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  readCount?: number

  @ApiProperty({ description: '点赞数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  likeCount?: number

  @ApiProperty({ description: '收藏数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  collectCount?: number

  @ApiProperty({ description: '转发数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  forwardCount?: number

  @ApiProperty({ description: '评论数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  commentCount?: number

  @ApiProperty({ description: '最后统计时间' })
  @IsDate({ message: '最后统计时间必须是有效的日期' })
  @Transform(({ value }) => {
    if (!value)
      return undefined
    return new Date(value)
  })
  @IsOptional()
  @Expose()
  lastStatsTime?: Date

  @ApiProperty({ description: '作品数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  workCount?: number

  @ApiProperty({ description: '收入' })
  @IsNumber()
  @IsOptional()
  @Expose()
  income?: number

  @ApiProperty({ description: '账户组ID' })
  @IsString({ message: '组ID必须是字符串' })
  @IsOptional()
  @Expose()
  groupId?: string

  @ApiProperty({ description: '频道ID' })
  @IsString({ message: '频道ID必须是字符串' })
  @IsOptional()
  @Expose()
  channelId?: string
}

class AddAccountIndexDto {
  @IsString({ message: '用户ID' })
  @Expose()
  readonly userId: string

  @IsEnum(AccountType, { message: '类型' })
  @Expose()
  readonly type: AccountType

  @IsString({ message: '平台账户/用户ID' })
  @Expose()
  readonly uid: string
}

export class AddAccountDto {
  @ValidateNested({ message: '账号信息' })
  @Type(() => AddAccountIndexDto)
  @Expose()
  readonly account: AddAccountIndexDto

  @ValidateNested()
  @Type(() => CreateAccountDto)
  @Expose()
  readonly data: CreateAccountDto
}

export class UpdateAccountInfoDto {
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

  @IsString({ message: '简介' })
  @IsOptional()
  @Expose()
  readonly desc?: string

  @IsString()
  @IsOptional()
  @Expose()
  groupId?: string
}

export class UpdateAccountStatusDto {
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string

  @IsEnum(AccountStatus, { message: '状态' })
  @Expose()
  readonly status: AccountStatus
}

export class GetAccountListByIdsDto extends UserIdDto {
  @ApiProperty({ description: '账户ID数组' })
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  ids: string[]
}

export class GetAccountStatisticsDto extends UserIdDto {
  @IsEnum(AccountType, { message: '类型' })
  @IsOptional()
  @Expose()
  readonly type?: AccountType
}

export class UpdateAccountStatisticsDto extends AccountIdDto {
  @ApiProperty({ description: '作品数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  workCount?: number

  @ApiProperty({ description: '粉丝数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  fansCount?: number

  @ApiProperty({ description: '阅读数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  readCount?: number

  @ApiProperty({ description: '点赞数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  likeCount?: number

  @ApiProperty({ description: '收藏数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  collectCount?: number

  @ApiProperty({ description: '评论数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  commentCount?: number

  @ApiProperty({ description: '收入' })
  @IsNumber()
  @IsOptional()
  @Expose()
  income?: number
}

export class DeleteUserAccountDto extends UserIdDto {
  @IsString({ message: '账号ID' })
  @Expose()
  readonly accountId: string
}

export class DeleteUserAccountsDto extends UserIdDto {
  @ApiProperty({ description: '账户ID数组' })
  @IsArray()
  @IsString({ each: true })
  @Expose()
  ids: string[]
}

export class AccountFilterDto {
  @IsString({ message: '用户ID' })
  @IsOptional()
  @Expose()
  readonly userId?: string

  @IsString({ message: '账号类型' })
  @IsOptional()
  @Expose()
  types?: string[]
}

export class AccountListDto {
  @ValidateNested()
  @Type(() => AccountFilterDto)
  @Expose()
  readonly filter: AccountFilterDto

  @ValidateNested()
  @Type(() => TableDto)
  @Expose()
  readonly page: TableDto
}

export class ListAccountByIdsDto {
  @ApiProperty({ description: '账户ID数组' })
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  ids: string[]
}
