import { AccountRepository } from './account.repository'
import { AccountGroupRepository } from './accountGroup.repository'
import { AdminAccountRepository } from './admin/admin-account.repository'
import { AdminUserRepository } from './admin/admin-user.repository'
import { ManagerRepository } from './admin/manager.repository'
import { AiLogRepository } from './ai-log.repository'
import { AppConfigRepository } from './app-config.repository'
import { AppReleaseRepository } from './app-release.repository'
import { BlogRepository } from './blog.repository'
import { BrowserProfileRepository } from './browser-profile.repository'
import { CheckoutRepository } from './checkout.repository'
import { CloudSpaceRepository } from './cloud-space.repository'
import { CouponRepository } from './coupon.repository'
import { FeedbackRepository } from './feedback.repository'
import { IncomeRecordRepository } from './income-record.repository'
import { MaterialRepository } from './material.repository'
import { MaterialGroupRepository } from './materialGroup.repository'
import { MaterialTaskRepository } from './materialTask.repository'
import { MediaRepository } from './media.repository'
import { MediaGroupRepository } from './mediaGroup.repository'
import { MultiloginAccountRepository } from './multilogin-account.repository'
import { NotificationRepository } from './notification.repository'
import { PointsRecordRepository } from './points-record.repository'
import { PriceRepository } from './price.repository'
import { ProductRepository } from './product.repository'
import { PublishRecordRepository } from './publishRecord.repository'
import { SubscriptionRepository } from './subscription.repository'
import { UserWalletAccountRepository } from './user-wallet-account.repository'
import { UserWalletRepository } from './user-wallet.repository'
import { UserRepository } from './user.repository'
import { VipRepository } from './vip.repository'
import { WithdrawRecordRepository } from './withdraw-record.repository'

export * from './account.repository'
export * from './accountGroup.repository'
export * from './admin/admin-account.repository'
export * from './admin/admin-user.repository'
export * from './admin/manager.repository'
export * from './ai-log.repository'
export * from './app-config.repository'
export * from './app-release.repository'
export * from './base.repository'
export * from './blog.repository'
export * from './browser-profile.repository'
export * from './checkout.repository'
export * from './cloud-space.repository'
export * from './coupon.repository'
export * from './feedback.repository'
export * from './income-record.repository'
export * from './material.repository'
export * from './materialGroup.repository'
export * from './materialTask.repository'
export * from './media.repository'
export * from './mediaGroup.repository'
export * from './multilogin-account.repository'
export * from './notification.repository'
export * from './points-record.repository'
export * from './price.repository'
export * from './product.repository'
export * from './publishRecord.repository'
export * from './subscription.repository'
export * from './user-wallet-account.repository'
export * from './user-wallet.repository'
export * from './user.repository'
export * from './vip.repository'
export * from './withdraw-record.repository'

export const repositories = [
  AiLogRepository,
  AppConfigRepository,
  BlogRepository,
  CloudSpaceRepository,
  BrowserProfileRepository,
  CheckoutRepository,
  CouponRepository,
  FeedbackRepository,
  IncomeRecordRepository,
  MultiloginAccountRepository,
  NotificationRepository,
  PointsRecordRepository,
  PriceRepository,
  ProductRepository,
  SubscriptionRepository,
  UserWalletAccountRepository,
  UserWalletRepository,
  UserRepository,
  WithdrawRecordRepository,
  AppReleaseRepository,
  AccountRepository,
  AccountGroupRepository,
  MediaRepository,
  MediaGroupRepository,
  VipRepository,
  AdminAccountRepository,
  ManagerRepository,
  AdminUserRepository,
  MaterialGroupRepository,
  MaterialRepository,
  MaterialTaskRepository,
  PublishRecordRepository,
] as const
