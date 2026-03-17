import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const getUserInfoDtoSchema = z.object({
  id: z.string().min(1).describe('用户ID'),
})

export class GetUserInfoDto extends createZodDto(getUserInfoDtoSchema, 'GetUserInfoDto') {}

// 联盟营销相关 DTO
export const generatePopularizeCodeDtoSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
})

export class GeneratePopularizeCodeDto extends createZodDto(generatePopularizeCodeDtoSchema, 'GeneratePopularizeCodeDto') {}

export const getUserByPopularizeCodeDtoSchema = z.object({
  inviteCode: z.string().min(1).describe('邀请码'),
})

export class GetUserByPopularizeCodeDto extends createZodDto(getUserByPopularizeCodeDtoSchema, 'GetUserByPopularizeCodeDto') {}

export const listUsersByIdsDtoSchema = z.object({
  userIds: z.array(z.string().min(1)).describe('用户ID列表'),
})

export class ListUsersByIdsDto extends createZodDto(listUsersByIdsDtoSchema, 'ListUsersByIdsDto') {}
