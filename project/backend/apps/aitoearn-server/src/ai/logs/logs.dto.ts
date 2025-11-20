import { createZodDto, PaginationDtoSchema, UserType } from '@yikart/common'
import { z } from 'zod'

// 日志列表查询参数
export const logListQuerySchema = z.object({
  userId: z.string().optional().describe('用户ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
  ...PaginationDtoSchema.shape,
})

export class LogListQueryDto extends createZodDto(logListQuerySchema) {}

// 日志详情查询请求
const logDetailQuerySchema = z.object({
  id: z.string().min(1).describe('日志ID'),
  userId: z.string().optional().describe('用户ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
})

export class LogDetailQueryDto extends createZodDto(logDetailQuerySchema) {}
