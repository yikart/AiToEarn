import { createPaginationVo, createZodDto } from '@yikart/common'
import { z } from 'zod'
import { AideoTaskStatus, SkillType } from '../libs/volcengine'

// 提交 Aideo 任务响应
const submitAideoTaskResponseSchema = z.object({
  taskId: z.string().describe('任务ID'),
})

export class SubmitAideoTaskResponseVo extends createZodDto(submitAideoTaskResponseSchema) {}

// Aideo 任务状态响应
const aideoTaskStatusResponseSchema = z.object({
  taskId: z.string().describe('任务ID'),
  status: z.enum(AideoTaskStatus).describe('任务状态'),
  skillType: z.enum(SkillType).optional().describe('AI 技能类型'),
  skillParams: z.string().optional().describe('技能参数（JSON 字符串）'),
  apiResponses: z.array(z.any()).optional().describe('任务执行结果'),
  error: z.object({
    code: z.string().optional(),
    message: z.string().optional(),
  }).optional().describe('错误信息'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class AideoTaskStatusResponseVo extends createZodDto(aideoTaskStatusResponseSchema) {}

// 列表查询响应
export class ListAideoTasksResponseVo extends createPaginationVo(aideoTaskStatusResponseSchema) {}
