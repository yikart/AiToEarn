// MongooseModule.forFeature() 配置
import {
  BrowserEnvironment,
  BrowserEnvironmentSchema,
} from './browser-environment.schema'
import {
  BrowserProfile,
  BrowserProfileSchema,
} from './browser-profile.schema'
import {
  MultiloginAccounts,
  MultiloginAccountSchema,
} from './multilogin-account.schema'
import {
  PointsRecord,
  PointsRecordSchema,
} from './points-record.schema'
import {
  User,
  UserSchema,
} from './user.schema'

export * from './browser-environment.schema'
export * from './browser-profile.schema'
export * from './multilogin-account.schema'
export * from './points-record.schema'
export * from './timestamp.schema'
export * from './user-wallet-account.schema'
export * from './user-wallet-record.schema'
export * from './user-wallet.schema'
export * from './user.schema'

export const schemas = [
  { name: User.name, schema: UserSchema },
  { name: PointsRecord.name, schema: PointsRecordSchema },
  { name: BrowserEnvironment.name, schema: BrowserEnvironmentSchema },
  { name: BrowserProfile.name, schema: BrowserProfileSchema },
  { name: MultiloginAccounts.name, schema: MultiloginAccountSchema },
] as const
