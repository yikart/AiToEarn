export enum ConditionType {
  NESTED = 'nested',
  SINGLE = 'single',
}

export interface BaseCondition {
  type: ConditionType
}

export enum Operator {
  EQUAL = '=',
  NOT_EQUAL = '!=',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN_OR_EQUAL = '<=',
  IN = 'in',
  NOT_IN = 'not_in',
  LIKE = 'like',
}

export interface SingleCondition extends BaseCondition {
  type: ConditionType.SINGLE
  field: string
  operator: Operator
  value: string | string[]
}
export type Condition = SingleCondition | NestedCondition

export interface NestedCondition extends BaseCondition {
  type: ConditionType.NESTED
  conjunction: 'AND' | 'OR'
  conditions: Condition[]
}
export type FilterSet = NestedCondition
