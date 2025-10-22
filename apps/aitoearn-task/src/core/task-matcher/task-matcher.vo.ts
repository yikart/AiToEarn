import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { filterSetSchema } from '../../common/filter-set.dto'

export const taskMatcherVoSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  name: z.string(),
  filter: filterSetSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const taskMatcherListVoSchema = z.object({
  list: z.array(taskMatcherVoSchema),
  total: z.number(),
})

export class TaskMatcherVo extends createZodDto(taskMatcherVoSchema) {}
export class TaskMatcherListVo extends createZodDto(taskMatcherListVoSchema) {}
