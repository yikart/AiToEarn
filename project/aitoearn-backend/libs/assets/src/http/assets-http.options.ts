import type { AssetsConfig } from '../assets.config'
import { UserType } from '@yikart/common'

export const ASSETS_HTTP_OPTIONS = Symbol('ASSETS_HTTP_OPTIONS')

export interface AssetsHttpModuleOptions {
  assetsConfig: AssetsConfig
  userType?: UserType
  enableScheduler?: boolean
}

export class AssetsRedlockKey {
  static AssetsPendingCheck = 'scheduler:assets-pending-check'
  static AssetsExpiredCleanup = 'scheduler:assets-expired-cleanup'
  static AssetsR2EventsProcess = 'scheduler:assets-r2-events-process'
}
