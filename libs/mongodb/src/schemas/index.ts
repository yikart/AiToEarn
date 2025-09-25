import { AiLog, AiLogSchema } from './ai-log.schema'
import {
  BrowserProfile,
  BrowserProfileSchema,
} from './browser-profile.schema'
import {
  CloudSpace,
  CloudSpaceSchema,
} from './cloud-space.schema'
import {
  IncomeRecord,
  IncomeRecordSchema,
} from './income-record.schema'
import {
  MultiloginAccount,
  MultiloginAccountSchema,
} from './multilogin-account.schema'
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
export * from './browser-profile.schema'
export * from './cloud-space.schema'
export * from './income-record.schema'
export * from './multilogin-account.schema'
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
] as const
