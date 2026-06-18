import { createPaginationVo, createZodDto } from '@yikart/common'
import { z } from 'zod'
import { AiLogStatus } from '../enums'

export const CreateDraftGenerationVoSchema = z.object({
  taskIds: z.array(z.string()).describe('生成任务 ID 列表（AiLog ID，可用于查询进度）'),
})

export class CreateDraftGenerationVo extends createZodDto(CreateDraftGenerationVoSchema, 'CreateDraftGenerationVo') {}

export const CreateDraftFromVideoUrlVoSchema = z.object({
  materialId: z.string().describe('生成后的草稿素材 ID'),
})

export type CreateDraftFromVideoUrlVoInput = z.input<typeof CreateDraftFromVideoUrlVoSchema>

export class CreateDraftFromVideoUrlVo extends createZodDto(CreateDraftFromVideoUrlVoSchema, 'CreateDraftFromVideoUrlVo') {}

export const DraftGenerationTaskQueueVoSchema = z.object({
  position: z.number().nullable().describe('当前队列中的排队位置，1 表示下一个待执行任务；执行中或无法定位时为 null'),
  waitingCount: z.number().describe('当前队列待执行任务总数'),
})

export const DraftGenerationTaskVoSchema = z.object({
  id: z.string().describe('任务 ID'),
  status: z.enum(AiLogStatus).describe('任务状态'),
  errorMessage: z.string().optional().describe('错误信息'),
  request: z.record(z.string(), z.unknown()).optional().describe('生成输入参数'),
  response: z.union([z.record(z.string(), z.unknown()), z.string()]).optional().describe('生成结果'),
  queue: DraftGenerationTaskQueueVoSchema.optional().describe('任务队列展示信息'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class DraftGenerationTaskVo extends createZodDto(DraftGenerationTaskVoSchema, 'DraftGenerationTaskVo') {}

export class DraftGenerationTaskListVo extends createPaginationVo(DraftGenerationTaskVoSchema, 'DraftGenerationTaskListVo') {}

export const DraftGenerationStatsVoSchema = z.object({
  generatingCount: z.number().describe('生成中任务数量'),
})

export class DraftGenerationStatsVo extends createZodDto(DraftGenerationStatsVoSchema, 'DraftGenerationStatsVo') {}
