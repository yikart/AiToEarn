import type { Account, AccountIdentity } from '@yikart/mongodb'
import { Injectable, Logger, Optional } from '@nestjs/common'
import { AccountType, AppException, ResponseCode, TableDto } from '@yikart/common'
import { AccountGroupRepository, AccountRepository, AccountStatus, ClientType, Transactional } from '@yikart/mongodb'
import { EventStream, EventStreamService, EventTopic } from '@yikart/redis'
import { RelayClientService } from '../../relay/relay-client.service'
import { AuthType, PlatformStatus } from '../platforms/platforms.interface'
import { PlatformIntegrationRegistry } from '../platforms/platforms.registry'
import { WeChatService } from '../platforms/wechat/wechat.service'
import { ChannelAccountListQueryDto } from './account.dto'
import { CredentialService } from './credential.service'

interface AccountCreateInput {
  refresh_token?: string
  access_token?: string
  type: AccountType
  clientType?: Account['clientType']
  loginCookie?: string
  loginTime?: Date
  uid?: string
  account?: string
  token?: string
  avatar?: string
  nickname?: string
  fansCount?: number
  followingCount?: number
  readCount?: number
  likeCount?: number
  collectCount?: number
  forwardCount?: number
  commentCount?: number
  lastStatsTime?: Date
  workCount?: number
  income?: number
  groupId?: string
  relayAccountRef?: string | null
}

interface AccountStatisticsUpdateData {
  fansCount?: number
  followingCount?: number
  readCount?: number
  likeCount?: number
  collectCount?: number
  forwardCount?: number
  commentCount?: number
  income?: number
  workCount?: number
}

interface AccountFilter {
  userId?: string
  types?: AccountType[]
}

