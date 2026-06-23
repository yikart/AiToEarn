import type { AccountIdentity } from '@yikart/mongodb'
import type {
  AuthCallbackInput,
  CredentialContext,
  CredentialResult,
  GenerateAuthUrlInput,
  PlatformAccountCredentialSnapshot,
  PlatformAccountProfile,
  PlatformSelectableAccount,
} from '../platforms/platforms.interface'
import { Injectable, Logger, Optional } from '@nestjs/common'
import { AccountType, AppException, ChannelAuthSessionStatus, getLocale, ResponseCode } from '@yikart/common'
import { AccountGroupRepository, AccountRepository, AccountStatus, Transactional } from '@yikart/mongodb'
import { EventStream, EventStreamService, EventTopic } from '@yikart/redis'
import { nanoid } from 'nanoid'
import { UAParser } from 'ua-parser-js'
import { ServerRedisService } from '../../../common/redis'
import { CredentialService } from '../accounts/credential.service'
import { ChannelPlatformException, PlatformErrorCategory } from '../platforms/platforms.exception'
import { AuthCallbackResponseType, AuthType } from '../platforms/platforms.interface'
import { PlatformIntegrationRegistry } from '../platforms/platforms.registry'
import { RelayAccountException } from '../relay/relay-account.exception'
import { RelayAuthException } from '../relay/relay-auth.exception'
import { RelayClientService } from '../relay/relay-client.service'
import {
  AuthCallbackResult,
  AuthSession,
  AuthSessionResult,
  AuthViewFields,
  ChannelAuthSessionFlow,
  ConnectedSelectableAccount,
  ConnectSelectableAccountsResult,
  SelectableAccountView,
  SelectedAccountIdentity,
  StartAuthInput,
  StartAuthSessionResult,
} from './auth.interface'

