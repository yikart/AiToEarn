import { ApiProperty } from '@nestjs/swagger'
import { AccountType, createZodDto } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'
import { Expose } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'
import dayjs from 'dayjs'
import { z } from 'zod'

const CreateAccountSchema = z.object({
  refresh_token: z.string().min(1).optional(),
  access_token: z.string().min(1).optional(),
  type: z.enum(AccountType),
  loginCookie: z.string().min(1).optional(),
  loginTime: z.string().transform((val) => {
    if (!val)
      return undefined
    const parsed = dayjs(val)
    if (!parsed.isValid()) {
      throw new Error(`Invalid date format: ${val}. Expected ISO 8601 format (e.g., "2025-09-04T10:30:00.000Z")`)
    }
    return parsed.toDate()
  }).optional(),
  uid: z.string().min(1),
  account: z.string().min(1),
  avatar: z.string().optional(),
  nickname: z.string().min(1),
  fansCount: z.number().optional(),
  readCount: z.number().optional(),
  likeCount: z.number().optional(),
  collectCount: z.number().optional(),
  forwardCount: z.number().optional(),
  commentCount: z.number().optional(),
  lastStatsTime: z.string().transform((val) => {
    if (!val)
      return undefined
    const parsed = dayjs(val)
    if (!parsed.isValid()) {
      throw new Error(`Invalid date format: ${val}. Expected ISO 8601 format (e.g., "2025-09-04T10:30:00.000Z")`)
    }
    return parsed.toDate()
  }).optional(),
  workCount: z.number().optional(),
  income: z.number().optional(),
  groupId: z.string().optional(),
  _id: z.string().optional(),
})
export class CreateAccountDto extends createZodDto(
  CreateAccountSchema,
) {}

const UpdateAccountSchema = z.object({
  id: z.string({ message: 'ID' }),
  name: z.string({ message: '昵称' }).optional(),
  avatar: z.string({ message: '头像' }).optional(),
  desc: z.string({ message: '简介' }).optional(),
  groupId: z.string().optional(),
})
export class UpdateAccountDto extends createZodDto(
  UpdateAccountSchema,
) {}

const AccountIdSchema = z.object({
  id: z.string({ message: 'ID' }),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) {}

export const UpdateAccountStatusSchema = AccountIdSchema.merge(
  z.object({
    status: z.enum(AccountStatus),
  }),
)
export class UpdateAccountStatusDto extends createZodDto(
  UpdateAccountStatusSchema,
) {}

const AccountListByIdsSchema = z.object({
  ids: z.array(z.string()).describe('账号ID数组'),
})
export class AccountListByIdsDto extends createZodDto(AccountListByIdsSchema) {}

const AccountStatisticsSchema = z.object({
  type: z.enum(AccountType).optional().describe('账户类型'),
})
export class AccountStatisticsDto extends createZodDto(AccountStatisticsSchema) {}

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

export class AccountListBySpaceIdsDto {
  @ApiProperty({ description: '空间ID数组' })
  @IsArray()
  @Expose()
  spaceIds: string[]
}

export class AccountListByTypesDto {
  @IsArray({ message: '账号类型必须是数组' })
  @IsEnum(AccountType, { each: true, message: '账号类型值不合法' })
  @Expose()
  types: AccountType[]

  @IsEnum(AccountStatus, { message: '状态' })
  @IsOptional()
  @Expose()

  readonly status?: AccountStatus
}

export const AccountListByParamSchema = z.record(z.string(), z.any()).describe('Account query parameters')

export class AccountListByParamDto extends createZodDto(AccountListByParamSchema) {}

export const SortRankItemSchema = z.object({
  id: z.string({ message: '数据ID' }),
  rank: z.number({ message: '序号' }),
})
export const SortRankSchema = z.object({
  groupId: z.string({ message: '分组ID' }),
  list: z.array(SortRankItemSchema),
})
export class SortRankDto extends createZodDto(SortRankSchema) {}

export const AccountFilterSchema = z.object({
  userId: z.string().optional(),
  types: z.array(z.enum(AccountType)).optional(),
})
export class AccountFilterDto extends createZodDto(AccountFilterSchema) {}
