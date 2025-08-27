import {
  BrowserProfile,
  BrowserProfileSchema,
} from './browser-profile.schema'
import {
  CloudSpace,
  CloudSpaceSchema,
} from './cloud-space.schema'
import {
  MultiloginAccount,
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

export * from './browser-profile.schema'
export * from './cloud-space.schema'
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
  { name: CloudSpace.name, schema: CloudSpaceSchema },
  { name: BrowserProfile.name, schema: BrowserProfileSchema },
  { name: MultiloginAccount.name, schema: MultiloginAccountSchema },
] as const
