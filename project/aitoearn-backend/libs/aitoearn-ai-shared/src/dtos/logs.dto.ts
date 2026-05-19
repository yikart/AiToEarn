import { createZodDto, PaginationDtoSchema, UserType } from '@yikart/common'
import { z } from 'zod'

// Internal log list query DTO (used by ai-client)
const internalLogListQuerySchema = z.object({
  userId: z.string().optional().describe('用户 ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
  ...PaginationDtoSchema.shape,
})

export class InternalLogListQueryDto extends createZodDto(internalLogListQuerySchema, 'InternalLogListQueryDto') {}

// Internal log detail query DTO (used by ai-client)
const internalLogDetailQuerySchema = z.object({
  id: z.string().describe('日志 ID'),
  userId: z.string().optional().describe('用户 ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
})

export class InternalLogDetailQueryDto extends createZodDto(internalLogDetailQuerySchema, 'InternalLogDetailQueryDto') {}
