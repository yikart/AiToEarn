import { AccountPortrait, AccountPortraitSchema } from './account-portrait.schema'
import { ChannelLoginFailureLog, ChannelLoginFailureLogSchema } from './channel-login-failure-log.schema'
import { Rule, RuleSchema } from './rule.schema'
import { TaskMatcher, TaskMatcherSchema } from './task-matcher.schema'
import { TaskOpportunity, TaskOpportunitySchema } from './task-opportunity.schema'
import { Task, TaskSchema } from './task.schema'
import { TaskPunish, TaskPunishSchema } from './taskPunish.schema'
import { UserPortrait, UserPortraitSchema } from './user-portrait.schema'
import { UserTask, UserTaskSchema } from './user-task.schema'

export * from './account-portrait.schema'
export * from './channel-login-failure-log.schema'
export * from './rule.schema'
export * from './task-matcher.schema'
export * from './task-opportunity.schema'
export * from './task.schema'
export * from './taskPunish.schema'
export * from './user-portrait.schema'
export * from './user-task.schema'

export const schemas = [
  { name: AccountPortrait.name, schema: AccountPortraitSchema },
  { name: ChannelLoginFailureLog.name, schema: ChannelLoginFailureLogSchema },
  { name: Rule.name, schema: RuleSchema },
  { name: TaskMatcher.name, schema: TaskMatcherSchema },
  { name: TaskOpportunity.name, schema: TaskOpportunitySchema },
  { name: TaskPunish.name, schema: TaskPunishSchema },
  { name: UserPortrait.name, schema: UserPortraitSchema },
  { name: UserTask.name, schema: UserTaskSchema },
  { name: Task.name, schema: TaskSchema },
] as const
