import { ApiProperty, PartialType } from '@nestjs/swagger'
import { Expose, Transform } from 'class-transformer'
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'
import { AccountStatus, AccountType } from 'src/transports/account/comment'

export class CreateAccountDto {
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

  @ApiProperty({ description: '平台类型', enum: AccountType })
  @IsEnum(AccountType)
  @Expose()
  type: AccountType

  @ApiProperty({ description: '登录Cookie' })
  @IsString()
  @IsOptional()
  @Expose()
  loginCookie: string

  @ApiProperty({ description: '登录时间' })
  @IsDate()
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
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @ApiProperty({ description: '更新ID' })
  @IsString()
  @Expose()
  id: string
}

export class AccountIdDto {
  @ApiProperty({ description: '账号ID' })
  @IsString()
  @Expose()
  id: string
}

export class UpdateAccountStatusDto extends AccountIdDto {
  @ApiProperty({ description: '状态' })
  @IsEnum(AccountStatus, {
    message: `status must be one of these values: ${Object.values(
      AccountStatus,
    ).join(', ')}`,
  })
  @Expose()
  status: AccountStatus
}

export class AccountListByIdsDto {
  @ApiProperty({ description: '账号ID数组', type: [Number] })
  @IsArray()
  @IsString({ each: true })
  @Expose()
  ids: string[]
}

export class AccountStatisticsDto {
  @ApiProperty({ description: '账户类型', enum: AccountType, required: false })
  @IsEnum(AccountType)
  @IsOptional()
  @Expose()
  type?: AccountType
}

export class UpdateAccountStatisticsDto {
  @ApiProperty({ description: '账号ID' })
  @IsString()
  @Expose()
  id: string

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

export class DeleteAccountsDto {
  @ApiProperty({ description: '要删除的ID' })
  @IsArray()
  @IsString({ each: true })
  @Expose()
  ids: string[]
}
