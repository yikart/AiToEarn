import { AiLogRepository } from './ai-log.repository'
import { AppConfigRepository } from './app-config.repository'
import { BlogRepository } from './blog.repository'
import { BrowserProfileRepository } from './browser-profile.repository'
import { CloudSpaceRepository } from './cloud-space.repository'
import { FeedbackRepository } from './feedback.repository'
import { IncomeRecordRepository } from './income-record.repository'
import { MultiloginAccountRepository } from './multilogin-account.repository'
import { NotificationRepository } from './notification.repository'
import { PointsRecordRepository } from './points-record.repository'
import { UserWalletAccountRepository } from './user-wallet-account.repository'
import { UserWalletRepository } from './user-wallet.repository'
import { UserRepository } from './user.repository'

export * from './ai-log.repository'
export * from './app-config.repository'
export * from './base.repository'
export * from './blog.repository'
export * from './browser-profile.repository'
export * from './cloud-space.repository'
export * from './feedback.repository'
export * from './income-record.repository'
export * from './multilogin-account.repository'
export * from './notification.repository'
export * from './points-record.repository'
export * from './user-wallet-account.repository'
export * from './user-wallet.repository'
export * from './user.repository'

export const repositories = [
  AiLogRepository,
  AppConfigRepository,
  BlogRepository,
  CloudSpaceRepository,
  BrowserProfileRepository,
  FeedbackRepository,
  IncomeRecordRepository,
  MultiloginAccountRepository,
  NotificationRepository,
  PointsRecordRepository,
  UserWalletAccountRepository,
  UserWalletRepository,
  UserRepository,
] as const
