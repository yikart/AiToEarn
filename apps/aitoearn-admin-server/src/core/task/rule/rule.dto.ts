import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { filterSetSchema } from '../../../common/dto/filter-set.dto'

export const createRuleDtoSchema = z.object({
  name: z.string().min(1),
  filter: filterSetSchema,
})
export class CreateRuleDto extends createZodDto(createRuleDtoSchema) {}

export const updateRuleDtoSchema = z.object({
  ...createRuleDtoSchema.partial().shape,
})
export class UpdateRuleDto extends createZodDto(updateRuleDtoSchema) {}

export const queryRuleDtoSchema = z.object({
  name: z.string().min(1).optional(),
})
export class QueryRuleDto extends createZodDto(queryRuleDtoSchema) {}
