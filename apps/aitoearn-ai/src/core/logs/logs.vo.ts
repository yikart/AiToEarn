import { createPaginationVo, createZodDto, UserType } from '@yikart/common'
import { AiLogChannel, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { z } from 'zod'

// 日志基本信息
const logItemSchema = z.object({
  id: z.string().describe('日志ID'),
  userId: z.string().describe('用户ID'),
  userType: z.enum(UserType).describe('用户类型'),
  taskId: z.string().describe('任务ID'),
  type: z.enum(AiLogType).describe('日志类型'),
  model: z.string().describe('模型'),
  channel: z.enum(AiLogChannel).describe('渠道'),
  action: z.string().optional().describe('操作'),
  status: z.enum(AiLogStatus).describe('日志状态'),
  startedAt: z.date().describe('开始时间'),
  duration: z.number().optional().describe('持续时间'),
  points: z.number().describe('积分'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class LogItemVo extends createZodDto(logItemSchema) {}

// 日志列表响应
export class LogListResponseVo extends createPaginationVo(logItemSchema, 'LogListResponseVo') {}

// 日志详情响应
const logDetailResponseSchema = z.object({
  id: z.string().describe('日志ID'),
  userId: z.string().describe('用户ID'),
  userType: z.enum(UserType).describe('用户类型'),
  taskId: z.string().describe('任务ID'),
  type: z.enum(AiLogType).describe('日志类型'),
  model: z.string().describe('模型'),
  channel: z.enum(AiLogChannel).describe('渠道'),
  action: z.string().optional().describe('操作'),
  status: z.enum(AiLogStatus).describe('日志状态'),
  startedAt: z.date().describe('开始时间'),
  duration: z.number().optional().describe('持续时间'),
  request: z.record(z.string(), z.unknown()).describe('请求参数'),
  response: z.record(z.string(), z.unknown()).optional().describe('响应结果'),
  errorMessage: z.string().optional().describe('错误信息'),
  points: z.number().describe('积分'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class LogDetailResponseVo extends createZodDto(logDetailResponseSchema) {}
