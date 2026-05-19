import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const getUserInfoDtoSchema = z.object({
  id: z.string().min(1).describe('用户ID'),
})

export class GetUserInfoDto extends createZodDto(getUserInfoDtoSchema, 'GetUserInfoDto') {}

export const listUsersByIdsDtoSchema = z.object({
  userIds: z.array(z.string().min(1)).describe('用户ID列表'),
})

export class ListUsersByIdsDto extends createZodDto(listUsersByIdsDtoSchema, 'ListUsersByIdsDto') {}
