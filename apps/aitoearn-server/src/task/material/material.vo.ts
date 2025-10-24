import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const materialVoSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  type: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  aiPrompt: z.string().optional(),
  priority: z.number().optional(),
  content: z.string().optional(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export class MaterialVo extends createZodDto(materialVoSchema) {}

export const materialListVoSchema = z.object({
  list: z.array(materialVoSchema),
  total: z.number(),
})

export class MaterialListVo extends createZodDto(materialListVoSchema) {}
