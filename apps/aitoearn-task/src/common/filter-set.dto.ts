import { createZodDto } from '@yikart/common'
import { ConditionType, Operator } from '@yikart/task-db'
import { z, ZodType } from 'zod'

// 基础条件 schema
const baseConditionSchema = z.object({
  type: z.enum(ConditionType),
})

const singleConditionSchema = baseConditionSchema.extend({
  type: z.literal(ConditionType.SINGLE),
  field: z.string().min(1),
  operator: z.enum(Operator),
  value: z.union([z.string(), z.array(z.string())]),
})

const nestedConditionSchema = baseConditionSchema.extend({
  type: z.literal(ConditionType.NESTED),
  conjunction: z.enum(['AND', 'OR']),
  get conditions() {
    // eslint-disable-next-line ts/no-use-before-define
    return z.array(conditionSchema)
  },
})

const conditionSchema = z.union([
  singleConditionSchema,
  nestedConditionSchema,
])

export const filterSetSchema = nestedConditionSchema
export class FilterSetDto extends createZodDto(filterSetSchema) {}

export const singleConditionDtoSchema = singleConditionSchema
export const nestedConditionDtoSchema = nestedConditionSchema

export function createFilterSet<T extends ZodType>(field: T) {
  const nestedConditionSchema = baseConditionSchema.extend({
    type: z.literal(ConditionType.NESTED),
    conjunction: z.enum(['AND', 'OR']),
    get conditions() {
      // eslint-disable-next-line ts/no-use-before-define
      return z.array(conditionSchema)
    },
  })

  const conditionSchema = z.union([
    singleConditionSchema.extend({
      field,
    }),
    nestedConditionSchema,
  ])

  return nestedConditionSchema
}
