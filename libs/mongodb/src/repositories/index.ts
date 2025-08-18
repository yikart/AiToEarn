// Repository providers 配置
import { BrowserEnvironmentRepository } from './browser-environment.repository'
import { BrowserProfileRepository } from './browser-profile.repository'
import { MultiloginAccountRepository } from './multilogin-account.repository'
import { UserRepository } from './user.repository'

export * from './base.repository'
export * from './browser-environment.repository'
export * from './browser-profile.repository'
export * from './multilogin-account.repository'
export * from './user.repository'

export const repositories = [
  BrowserEnvironmentRepository,
  BrowserProfileRepository,
  MultiloginAccountRepository,
  UserRepository,
] as const
