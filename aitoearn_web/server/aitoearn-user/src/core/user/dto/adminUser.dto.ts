import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { TableDtoSchema } from '@/common/global/dto/table.dto'
import { UserStatus } from '@/libs'

export const UserListQuerySchema = z.object({
  keyword: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
})
export const UserListSchema = z.object({
  page: TableDtoSchema,
  query: UserListQuerySchema,
})
export class UserListDto extends createZodDto(UserListSchema) {}
