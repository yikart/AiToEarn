import { createZodDto } from '@yikart/common'
import { UserStatus } from '@yikart/mongodb'
import z from 'zod'

export const UserListQuerySchema = z.object({
  keyword: z.string().optional(),
  status: z.enum(UserStatus).optional(),
})
export class UserListQueryDto extends createZodDto(UserListQuerySchema) {}