type NormalizedAccountCreateInput = AccountCreateInput & {
  uid: string
  nickname: string
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name)

  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountGroupRepository: AccountGroupRepository,
    private readonly platformRegistry: PlatformIntegrationRegistry,
    private readonly eventStream: EventStreamService,
    @Optional() private readonly credentialService?: CredentialService,
    @Optional() private readonly wechatService?: WeChatService,
    @Optional() private readonly relayClientService?: RelayClientService,
  ) {}

  async addAccount(userId: string, data: AccountCreateInput): Promise<Account> {
    const account = await this.createPluginAccount(userId, data)
    await this.emitAccountConnected(userId, account)
    return account
  }

  @Transactional()
  private async createPluginAccount(userId: string, data: AccountCreateInput): Promise<Account> {
    const integration = this.platformRegistry.has(data.type)
      ? this.platformRegistry.get(data.type)
      : undefined
    const status = integration?.status ?? PlatformStatus.Available
    if (!integration || status !== PlatformStatus.Available || integration.metadata.authType !== AuthType.Plugin) {
      throw new AppException(ResponseCode.ChannelAccountCreateNotSupported)
    }

    const normalizedData = await this.normalizeCreateInput(data)
    const groupId = await this.resolveWritableGroupId(userId, data.groupId)
    return this.saveWritableAccount(
      {
        type: normalizedData.type,
        uid: normalizedData.uid,
        account: normalizedData.account,
        clientType: normalizedData.clientType,
      },
      {
        groupId,
        userId,
        status: AccountStatus.NORMAL,
        ...normalizedData,
      },
      userId,
    )
  }

  async list(userId: string, query: ChannelAccountListQueryDto): Promise<{ total: number, list: Account[] }> {
    if (query.ids?.length) {
      const accounts = await this.accountRepository.listByUserIdAndIds(userId, query.ids)
      return { total: accounts.length, list: await this.withRelayAccounts(accounts) }
    }

    if (query.spaceIds?.length) {
      const accounts = await this.accountRepository.listBySpaceIds(userId, query.spaceIds)
      return { total: accounts.length, list: await this.withRelayAccounts(accounts) }
    }

    if (query.types?.length || query.status !== undefined || query.groupId) {
      const result = await this.accountRepository.listByFilterWithPagination(
        { pageNo: 1, pageSize: 1000 },
        {
          userId,
          status: query.status,
          types: query.types,
          groupIds: query.groupId ? [query.groupId] : undefined,
        },
      )
      return {
        total: result.total,
        list: await this.withRelayAccounts(result.list as Account[]),
      }
    }

    const accounts = await this.accountRepository.getUserAccounts(userId)
    return { total: accounts.length, list: await this.withRelayAccounts(accounts) }
  }

  async getById(userId: string, accountId: string): Promise<Account> {
    const account = await this.getOwnedAccount(userId, accountId)
    return this.withRelayAccount(account)
  }

  @Transactional()
  async delete(userId: string, accountId: string): Promise<boolean> {
    await this.getOwnedAccount(userId, accountId)
    const deleted = await this.accountRepository.deleteByIdAndUserId(accountId, userId)
    if (deleted) {
      await this.credentialService?.deleteCredential(accountId)
    }
    return deleted
  }

  @Transactional()
  async deleteMany(userId: string, accountIds: string[]): Promise<void> {
    const accounts = await this.accountRepository.listByUserIdAndIds(userId, accountIds)
    const ownedAccountIds = accounts
      .map(account => account.id || account._id)
      .filter((accountId): accountId is string => Boolean(accountId))
    if (!ownedAccountIds.length) {
      return
    }

    const deleted = await this.accountRepository.deleteByUserIdAndIds(userId, ownedAccountIds)
    if (deleted) {
      await Promise.all(ownedAccountIds.map(accountId => this.credentialService?.deleteCredential(accountId)))
    }
  }

  async getAuthStatus(userId: string, accountId: string): Promise<{ status: AccountStatus }> {
    const account = await this.getById(userId, accountId)
    return { status: account.status }
  }

  async getOwnedAccount(userId: string, accountId: string): Promise<Account> {
    const account = await this.accountRepository.getByIdAndUserId(accountId, userId)
    if (!account) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    return account
  }

  @Transactional()
  async updateAccountInfoById(userId: string, id: string, account: {
    nickname?: string
    avatar?: string
    groupId?: string
  }): Promise<Account> {
    const oldInfo = await this.accountRepository.getByIdAndUserId(id, userId)
    if (!oldInfo) {
      throw new AppException(ResponseCode.AccountNotFound)
    }

    const update: Partial<Account> = {}
    if (account.nickname !== undefined) {
      update.nickname = account.nickname
    }
    if (account.avatar !== undefined) {
      update.avatar = account.avatar
    }
    if (account.groupId !== undefined) {
      update.groupId = await this.resolveWritableGroupId(userId, account.groupId)
    }
    if (Object.keys(update).length === 0) {
      return oldInfo
    }

    const updated = await this.accountRepository.updateById(id, update)
    if (!updated) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    return updated
  }

  async getAccountById(id: string) {
    return this.accountRepository.getAccountById(id)
  }

  async getUserAccounts(userId: string) {
    return this.accountRepository.getUserAccounts(userId)
  }

  async getAccounts(filter: AccountFilter, pageInfo: TableDto) {
    return this.accountRepository.getAccounts(filter, pageInfo)
  }

  async listByUserIdAndIds(userId: string, ids: string[]) {
    return this.accountRepository.listByUserIdAndIds(userId, ids)
  }

  async getAccountListByIds(ids: string[]) {
    return this.accountRepository.getAccountListByIds(ids)
  }

  async getAccountListByGroupId(groupId: string) {
    return this.accountRepository.getAccountListByGroupId(groupId)
  }

  async getAccountListByUserIdAndGroupId(userId: string, groupId: string) {
    return this.accountRepository.listByUserIdAndGroupId(userId, groupId)
  }

  async getUserAccountCount(userId: string) {
    return this.accountRepository.getUserAccountCount(userId)
  }

  async getUserTotalFansCount(userId: string) {
    return this.accountRepository.getByUserIdTotalFansCount(userId)
  }

  async getAccountsByIds(ids: string[]) {
    return this.accountRepository.getAccountsByIds(ids)
  }

  async deleteUserAccount(id: string, userId: string): Promise<boolean> {
    return this.accountRepository.deleteByIdAndUserId(id, userId)
  }

  async deleteUserAccounts(ids: string[], userId: string) {
    return this.accountRepository.deleteByUserIdAndIds(userId, ids)
  }

  async updateAccountStatus(id: string, status: AccountStatus) {
    return this.accountRepository.updateAccountStatus(id, status)
  }

  async updateAccountStatistics(id: string, data: AccountStatisticsUpdateData) {
    const validData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => {
        if (value === undefined) {
          return false
        }
        if (key === 'fansCount') {
          return value > 0
        }
        return true
      }),
    ) as AccountStatisticsUpdateData

    if (Object.keys(validData).length === 0) {
      return false
    }

    return this.accountRepository.updateAccountStatistics(id, validData)
  }

  async createRelayAccount(userId: string, data: {
    type: AccountType
    uid: string
    nickname: string
    avatar?: string
    relayAccountRef: string
  }): Promise<Account> {
    const account = await this.createRelayAccountRecord(userId, data)
    await this.emitAccountConnected(userId, account)
    return account
  }

  @Transactional()
  private async createRelayAccountRecord(userId: string, data: {
    type: AccountType
    uid: string
    nickname: string
    avatar?: string
    relayAccountRef: string
  }): Promise<Account> {
    const groupId = await this.resolveGroupId(userId)
    return this.saveWritableAccount(
      { type: data.type, uid: data.uid },
      {
        userId,
        type: data.type,
        uid: data.uid,
        nickname: data.relayAccountRef,
        status: AccountStatus.NORMAL,
        groupId,
        relayAccountRef: data.relayAccountRef,
      },
      userId,
    )
  }

  async getAccountByParam(param: { [key: string]: string }) {
    return this.accountRepository.getAccountByParam(param)
  }

  async listByIds(ids: string[]) {
    return this.accountRepository.listByIds(ids)
  }

  async listBySpaceIds(userId: string, spaceIds: string[]) {
    return this.accountRepository.listBySpaceIds(userId, spaceIds)
  }

  async getAccountsByTypes(types: AccountType[], status?: AccountStatus) {
    return this.accountRepository.getAccountsByTypes(types, status)
  }

  async sortRank(userId: string, groupId: string, list: { id: string, rank: number }[]) {
    return this.accountRepository.updateManyRankByIds(userId, groupId, list)
  }

  private async resolveWritableGroupId(userId: string, groupId?: string): Promise<string> {
    if (!groupId) {
      const group = await this.accountGroupRepository.getDefaultGroup(userId)
      return group.id
    }

    const groups = await this.accountGroupRepository.getAccountGorupListByIds([groupId], userId)
    if (groups.length === 0) {
      throw new AppException(ResponseCode.AccountGroupNotFound)
    }
    return groupId
  }

  private async resolveGroupId(userId: string): Promise<string> {
    const group = await this.accountGroupRepository.getDefaultGroup(userId)
    return group.id
  }

  private async withRelayAccount(account: Account): Promise<Account> {
    const [resolved] = await this.withRelayAccounts([account])
    return resolved ?? account
  }

  private async withRelayAccounts(accounts: Account[]): Promise<Account[]> {
    const relayAccounts = accounts.filter(account => account.relayAccountRef)
    if (relayAccounts.length === 0) {
      return accounts
    }
    if (!this.relayClientService?.enabled) {
      return accounts.map(account => account.relayAccountRef
        ? this.toUnavailableRelayAccount(account)
        : account)
    }

    try {
      const result = await this.relayClientService.get<{ list?: Account[] }>(
        '/v2/channels/accounts',
        { ids: relayAccounts.map(account => account.relayAccountRef).filter(Boolean) },
      )
      const relayById = new Map((result.list ?? []).map(account => [account.id, account]))
      return accounts.map(account => this.mergeRelayAccount(account, relayById))
    }
    catch (error) {
      this.logger.error(error, 'Fetch relay accounts failed')
      return accounts.map(account => account.relayAccountRef
        ? this.toUnavailableRelayAccount(account)
        : account)
    }
  }

  private mergeRelayAccount(account: Account, relayById: Map<string, Account>): Account {
    if (!account.relayAccountRef) {
      return account
    }

    const relayAccount = relayById.get(account.relayAccountRef)
    if (!relayAccount) {
      return this.toUnavailableRelayAccount(account)
    }

    return {
      ...relayAccount,
      _id: account._id,
      id: account.id,
      userId: account.userId,
      groupId: account.groupId,
      relayAccountRef: account.relayAccountRef,
    }
  }

  private toUnavailableRelayAccount(account: Account): Account {
    const relayAccountRef = account.relayAccountRef ?? account.id
    return {
      ...account,
      uid: account.uid || relayAccountRef,
      nickname: relayAccountRef,
      status: AccountStatus.ABNORMAL,
    }
  }

  private async saveWritableAccount(
    identity: AccountIdentity,
    accountData: Partial<Account>,
    userId: string,
  ): Promise<Account> {
    let account = await this.accountRepository.getByIdentity(identity)
    let created = false
    if (!account) {
      account = await this.accountRepository.createByIdentity(identity, accountData)
      created = true
    }

    if (!account) {
      throw new AppException(ResponseCode.AccountCreateFailed)
    }
    if (!created && (account.userId === userId || !account.userId)) {
      account = await this.accountRepository.updateByIdentity(identity, accountData) ?? account
    }
    if (account.userId !== userId) {
      throw new AppException(ResponseCode.ChannelAccountAlreadyConnectedToAnotherUser)
    }

    return account
  }

  private async emitAccountConnected(userId: string, account: Account): Promise<void> {
    await this.eventStream.emit(
      EventStream.Channels,
      EventTopic.ChannelsAccountConnected,
      { userId, accountId: account.id, platform: account.type },
      { source: 'account-service' },
    )
  }

  private async normalizeCreateInput(data: AccountCreateInput): Promise<NormalizedAccountCreateInput> {
    if (data.type === AccountType.WeChatChannels) {
      return this.normalizeWeChatChannelsCreateInput(data)
    }

    if (!data.uid || !data.nickname) {
      throw new AppException(ResponseCode.ChannelAccountCreateRequiredFieldMissing, {
        fields: [
          ...(!data.uid ? ['uid'] : []),
          ...(!data.nickname ? ['nickname'] : []),
        ],
      })
    }

    const normalizedData: NormalizedAccountCreateInput = {
      ...data,
      uid: data.uid,
      nickname: data.nickname,
    }
    if (normalizedData.type === AccountType.RedNote && normalizedData.clientType === undefined) {
      normalizedData.clientType = ClientType.WEB
    }
    return normalizedData
  }

  private async normalizeWeChatChannelsCreateInput(data: AccountCreateInput): Promise<NormalizedAccountCreateInput> {
    if (!data.loginCookie) {
      throw new AppException(ResponseCode.ChannelAccountCreateRequiredFieldMissing, {
        fields: ['loginCookie'],
      })
    }
    if (!this.wechatService) {
      throw new AppException(ResponseCode.ChannelAccountCreateNotSupported)
    }

    const authData = await this.wechatService.getChannelsAuthData(data.loginCookie)
    if (!authData.uid) {
      throw new AppException(ResponseCode.ChannelPlatformResponseInvalid)
    }
    if (data.uid && data.uid !== authData.uid) {
      throw new AppException(ResponseCode.ChannelPlatformResponseInvalid)
    }

    const normalizedData = { ...data }
    delete normalizedData.uid
    delete normalizedData.account
    delete (normalizedData as Record<string, unknown>)['channelId']

    return {
      ...normalizedData,
      uid: authData.uid,
      nickname: data.nickname ?? authData.nickname ?? authData.uid,
      avatar: data.avatar ?? authData.avatar,
      fansCount: data.fansCount ?? authData.fansCount,
      followingCount: data.followingCount ?? authData.followingCount,
      readCount: data.readCount ?? authData.readCount,
      likeCount: data.likeCount ?? authData.likeCount,
      collectCount: data.collectCount ?? authData.collectCount,
      forwardCount: data.forwardCount ?? authData.forwardCount,
      commentCount: data.commentCount ?? authData.commentCount,
      workCount: data.workCount ?? authData.workCount,
      lastStatsTime: data.lastStatsTime ?? new Date(),
    }
  }
}
