import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { DraftGenerationMemoryContentType } from '../dtos/draft-generation-memory.dto'

export const DraftGenerationMemoryItemVoSchema = z.object({
  id: z.string().describe('Memory 条目 ID'),
  text: z.string().describe('Memory 短描述'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class DraftGenerationMemoryItemVo extends createZodDto(DraftGenerationMemoryItemVoSchema, 'DraftGenerationMemoryItemVo') {}

export const DraftGenerationMemoryVoSchema = z.object({
  id: z.string().describe('Memory 文档 ID'),
  userId: z.string().describe('用户 ID'),
  contentType: z.enum(DraftGenerationMemoryContentType).describe('Memory 类型'),
  items: z.array(DraftGenerationMemoryItemVoSchema).describe('Memory 短描述列表'),
  lastGeneratedAt: z.date().optional().describe('最近自动生成时间'),
  sampleCount: z.number().describe('最近自动总结使用的样本数量'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class DraftGenerationMemoryVo extends createZodDto(DraftGenerationMemoryVoSchema, 'DraftGenerationMemoryVo') {}