const AUTH_RANDOM_ID_LENGTH = 16

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly registry: PlatformIntegrationRegistry,
    private readonly credentialService: CredentialService,
    private readonly accountRepo: AccountRepository,
    private readonly accountGroupRepo: AccountGroupRepository,
    private readonly redis: ServerRedisService,
    private readonly eventStream: EventStreamService,
    @Optional() private readonly relayClientService?: RelayClientService,
  ) {}

  async startAuth(input: StartAuthInput): Promise<StartAuthSessionResult> {
    const integration = this.getBackendAuthIntegration(input.platform)
    const provider = integration.auth!
    const sessionId = nanoid(AUTH_RANDOM_ID_LENGTH)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    const { browser, device, os } = UAParser(input.userAgent ?? '')
    const parsedDeviceType: GenerateAuthUrlInput['deviceType'] = device.type === 'mobile' || device.type === 'tablet'
      ? device.type
      : (!device.type && (browser.name || os.name) ? 'desktop' : 'unknown')
    const deviceType = input.deviceType ?? parsedDeviceType
    const groupId = await this.resolveGroupId(input.userId, input.groupId)

    const authInput: GenerateAuthUrlInput = {
      userId: input.userId,
      state: sessionId,
      deviceType,
    }

    const result = await provider.generateAuthUrl(authInput)

    const session: AuthSession = {
      flow: ChannelAuthSessionFlow.AccountAuth,
      id: sessionId,
      userId: input.userId,
      platform: input.platform,
      redirectUri: input.redirectUri,
      callbackUrl: input.callbackUrl,
      groupId,
      authExtras: result.extras,
      status: ChannelAuthSessionStatus.Pending,
      expiresAt,
      createdAt: new Date(),
    }

    await this.redis.saveChannelAuthSession(session.id, session)

    return {
      url: result.url,
      sessionId,
      expiresAt,
      authInstructions: integration.metadata.authInstructions,
    }
  }

  async completeCallback(
    platform: AccountType,
    callbackInput: Omit<AuthCallbackInput, 'session'>,
    sessionId: string,
  ): Promise<AuthCallbackResult> {
    const session = await this.redis.getChannelAuthSession<AuthSession>(sessionId)
    if (!this.isAccountAuthSessionRecord(session)) {
      throw new AppException(ResponseCode.ChannelAuthSessionInvalid)
    }
    if (this.isSessionExpired(session)) {
      throw new AppException(ResponseCode.ChannelAuthSessionInvalid)
    }
    if (session.platform !== platform) {
      throw new AppException(ResponseCode.ChannelAuthPlatformMismatch)
    }
    if (session.status !== ChannelAuthSessionStatus.Pending) {
      throw new AppException(ResponseCode.ChannelAuthSessionCompleted)
    }

    const provider = this.registry.getAuth(platform)
    const credentialResult = await provider.exchangeCode({
      ...callbackInput,
      session,
    })

    const credentialContext = credentialResult.accessToken
      ? this.toCredentialContext(credentialResult)
      : undefined
    const profile = credentialResult.profile
      ?? (credentialContext
        ? await provider.getProfile(credentialContext)
        : undefined)
    if (!profile) {
      throw new AppException(ResponseCode.ChannelAuthPlatformUidMissing)
    }
    const selectableAccounts = credentialResult.selectableAccounts
      ?? (!credentialResult.profile && credentialContext && provider.listSelectableAccounts
        ? await provider.listSelectableAccounts(credentialContext)
        : undefined)

    if (selectableAccounts) {
      const accounts = selectableAccounts
      if (accounts.length === 1) {
        const result = await this.connectSelectedAccountsForUser({
          userId: session.userId,
          platform: session.platform,
          selectableAccounts: accounts,
          selectedAccounts: [{
            platformUid: accounts[0].platformUid,
            account: accounts[0].account,
          }],
          groupId: session.groupId,
          source: 'auth',
          allowReassign: true,
        })

        session.status = ChannelAuthSessionStatus.Completed
        session.accountId = result.accountIds[0]
        session.accountIds = result.accountIds
        session.accounts = result.accounts
        await this.redis.saveChannelAuthSession(session.id, session)

        return {
          accountId: result.accountIds[0],
          connectedAccounts: result.accounts,
          callbackResponseType: credentialResult.callbackResponseType,
          ...this.getAuthViewFields(session),
        }
      }

      session.rootCredentialId = nanoid(AUTH_RANDOM_ID_LENGTH)
      session.selectableAccounts = accounts
      await this.redis.saveChannelAuthSession(session.id, session)

      return {
        requiresSelection: true,
        accounts: this.toSelectableAccountViews(accounts),
        callbackResponseType: credentialResult.callbackResponseType,
        ...this.getAuthViewFields(session),
      }
    }

    const connectedAccount = await this.connectAccountProfile({
      userId: session.userId,
      platform,
      profile,
      credential: credentialResult,
      groupId: session.groupId,
      source: 'auth',
      allowReassign: true,
    })
    const accountId = connectedAccount.accountId

    session.accountId = accountId
    session.accountIds = [accountId]
    session.accounts = [connectedAccount]
    session.status = ChannelAuthSessionStatus.Completed
    await this.redis.saveChannelAuthSession(session.id, session)

    return {
      accountId,
      connectedAccounts: session.accounts,
      callbackResponseType: credentialResult.callbackResponseType,
      ...this.getAuthViewFields(session),
    }
  }

  async connectSelectableAccounts(
    sessionId: string,
    selectedAccounts: SelectedAccountIdentity[],
  ): Promise<ConnectSelectableAccountsResult> {
    const session = await this.redis.getChannelAuthSession<AuthSession>(sessionId)
    if (!this.isAccountAuthSessionRecord(session) || this.isSessionExpired(session) || session.status !== ChannelAuthSessionStatus.Pending) {
      throw new AppException(ResponseCode.ChannelAuthSessionInvalid)
    }
    if (!session.selectableAccounts) {
      throw new AppException(ResponseCode.ChannelAuthSelectableAccountsNotFound)
    }

    const result = await this.connectSelectedAccountsForUser({
      userId: session.userId,
      platform: session.platform,
      selectableAccounts: session.selectableAccounts,
      selectedAccounts,
      groupId: session.groupId,
      source: 'auth',
      allowReassign: true,
    })

    session.status = ChannelAuthSessionStatus.Completed
    session.accountId = result.accountIds[0]
    session.accountIds = result.accountIds
    session.accounts = result.accounts
    delete session.rootCredentialId
    delete session.selectableAccounts
    await this.redis.saveChannelAuthSession(session.id, session)

    return {
      ...result,
      ...this.getAuthViewFields(session),
    }
  }

  async connectAccountProfile(input: {
    userId: string
    platform: AccountType
    profile: PlatformAccountProfile
    credential: CredentialResult
    groupId?: string
    source: string
    allowReassign?: boolean
  }): Promise<ConnectedSelectableAccount> {
    const connectedAccount = await this.saveAccountProfile(input)
    await this.emitAccountConnected(input.userId, connectedAccount.accountId, connectedAccount.platform, input.source)
    return connectedAccount
  }

  @Transactional()
  private async saveAccountProfile(input: {
    userId: string
    platform: AccountType
    profile: PlatformAccountProfile
    credential: CredentialResult
    groupId?: string
    source: string
    allowReassign?: boolean
  }): Promise<ConnectedSelectableAccount> {
    const groupId = await this.resolveGroupId(input.userId, input.groupId)
    const account = await this.createOrUpdateAccount({
      userId: input.userId,
      platform: input.platform,
      platformUid: input.profile.platformUid,
      account: input.profile.account,
      displayName: input.profile.displayName,
      avatarUrl: input.profile.avatarUrl,
      fansCount: input.profile.fansCount,
      followingCount: input.profile.followingCount,
      groupId,
      allowReassign: input.allowReassign ?? this.shouldReassignDouyinAccount(input.source, input.platform, input.credential),
    })

    if (!input.credential.accessToken) {
      throw new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    await this.credentialService.saveCredential(account.id, input.platform, {
      accessToken: input.credential.accessToken,
      refreshToken: input.credential.refreshToken,
      expiresAt: input.credential.expiresAt,
      scope: input.credential.scope,
      raw: input.credential.raw,
    })

    return {
      accountId: account.id,
      platform: input.platform,
      platformUid: input.profile.platformUid,
      account: input.profile.account,
      displayName: input.profile.displayName,
      avatarUrl: input.profile.avatarUrl,
    }
  }

  async connectSelectedAccountsForUser(input: {
    userId: string
    platform: AccountType
    selectableAccounts: PlatformSelectableAccount[]
    selectedAccounts: SelectedAccountIdentity[]
    groupId?: string
    source: string
    allowReassign?: boolean
  }): Promise<{ accountIds: string[], accounts: ConnectedSelectableAccount[] }> {
    const result = await this.saveSelectedAccountsForUser(input)
    await Promise.all(result.accounts.map(account => this.emitAccountConnected(input.userId, account.accountId, account.platform, input.source)))
    return result
  }

  @Transactional()
  private async saveSelectedAccountsForUser(input: {
    userId: string
    platform: AccountType
    selectableAccounts: PlatformSelectableAccount[]
    selectedAccounts: SelectedAccountIdentity[]
    groupId?: string
    source: string
    allowReassign?: boolean
  }): Promise<{ accountIds: string[], accounts: ConnectedSelectableAccount[] }> {
    if (input.selectedAccounts.length === 0) {
      throw new AppException(ResponseCode.ChannelAuthSelectionRequired)
    }

    const keyOf = (account: SelectedAccountIdentity) => `${account.platformUid}\u0000${account.account ?? ''}`
    const selectedAccounts = Array.from(
      new Map(input.selectedAccounts.map(account => [keyOf(account), account])).values(),
    )
    const selectableAccounts = new Map(
      input.selectableAccounts.map(account => [keyOf(account), account]),
    )
    const unknownAccount = selectedAccounts.find(account => !selectableAccounts.has(keyOf(account)))
    if (unknownAccount) {
      throw new AppException(ResponseCode.ChannelAuthSelectedAccountUnavailable)
    }

    const groupId = await this.resolveGroupId(input.userId, input.groupId)
    const accountIds: string[] = []
    const accounts: ConnectedSelectableAccount[] = []

    for (const selectedAccount of selectedAccounts) {
      const selectable = selectableAccounts.get(keyOf(selectedAccount))
      if (!selectable) {
        throw new AppException(ResponseCode.ChannelAuthSelectedAccountUnavailable)
      }

      const platform = selectable.platform ?? input.platform
      const account = await this.createOrUpdateAccount({
        userId: input.userId,
        platform,
        platformUid: selectable.platformUid,
        account: selectable.account,
        displayName: selectable.displayName,
        avatarUrl: selectable.avatarUrl,
        fansCount: selectable.fansCount,
        followingCount: selectable.followingCount,
        groupId,
        allowReassign: input.allowReassign,
      })

      if (selectable.credential) {
        await this.saveSelectableCredential(account.id, platform, selectable.credential)
      }

      accountIds.push(account.id)
      accounts.push({
        accountId: account.id,
        platform,
        platformUid: selectable.platformUid,
        account: selectable.account,
        displayName: selectable.displayName,
        avatarUrl: selectable.avatarUrl,
      })
    }

    if (accountIds.length === 0) {
      throw new AppException(ResponseCode.ChannelAuthSelectionRequired)
    }

    return { accountIds, accounts }
  }

  async listAccountOwnerIds(input: {
    platform: AccountType
    profile: PlatformAccountProfile
    selectableAccounts?: PlatformSelectableAccount[]
  }): Promise<string[]> {
    const owners = new Set<string>()
    const accountIdentities = new Map<string, { platform: AccountType, platformUid: string, account?: string }>()
    const addIdentity = (identity: { platform: AccountType, platformUid: string, account?: string }) => {
      accountIdentities.set(`${identity.platform}\u0000${identity.platformUid}\u0000${identity.account ?? ''}`, identity)
    }

    addIdentity({
      platform: input.platform,
      platformUid: input.profile.platformUid,
      account: input.profile.account,
    })
    for (const account of input.selectableAccounts ?? []) {
      addIdentity({
        platform: account.platform ?? input.platform,
        platformUid: account.platformUid,
        account: account.account,
      })
    }

    for (const identity of accountIdentities.values()) {
      const accountIdentity = identity.platform === AccountType.YouTube ? identity.account : undefined
      const account = await this.accountRepo.getByIdentity({
        type: identity.platform,
        uid: identity.platformUid,
        account: accountIdentity,
      })
      if (account?.userId) {
        owners.add(account.userId)
      }
    }

    return Array.from(owners)
  }

  async getAuthSessionResult(
    userId: string,
    platform: AccountType | undefined,
    sessionId: string,
  ): Promise<AuthSessionResult> {
    const session = await this.redis.getChannelAuthSession<AuthSession>(sessionId)
    if (!session || session.userId !== userId) {
      throw new AppException(ResponseCode.ChannelAuthSessionInvalid)
    }
    if (this.isSessionExpired(session)) {
      throw new AppException(ResponseCode.ChannelAuthSessionInvalid)
    }
    if (platform && session.platform !== platform) {
      throw new AppException(ResponseCode.ChannelAuthPlatformMismatch)
    }
    const expiresAt = this.getSessionExpiresAt(session)

    return {
      sessionId: session.id,
      status: session.status,
      requiresSelection: session.status === ChannelAuthSessionStatus.Pending
        && Boolean(session.selectableAccounts?.length),
      errorCode: session.errorCode,
      ...(expiresAt ? { expiresAt } : {}),
      accountId: session.accountId,
      accountIds: session.accountIds,
      accounts: session.accounts,
      selectableAccounts: session.selectableAccounts
        ? this.toSelectableAccountViews(session.selectableAccounts)
        : undefined,
    }
  }

  async markSessionFailed(sessionId: string, errorCode: number): Promise<void> {
    const session = await this.redis.getChannelAuthSession<AuthSession>(sessionId)
    if (!this.isAccountAuthSessionRecord(session) || this.isSessionExpired(session) || session.status !== ChannelAuthSessionStatus.Pending) {
      return
    }

    session.status = ChannelAuthSessionStatus.Failed
    session.errorCode = errorCode
    delete session.rootCredentialId
    delete session.selectableAccounts
    await this.redis.saveChannelAuthSession(session.id, session)
  }

  async getAccountAuthStatus(userId: string, platform: AccountType, accountId: string) {
    const account = await this.accountRepo.getByIdAndUserId(accountId, userId)
    if (!account) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    if (account.type !== platform) {
      throw new AppException(ResponseCode.ChannelAuthPlatformMismatch)
    }

    return { status: account.status }
  }

  async revokeCredential(accountId: string, userId: string): Promise<void> {
    const account = await this.getCredentialAccount(accountId, userId)
    const credential = await this.credentialService.getCredential(accountId)

    if (credential) {
      const provider = this.registry.getAuth(account.type)
      await provider.revoke?.({
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        platformUid: account.uid,
      })
    }

    const offlineAccount = await this.markAccountOfflineInStore(accountId, { deleteCredential: true })
    await this.credentialService.invalidateCredential(accountId)
    await this.emitAccountOffline(offlineAccount, accountId, 'revoked')
  }

  async getValidCredential(
    accountId: string,
    userId?: string,
  ): Promise<{ accessToken: string, refreshToken?: string, expiresAt?: Date, scope?: string }> {
    const account = await this.getCredentialAccount(accountId, userId)
    const credential = await this.credentialService.getCredential(accountId)
    if (!credential) {
      const error = new AppException(ResponseCode.ChannelCredentialNotFound, { accountId: account.id })
      await this.markAccountOfflineForCredentialFailure(account.id, error, 'credential_not_found')
      throw error
    }

    const expiresSoon = credential.expiresAt !== undefined
      && credential.expiresAt <= Math.floor(Date.now() / 1000) + 60
    const missingYouTubeExpiry = account.type === AccountType.YouTube
      && credential.expiresAt === undefined
      && !!credential.refreshToken

    if (!expiresSoon && !missingYouTubeExpiry) {
      return {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        expiresAt: credential.expiresAt === undefined ? undefined : new Date(credential.expiresAt * 1000),
        scope: credential.scope,
      }
    }

    let refreshed: Awaited<ReturnType<CredentialService['tryRefresh']>>
    try {
      refreshed = await this.credentialService.tryRefresh(account)
    }
    catch (error) {
      await this.markAccountOfflineForCredentialFailure(account.id, error, 'credential_refresh_failed')
      throw error
    }
    if (refreshed) {
      return {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
        scope: refreshed.scope,
      }
    }

    const deadline = Date.now() + 5000
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 250))
      const refreshedCredential = await this.credentialService.getCredential(accountId)
      const refreshedExpiresSoon = refreshedCredential?.expiresAt !== undefined
        && refreshedCredential.expiresAt <= Math.floor(Date.now() / 1000) + 60
      const refreshedMissingYouTubeExpiry = account.type === AccountType.YouTube
        && refreshedCredential?.expiresAt === undefined
        && !!refreshedCredential?.refreshToken
      if (
        refreshedCredential
        && !refreshedExpiresSoon
        && !refreshedMissingYouTubeExpiry
      ) {
        return {
          accessToken: refreshedCredential.accessToken,
          refreshToken: refreshedCredential.refreshToken,
          expiresAt: refreshedCredential.expiresAt === undefined ? undefined : new Date(refreshedCredential.expiresAt * 1000),
          scope: refreshedCredential.scope,
        }
      }
    }

    throw new AppException(ResponseCode.ChannelAccessTokenFailed)
  }

  async refreshCredential(
    accountId: string,
    userId?: string,
  ): Promise<{ accessToken: string, refreshToken?: string, expiresAt?: Date, scope?: string }> {
    const refreshed = await this.tryRefreshCredential(accountId, userId)
    if (!refreshed) {
      throw new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    return {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt,
      scope: refreshed.scope,
    }
  }

  async tryRefreshCredential(
    accountId: string,
    userId?: string,
  ): Promise<{ accessToken: string, refreshToken?: string, expiresAt?: Date, scope?: string } | null> {
    const account = await this.getCredentialAccount(accountId, userId)
    let refreshed: Awaited<ReturnType<CredentialService['tryRefresh']>>
    try {
      refreshed = await this.credentialService.tryRefresh(account)
    }
    catch (error) {
      await this.markAccountOfflineForCredentialFailure(account.id, error, 'credential_refresh_failed')
      throw error
    }
    if (!refreshed) {
      return null
    }

    return {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt,
      scope: refreshed.scope,
    }
  }

  private async getCredentialAccount(accountId: string, userId?: string) {
    const account = userId
      ? await this.accountRepo.getByIdAndUserId(accountId, userId)
      : await this.accountRepo.getAccountById(accountId)
    if (!account) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    if (account.status === AccountStatus.ABNORMAL) {
      throw new AppException(ResponseCode.ChannelAccountNotAuthorized)
    }
    return account
  }

  async markAccountOfflineForCredentialFailure(
    accountId: string,
    error: unknown,
    reason = 'platform_auth_failed',
  ): Promise<boolean> {
    if (!this.isCredentialFailure(error)) {
      return false
    }
    try {
      await this.markAccountOffline(accountId, reason)
      return true
    }
    catch (markError) {
      this.logger.warn(error, `Credential failure for account ${accountId}`)
      this.logger.warn(markError, `Failed to mark account ${accountId} offline after credential failure`)
      return false
    }
  }

  private isCredentialFailure(error: unknown): boolean {
    if (error instanceof ChannelPlatformException) {
      if (error.retryable) {
        return false
      }
      return error.category === PlatformErrorCategory.Auth
    }
    if (error instanceof AppException) {
      const credentialCodes: ResponseCode[] = [
        ResponseCode.ChannelCredentialNotFound,
        ResponseCode.ChannelRefreshTokenFailed,
        ResponseCode.ChannelRefreshTokenExpired,
        ResponseCode.ChannelRefreshTokenNotFound,
        ResponseCode.ChannelAccessTokenFailed,
        ResponseCode.ChannelPlatformTokenNotFound,
      ]
      return credentialCodes.includes(error.code)
    }
    return false
  }

  async markAccountOffline(accountId: string, reason: string): Promise<void> {
    const account = await this.markAccountOfflineInStore(accountId)
    await this.credentialService.invalidateCredential(accountId)
    await this.emitAccountOffline(account, accountId, reason)
  }

  @Transactional()
  private async markAccountOfflineInStore(accountId: string, options?: { deleteCredential?: boolean }) {
    await this.accountRepo.updateById(accountId, { status: AccountStatus.ABNORMAL })
    if (options?.deleteCredential) {
      await this.credentialService.deleteCredentialRecord(accountId)
    }
    return this.accountRepo.getAccountById(accountId)
  }

  private async emitAccountOffline(
    account: Awaited<ReturnType<AccountRepository['getAccountById']>>,
    accountId: string,
    reason: string,
  ): Promise<void> {
    if (account) {
      await this.eventStream.emit(
        EventStream.Channels,
        EventTopic.ChannelsAccountOffline,
        { accountId, platform: account.type, reason },
        { source: 'auth' },
      )
    }
  }

  private async createOrUpdateAccount(input: {
    userId: string
    platform: AccountType
    platformUid: string
    account?: string
    displayName: string
    avatarUrl?: string
    fansCount?: number
    followingCount?: number
    groupId: string
    allowReassign?: boolean
  }) {
    const accountIdentity = input.platform === AccountType.YouTube ? input.account : undefined
    const identity: AccountIdentity = {
      type: input.platform,
      uid: input.platformUid,
      account: accountIdentity,
    }
    const accountData = {
      userId: input.userId,
      type: input.platform,
      uid: input.platformUid,
      account: input.account,
      nickname: input.displayName,
      avatar: input.avatarUrl,
      status: AccountStatus.NORMAL,
      groupId: input.groupId,
      fansCount: input.fansCount,
      followingCount: input.followingCount,
    }
    let account = await this.accountRepo.getByIdentity(identity)
    let created = false
    if (!account) {
      account = await this.accountRepo.createByIdentity(identity, accountData)
      created = true
    }
    if (!created && account && (account.userId === input.userId || !account.userId || input.allowReassign)) {
      account = await this.accountRepo.updateByIdentity(identity, accountData) ?? account
    }

    if (!account) {
      throw new AppException(ResponseCode.AccountCreateFailed)
    }
    if (account.userId !== input.userId) {
      this.logger.warn(
        { input, existingAccount: account },
        'Channel account already connected to another user',
      )
      throw new AppException(ResponseCode.ChannelAccountAlreadyConnectedToAnotherUser)
    }

    return account
  }

  private async saveSelectableCredential(
    accountId: string,
    platform: AccountType,
    credential: PlatformAccountCredentialSnapshot,
  ): Promise<void> {
    await this.credentialService.saveCredential(accountId, platform, {
      accessToken: credential.accessToken,
      refreshToken: credential.refreshToken,
      expiresAt: credential.expiresAt,
      scope: credential.scope,
    })
  }

  private async emitAccountConnected(
    userId: string,
    accountId: string,
    platform: AccountType,
    source: string,
  ): Promise<void> {
    await this.eventStream.emit(
      EventStream.Channels,
      EventTopic.ChannelsAccountConnected,
      { userId, accountId, platform },
      { source },
    )
  }

  private shouldReassignDouyinAccount(source: string, platform: AccountType, credential: CredentialResult) {
    return source === 'auth'
      && platform === AccountType.Douyin
      && credential.callbackResponseType === AuthCallbackResponseType.Json
  }

  private toCredentialContext(credential: CredentialResult): CredentialContext {
    if (!credential.accessToken) {
      throw new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    return {
      accessToken: credential.accessToken,
      refreshToken: credential.refreshToken,
      expiresAt: credential.expiresAt,
      scope: credential.scope,
      platformUid: credential.platformUid,
    }
  }

  getPlatformAuthViewFields(platform: AccountType): Pick<AuthViewFields, 'platformDisplayName' | 'platformLogoUrl'> {
    const integration = this.registry.get(platform)
    const locale = getLocale()
    return {
      platformDisplayName: integration.metadata.displayName[locale],
      platformLogoUrl: integration.metadata.logoUrl,
    }
  }

  private isSessionExpired(session: AuthSession): boolean {
    const expiresAt = this.getSessionExpiresAt(session)
    return !!expiresAt && expiresAt.getTime() <= Date.now()
  }

  private isAccountAuthSessionRecord(session: unknown): session is AuthSession {
    return Boolean(
      session
      && typeof session === 'object'
      && !Array.isArray(session)
      && (session as { flow?: unknown }).flow === ChannelAuthSessionFlow.AccountAuth,
    )
  }

  private getSessionExpiresAt(session: AuthSession): Date | undefined {
    if (!session.expiresAt) {
      return undefined
    }

    return session.expiresAt instanceof Date
      ? session.expiresAt
      : new Date(session.expiresAt)
  }

  private toSelectableAccountViews(accounts: PlatformSelectableAccount[]): SelectableAccountView[] {
    return accounts.map(account => ({
      platform: account.platform,
      platformUid: account.platformUid,
      account: account.account,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      parentPlatformUid: account.parentPlatformUid,
    }))
  }

  private getAuthViewFields(session: AuthSession): AuthViewFields {
    const integration = this.registry.get(session.platform)
    const locale = getLocale()
    const emptyAccountHint = integration.metadata.emptyAccountHint
    return {
      ...this.getPlatformAuthViewFields(session.platform),
      callbackUrl: session.callbackUrl,
      redirectUri: session.redirectUri,
      emptyAccountHint: emptyAccountHint
        ? {
            title: emptyAccountHint.title[locale],
            description: emptyAccountHint.description[locale],
            action: emptyAccountHint.action
              ? {
                  label: emptyAccountHint.action.label[locale],
                  url: emptyAccountHint.action.url,
                }
              : undefined,
          }
        : undefined,
    }
  }

  private getBackendAuthIntegration(platform: AccountType) {
    if (!this.registry.has(platform)) {
      throw new AppException(ResponseCode.PlatformNotSupported, { platform })
    }

    if (this.relayClientService?.enabled) {
      throw new RelayAuthException()
    }

    const integration = this.registry.get(platform)
    if (integration.metadata.authType === AuthType.Plugin) {
      throw new AppException(ResponseCode.PlatformNotSupported, { platform })
    }
    if (!integration.auth) {
      throw new AppException(ResponseCode.PlatformNotSupported, { platform, capability: 'auth' })
    }
    return integration
  }

  async resolveGroupId(userId: string, groupId?: string): Promise<string> {
    if (groupId) {
      const group = await this.accountGroupRepo.getById(groupId)
      if (!group || group.userId !== userId) {
        throw new AppException(ResponseCode.AccountGroupNotFound)
      }
      return groupId
    }

    const defaultGroup = await this.accountGroupRepo.getDefaultGroup(userId)
    return defaultGroup.id
  }
}
