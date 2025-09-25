import { AiLog, AiLogSchema } from './ai-log.schema'
import { AppConfig, AppConfigSchema } from './app-config.schema'
import { Blog, BlogSchema } from './blog.schema'
import {
  BrowserProfile,
  BrowserProfileSchema,
} from './browser-profile.schema'
import {
  CloudSpace,
  CloudSpaceSchema,
} from './cloud-space.schema'
import { Feedback, FeedbackSchema } from './feedback.schema'
import {
  IncomeRecord,
  IncomeRecordSchema,
} from './income-record.schema'
import {
  MultiloginAccount,
  MultiloginAccountSchema,
} from './multilogin-account.schema'
import { Notification, NotificationSchema } from './notification.schema'
import {
  PointsRecord,
  PointsRecordSchema,
} from './points-record.schema'
import {
  UserWalletAccount,
  UserWalletAccountSchema,
} from './user-wallet-account.schema'
import {
  UserWallet,
  UserWalletSchema,
} from './user-wallet.schema'
import {
  User,
  UserSchema,
} from './user.schema'

export * from './ai-log.schema'
export * from './app-config.schema'
export * from './blog.schema'
export * from './browser-profile.schema'
export * from './cloud-space.schema'
export * from './feedback.schema'
export * from './income-record.schema'
export * from './multilogin-account.schema'
export * from './notification.schema'
export * from './points-record.schema'
export * from './user-wallet-account.schema'
export * from './user-wallet.schema'
export * from './user.schema'

export const schemas = [
  { name: User.name, schema: UserSchema },
  { name: PointsRecord.name, schema: PointsRecordSchema },
  { name: IncomeRecord.name, schema: IncomeRecordSchema },
  { name: CloudSpace.name, schema: CloudSpaceSchema },
  { name: BrowserProfile.name, schema: BrowserProfileSchema },
  { name: MultiloginAccount.name, schema: MultiloginAccountSchema },
  { name: UserWalletAccount.name, schema: UserWalletAccountSchema },
  { name: UserWallet.name, schema: UserWalletSchema },
  { name: AiLog.name, schema: AiLogSchema },
  { name: AppConfig.name, schema: AppConfigSchema },
  { name: Blog.name, schema: BlogSchema },
  { name: Feedback.name, schema: FeedbackSchema },
  { name: Notification.name, schema: NotificationSchema },
] as const
