import { createZodDto, TableDtoSchema } from '@yikart/common'
import { UserStatus } from '@yikart/mongodb'
import z from 'zod'

export const UserListQuerySchema = z.object({
  keyword: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  time: z.array(z.string()).optional(),
})
export const UserListSchema = z.object({
  page: TableDtoSchema,
  query: UserListQuerySchema,
})
export class UserListDto extends createZodDto(UserListSchema) {}
