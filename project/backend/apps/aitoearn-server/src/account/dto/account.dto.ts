import { AccountType, createZodDto } from '@yikart/common'
import { AccountStatus, ClientType } from '@yikart/mongodb'
import { z } from 'zod'

const CreateAccountSchema = z.object({
  refresh_token: z.string().min(1).optional(),
  access_token: z.string().min(1).optional(),
  type: z.enum(AccountType),
  clientType: z.enum(ClientType).optional(),
  loginCookie: z.string().min(1).optional(),
  loginTime: z.coerce.date().optional(),
  uid: z.string().min(1),
  account: z.string().min(1),
  token: z.string().optional(),
  avatar: z.string().optional(),
  nickname: z.string().min(1),
  fansCount: z.number().optional(),
  readCount: z.number().optional(),
  likeCount: z.number().optional(),
  collectCount: z.number().optional(),
  forwardCount: z.number().optional(),
  commentCount: z.number().optional(),
  lastStatsTime: z.coerce.date().optional(),
  workCount: z.number().optional(),
  income: z.number().optional(),
  groupId: z.string().optional(),
})
export class CreateAccountDto extends createZodDto(
  CreateAccountSchema,
) {}

const UpdateAccountSchema = z.object({
  id: z.string({ message: 'ID' }),
  refresh_token: z.string().min(1).optional(),
  access_token: z.string().min(1).optional(),
  type: z.enum(AccountType).optional(),
  clientType: z.enum(ClientType).optional(),
  loginCookie: z.string().min(1).optional(),
  loginTime: z.coerce.date().optional(),
  uid: z.string().min(1).optional(),
  account: z.string().min(1).optional(),
  token: z.string().optional(),
  avatar: z.string().optional(),
  nickname: z.string().min(1).optional(),
  fansCount: z.number().optional(),
  readCount: z.number().optional(),
  likeCount: z.number().optional(),
  collectCount: z.number().optional(),
  forwardCount: z.number().optional(),
  commentCount: z.number().optional(),
  lastStatsTime: z.coerce.date().optional(),
  workCount: z.number().optional(),
  income: z.number().optional(),
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

const UpdateAccountStatisticsSchema = z.object({
  id: z.string().describe('账号ID'),
  workCount: z.number().optional().describe('作品数'),
  fansCount: z.number().optional().describe('粉丝数'),
  readCount: z.number().optional().describe('阅读数'),
  likeCount: z.number().optional().describe('点赞数'),
  collectCount: z.number().optional().describe('收藏数'),
  commentCount: z.number().optional().describe('评论数'),
  income: z.number().optional().describe('收入'),
})
export class UpdateAccountStatisticsDto extends createZodDto(
  UpdateAccountStatisticsSchema,
) {}

const DeleteAccountsSchema = z.object({
  ids: z.array(z.string()).min(1).describe('要删除的ID'),
})
export class DeleteAccountsDto extends createZodDto(DeleteAccountsSchema) {}

const AccountListBySpaceIdsSchema = z.object({
  spaceIds: z.array(z.string()).min(1).describe('空间ID数组'),
})
export class AccountListBySpaceIdsDto extends createZodDto(
  AccountListBySpaceIdsSchema,
) {}

const AccountListByTypesSchema = z.object({
  types: z.array(z.enum(AccountType)).min(1).describe('账号类型数组'),
  status: z.enum(AccountStatus).optional().describe('账号状态'),
})
export class AccountListByTypesDto extends createZodDto(
  AccountListByTypesSchema,
) {}

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
