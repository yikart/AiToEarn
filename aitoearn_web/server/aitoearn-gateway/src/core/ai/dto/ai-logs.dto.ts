import { createZodDto } from '@common/utils/zod-dto.util'
import { z } from 'zod/v4'

// 用户日志查询请求Schema
const userLogsQueryRequestSchema = z.object({
  page: z.number().int().min(1).default(1).describe('页码，默认1'),
  size: z.number().int().min(1).max(100).default(10).describe('每页数量，默认10，最大100'),
  start_timestamp: z.number().int().optional().describe('开始时间戳'),
  end_timestamp: z.number().int().optional().describe('结束时间戳'),
  model_name: z.string().optional().describe('模型名称'),
})

export class UserLogsQueryRequestDto extends createZodDto(userLogsQueryRequestSchema) {}
