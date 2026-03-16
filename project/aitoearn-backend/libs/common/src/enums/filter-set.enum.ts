export enum ConditionType {
  Nested = 'nested',
  Single = 'single',
}

export enum Operator {
  Equal = 'eq',
  NotEqual = 'ne',
  GreaterThan = 'gt',
  LessThan = 'lt',
  GreaterThanOrEqual = 'gte',
  LessThanOrEqual = 'lte',
  In = 'in',
  NotIn = 'nin',
  Like = 'like',
  NotLike = 'nlike',
  Between = 'btw',
  NotBetween = 'nbtw',
  IsNull = 'isn',
  IsNotNull = 'isnn',
}

export enum Conjunction {
  And = 'and',
  Or = 'or',
}
