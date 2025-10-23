import { createZodDto } from '@yikart/common'
import { z, ZodType } from 'zod'
import { ConditionType, Operator } from '../interfaces/filter-set.interface'

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

// 使用 z.lazy 来处理递归类型定义
const conditionSchema: z.ZodType<any> = z.lazy(() => {
  const nestedSchema = baseConditionSchema.extend({
    type: z.literal(ConditionType.NESTED),
    conjunction: z.enum(['AND', 'OR']),
    conditions: z.array(conditionSchema),
  })

  return z.union([
    singleConditionSchema,
    nestedSchema,
  ])
})

const nestedConditionSchema = baseConditionSchema.extend({
  type: z.literal(ConditionType.NESTED),
  conjunction: z.enum(['AND', 'OR']),
  conditions: z.array(conditionSchema),
})

export const filterSetSchema = nestedConditionSchema
export const singleConditionDtoSchema = singleConditionSchema
export const nestedConditionDtoSchema = nestedConditionSchema

// 导出 DTO 类
export class FilterSetDto extends createZodDto(filterSetSchema) {}

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
