import type { AccountType, Locale } from '@yikart/common'
import type { AuthCallbackResponseType, GenerateAuthUrlInput, PlatformSelectableAccount } from '../platforms/platforms.interface'
import { ChannelAuthSessionStatus } from '@yikart/common'

export enum ChannelAuthSessionFlow {
  AccountAuth = 'account-auth',
}

export interface ChannelAuthSessionBase {
  flow?: ChannelAuthSessionFlow
  id: string
  platform: AccountType
  redirectUri?: string
  authExtras?: Record<string, unknown>
  status: ChannelAuthSessionStatus
  errorCode?: number
  expiresAt?: Date
  createdAt: Date
}

export interface StartAuthInput {
  userId: string
  platform: AccountType
  callbackUrl?: string
  redirectUri?: string
  groupId?: string
  userAgent?: string
  deviceType?: GenerateAuthUrlInput['deviceType']
}

export interface StartAuthResult {
  url: string
  expiresAt: Date
  authInstructions?: Record<Locale, string>
}

export interface StartAuthSessionResult extends StartAuthResult {
  sessionId: string
}

export interface AuthSession extends ChannelAuthSessionBase {
  flow?: ChannelAuthSessionFlow.AccountAuth
  userId: string
  callbackUrl?: string
  groupId: string
  rootCredentialId?: string
  selectableAccounts?: PlatformSelectableAccount[]
  accountId?: string
  accountIds?: string[]
  accounts?: ConnectedSelectableAccount[]
}

export interface SelectableAccountView {
  platform: AccountType
  platformUid: string
  account?: string
  displayName: string
  avatarUrl?: string
  parentPlatformUid?: string
}

export interface SelectedAccountIdentity {
  platformUid: string
  account?: string
}

export interface EmptyAccountHintView {
  title: string
  description: string
  action?: {
    label: string
    url: string
  }
}

export interface AuthViewFields {
  platformDisplayName: string
  platformLogoUrl: string
  callbackUrl?: string
  redirectUri?: string
  emptyAccountHint?: EmptyAccountHintView
}

export interface AuthCallbackResult extends Partial<AuthViewFields> {
  accountId?: string
  requiresSelection?: boolean
  accounts?: SelectableAccountView[]
  connectedAccounts?: ConnectedSelectableAccount[]
  callbackResponseType?: AuthCallbackResponseType
}

export interface ConnectedSelectableAccount {
  accountId: string
  platform: AccountType
  platformUid: string
  account?: string
  displayName: string
  avatarUrl?: string
}

export interface ConnectSelectableAccountsResult {
  accountIds: string[]
  accounts: ConnectedSelectableAccount[]
  platformDisplayName: string
  platformLogoUrl: string
  callbackUrl?: string
  redirectUri?: string
}

export interface AuthSessionResult {
  sessionId: string
  status: ChannelAuthSessionStatus
  requiresSelection: boolean
  errorCode?: number
  expiresAt?: Date
  accountId?: string
  accountIds?: string[]
  accounts?: ConnectedSelectableAccount[]
  selectableAccounts?: SelectableAccountView[]
}
