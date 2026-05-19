import { createZodDto, VipTier } from '@yikart/common'
import { z } from 'zod'

export const getUserInfoDtoSchema = z.object({
  id: z.string().min(1).describe('用户ID'),
})

export class GetUserInfoDto extends createZodDto(getUserInfoDtoSchema, 'GetUserInfoDto') {}

export const getVipDtoSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
})

export class GetVipDto extends createZodDto(getVipDtoSchema, 'GetVipDto') {}

export const setVipDtoSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  tier: z.enum(VipTier).describe('会员档位'),
  expireAt: z.coerce.date().optional().describe('会员过期时间，不传则使用当前时间加 365 天'),
})

export class SetVipDto extends createZodDto(setVipDtoSchema, 'SetVipDto') {}

export const getVipsDtoSchema = z.object({
  userIds: z.array(z.string().min(1)).describe('用户ID列表'),
})

export class GetVipsDto extends createZodDto(getVipsDtoSchema, 'GetVipsDto') {}

export const listUsersByIdsDtoSchema = z.object({
  userIds: z.array(z.string().min(1)).describe('用户ID列表'),
})

export class ListUsersByIdsDto extends createZodDto(listUsersByIdsDtoSchema, 'ListUsersByIdsDto') {}
