import { BrowserProfileRepository } from './browser-profile.repository'
import { CloudSpaceRepository } from './cloud-space.repository'
import { MultiloginAccountRepository } from './multilogin-account.repository'
import { UserRepository } from './user.repository'

export * from './base.repository'
export * from './browser-profile.repository'
export * from './cloud-space.repository'
export * from './multilogin-account.repository'
export * from './user.repository'

export const repositories = [
  CloudSpaceRepository,
  BrowserProfileRepository,
  MultiloginAccountRepository,
  UserRepository,
] as const
