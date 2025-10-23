import { createZodDto } from '@yikart/common'
import { UserStatus, VipStatus } from '@yikart/mongodb'
import z from 'zod'

export const UserListQuerySchema = z.object({
  keyword: z.string().optional(),
  status: z.enum(UserStatus).optional(),
  time: z.array(z.string()).optional(),
})
export class UserListQueryDto extends createZodDto(UserListQuerySchema) {}

export const SetVipSchema = z.object({
  userId: z.string(),
  status: z.enum(VipStatus),
})
export class SetVipDto extends createZodDto(SetVipSchema) {}

export const ClearVipSchema = z.object({
  userId: z.string(),
})
export class ClearVipDto extends createZodDto(ClearVipSchema) {}
