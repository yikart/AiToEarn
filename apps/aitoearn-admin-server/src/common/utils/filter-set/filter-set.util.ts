import type { Condition, NestedCondition, SingleCondition } from './filter-set.interface'
import { ConditionType, Operator } from './filter-set.interface'

/**
 * MongoDB 查询条件类型
 */
export type MongoQuery = Record<string, unknown>

/**
 * 将 Filter Set DSL 转换为 MongoDB 查询条件
 * @param condition Filter Set DSL 条件
 * @returns MongoDB 查询对象
 */
export function convertFilterSetToMongoQuery(condition: Condition) {
  if (condition.type === ConditionType.SINGLE) {
    return convertSingleCondition(condition)
  }
  return convertNestedCondition(condition)
}

/**
 * 转换单个条件
 */
function convertSingleCondition(condition: SingleCondition) {
  const { field, operator, value } = condition

  switch (operator) {
    case Operator.EQUAL:
      if (Array.isArray(value)) {
        return { [field]: { $in: value } }
      }
      return { [field]: value }

    case Operator.NOT_EQUAL:
      if (Array.isArray(value)) {
        return { [field]: { $nin: value } }
      }
      return { [field]: { $ne: value } }

    case Operator.GREATER_THAN:
      return { [field]: { $gt: value } }

    case Operator.LESS_THAN:
      return { [field]: { $lt: value } }

    case Operator.GREATER_THAN_OR_EQUAL:
      return { [field]: { $gte: value } }

    case Operator.LESS_THAN_OR_EQUAL:
      return { [field]: { $lte: value } }

    case Operator.IN:
      if (Array.isArray(value)) {
        return { [field]: { $in: value } }
      }
      return { [field]: { $in: [value] } }

    case Operator.NOT_IN:
      if (Array.isArray(value)) {
        return { [field]: { $nin: value } }
      }
      return { [field]: { $nin: [value] } }

    case Operator.LIKE:
      if (Array.isArray(value)) {
        // 对于数组值，使用 OR 条件进行模糊匹配
        const regexConditions = value.map(v => ({ [field]: { $regex: v, $options: 'i' } }))
        return { $or: regexConditions }
      }
      return { [field]: { $regex: value, $options: 'i' } }

    default:
      throw new Error(`Unsupported operator: ${operator}`)
  }
}

/**
 * 转换嵌套条件
 */
function convertNestedCondition(condition: NestedCondition): any {
  const { conjunction, conditions } = condition

  if (conditions.length === 0) {
    return {}
  }

  if (conditions.length === 1) {
    return convertFilterSetToMongoQuery(conditions[0])
  }

  const mongoConditions = conditions.map(cond => convertFilterSetToMongoQuery(cond))

  if (conjunction === 'AND') {
    return { $and: mongoConditions }
  }
  return { $or: mongoConditions }
}
