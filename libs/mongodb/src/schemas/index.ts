import { Account, AccountSchema } from './account.schema'
import { AccountGroup, AccountGroupSchema } from './accountGroup.schema'
import { AiLog, AiLogSchema } from './ai-log.schema'
import { AppConfig, AppConfigSchema } from './app-config.schema'
import { AppRelease, AppReleaseSchema } from './app-release.schema'
import { Blog, BlogSchema } from './blog.schema'
import {
  BrowserProfile,
  BrowserProfileSchema,
} from './browser-profile.schema'
import { Checkout, CheckoutSchema } from './checkout.schema'
import {
  CloudSpace,
  CloudSpaceSchema,
} from './cloud-space.schema'
import { Coupon, CouponSchema } from './coupon.schema'
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
import { Price, PriceSchema } from './price.schema'
import { Product, ProductSchema } from './product.schema'
import { Subscription, SubscriptionSchema } from './subscription.schema'
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
import {
  WithdrawRecord,
  WithdrawRecordSchema,
} from './withdraw-record.schema'

export * from './account.schema'
export * from './accountGroup.schema'
export * from './ai-log.schema'
export * from './app-config.schema'
export * from './app-release.schema'
export * from './blog.schema'
export * from './browser-profile.schema'
export * from './checkout.schema'
export * from './cloud-space.schema'
export * from './coupon.schema'
export * from './feedback.schema'
export * from './income-record.schema'
export * from './multilogin-account.schema'
export * from './notification.schema'
export * from './points-record.schema'
export * from './price.schema'
export * from './product.schema'
export * from './subscription.schema'
export * from './user-wallet-account.schema'
export * from './user-wallet.schema'
export * from './user.schema'
export * from './withdraw-record.schema'

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
  { name: Checkout.name, schema: CheckoutSchema },
  { name: Coupon.name, schema: CouponSchema },
  { name: Price.name, schema: PriceSchema },
  { name: Product.name, schema: ProductSchema },
  { name: Subscription.name, schema: SubscriptionSchema },
  { name: WithdrawRecord.name, schema: WithdrawRecordSchema },
  { name: AppRelease.name, schema: AppReleaseSchema },
  { name: Account.name, schema: AccountSchema },
  { name: AccountGroup.name, schema: AccountGroupSchema },
] as const
