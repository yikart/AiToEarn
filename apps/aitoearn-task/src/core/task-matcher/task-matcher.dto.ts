import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { filterSetSchema } from '../../common/filter-set.dto'

export const createTaskMatcherDtoSchema = z.object({
  taskId: z.string().min(1),
  name: z.string().min(1),
  filter: filterSetSchema,
})

export const updateTaskMatcherDtoSchema = z.object({
  ...createTaskMatcherDtoSchema.partial().shape,
  id: z.string().min(1),
})

export const queryTaskMatcherDtoSchema = z.object({
  taskId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  pageNo: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
})

export class CreateTaskMatcherDto extends createZodDto(createTaskMatcherDtoSchema) {}
export class UpdateTaskMatcherDto extends createZodDto(updateTaskMatcherDtoSchema) {}
export class QueryTaskMatcherDto extends createZodDto(queryTaskMatcherDtoSchema) {}
