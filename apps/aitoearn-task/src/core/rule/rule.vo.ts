import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { filterSetSchema } from '../../common/filter-set.dto'

export const ruleVoSchema = z.object({
  id: z.string(),
  name: z.string(),
  filter: filterSetSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})
export class RuleVo extends createZodDto(ruleVoSchema) {}

export const ruleListVoSchema = z.object({
  list: z.array(ruleVoSchema),
  total: z.number(),
})

export class RuleListVo extends createZodDto(ruleListVoSchema) {}
