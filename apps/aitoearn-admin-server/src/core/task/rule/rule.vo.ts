import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { filterSetSchema } from '../../../common/dto/filter-set.dto'

export const taskMatcherVoSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  name: z.string(),
  filter: filterSetSchema,
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const taskMatcherListVoSchema = z.object({
  list: z.array(taskMatcherVoSchema),
  total: z.number(),
})

export class RuleVo extends createZodDto(taskMatcherVoSchema) {}
export class RuleListVo extends createZodDto(taskMatcherListVoSchema) {}
