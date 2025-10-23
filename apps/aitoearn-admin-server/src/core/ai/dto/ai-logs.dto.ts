import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { z } from 'zod'

// 日志列表查询参数
export const logListQuerySchema = z.object({
  ...PaginationDtoSchema.shape,
})

export class LogListQueryDto extends createZodDto(logListQuerySchema) {}

// 日志详情查询请求
const logDetailQuerySchema = z.object({
  id: z.string().min(1).describe('日志ID'),
})

export class LogDetailQueryDto extends createZodDto(logDetailQuerySchema) {}
