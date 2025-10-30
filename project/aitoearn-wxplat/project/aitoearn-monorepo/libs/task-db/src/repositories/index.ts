import { AccountPortraitRepository } from './account-portrait.repository'
import { AdminTaskOpportunityRepository } from './adminTaskOpportunity.repository'
import { RuleRepository } from './rule.repository'
import { TaskAdminRepository } from './task-admin.repository'
import { TaskMatcherRepository } from './task-matcher.repository'
import { TaskRepository } from './task.repository'
import { TaskOpportunityRepository } from './taskOpportunity.repository'
import { TaskPunishRepository } from './taskPunish.repository'
import { UserPortraitRepository } from './user-portrait.repository'
import { UserTaskAdminRepository } from './user-task-admin.repository'
import { UserTaskRepository } from './userTask.repository'

export * from './account-portrait.repository'
export * from './adminTaskOpportunity.repository'
export * from './rule.repository'
export * from './task-admin.repository'
export * from './task-matcher.repository'
export * from './task.repository'
export * from './taskOpportunity.repository'
export * from './taskPunish.repository'
export * from './user-portrait.repository'
export * from './user-task-admin.repository'
export * from './userTask.repository'

export const repositories = [
  AccountPortraitRepository,
  RuleRepository,
  TaskRepository,
  TaskOpportunityRepository,
  TaskMatcherRepository,
  AdminTaskOpportunityRepository,
  TaskAdminRepository,
  TaskPunishRepository,
  UserPortraitRepository,
  UserTaskAdminRepository,
  UserTaskRepository,
] as const
