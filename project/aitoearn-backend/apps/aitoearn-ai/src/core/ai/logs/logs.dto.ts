import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { AiLogChannel, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { z } from 'zod'

// 日志列表查询参数
export const logListQuerySchema = z.object({
  type: z.enum(AiLogType).optional().describe('日志类型'),
  status: z.enum(AiLogStatus).optional().describe('日志状态'),
  channel: z.enum(AiLogChannel).optional().describe('渠道'),
  model: z.string().optional().describe('模型名称'),
  ...PaginationDtoSchema.shape,
})

export class LogListQueryDto extends createZodDto(logListQuerySchema) {}

// 日志详情查询请求
const logDetailQuerySchema = z.object({
  id: z.string().min(1).describe('日志ID'),
})

export class LogDetailQueryDto extends createZodDto(logDetailQuerySchema) {}
