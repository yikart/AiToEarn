import { createZodDto, TableDtoSchema } from '@yikart/common'
import { z } from 'zod'
import { filterSetSchema } from '../../common/filter-set.dto'

export const createRuleSchema = z.object({
  name: z.string().min(1),
  filter: filterSetSchema,
})
export class CreateRuleDto extends createZodDto(createRuleSchema) {}

export const updateRuleSchema = z.object({
  ...createRuleSchema.partial().shape,
  id: z.string().min(1),
})
export class UpdateRuleDto extends createZodDto(updateRuleSchema) {}

export const queryRuleFilterSchema = z.object({
  name: z.string().min(1).optional(),
})
export class QueryRuleFilterDto extends createZodDto(queryRuleFilterSchema) {}

export const queryRuleSchema = z.object({
  page: TableDtoSchema,
  filter: queryRuleFilterSchema,
})
export class QueryRuleDto extends createZodDto(queryRuleSchema) {}
