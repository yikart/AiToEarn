import { AccountDataRepository } from './accountData.repository'
import { ChannelRepository } from './channel.repository'
import { PostRepository } from './post.repository'
import { SettlementLogRepository } from './settlement-log.repository'
import { TaskRepository } from './task.repository'

export * from './accountData.repository'
export * from './base.repository'
export * from './channel.repository'
export * from './post.repository'
export * from './settlement-log.repository'
export * from './task.repository'

export const repositories = [
  AccountDataRepository,
  ChannelRepository,
  PostRepository,
  TaskRepository,
  SettlementLogRepository,
] as const
