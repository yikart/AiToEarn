import { Injectable, Logger } from '@nestjs/common'
import { AccountType, AppException, ResponseCode, TableDto } from '@yikart/common'
import { Account, AccountGroup, AccountGroupRepository, AccountRepository, AccountStatus } from '@yikart/mongodb'
import { AccountPortraitReportData } from '../channel/common'
import { AccountStatsData, PlatformService } from '../channel/platforms/platforms.service'
import { AccountFilterDto, CreateAccountDto } from './account.dto'

const REFRESH_COOLDOWN_MS = 10 * 60 * 1000

type AccountStatisticsUpdateData = AccountStatsData & {
  income?: number
}

@Injectable()
export class AccountService {
  logger = new Logger(AccountService.name)

  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountGroupRepository: AccountGroupRepository,
    private readonly platformService: PlatformService,
  ) { }

  /**
   * Account data reporting
   * @param data
   */
  private async accountPortraitReport(
    _data: AccountPortraitReportData,
  ) {
    // Task module removed — no-op
  }

  /**
   * Switch accounts under user group to default group
   * @param userId
   * @param groupId
   * @param defaultGroupId
   */
  async switchToDefaultGroup(
    userId: string,
    groupId: string,
    defaultGroupId: string,
  ) {
    return this.accountRepository.updateManyToDefaultGroup(
      userId,
      groupId,
      defaultGroupId,
    )
  }

  async addAccount(userId: string, data: CreateAccountDto): Promise<Account | null> {
    let group = null
    if (!data.groupId) {
      group = await this.accountGroupRepository.getDefaultGroup(
        userId,
      )
    }
    else {
      group = await this.accountGroupRepository.getById(data.groupId)
      if (!group) {
        throw new AppException(ResponseCode.AccountGroupNotFound, 'Group not found')
      }
    }
    data.groupId = group.id

    const info: Account | null = await this.accountRepository.createOrUpdateById({
      type: data.type,
      uid: data.uid,
    }, {
      userId,
      ...data,
    })
    if (!info)
      throw new AppException(ResponseCode.AccountCreateFailed, 'Account create failed')

    // 创建之后的处理

    try {
      this.accountPortraitReport({
        accountId: info.id,
        userId: info.userId,
        type: info.type,
        uid: info.uid,
        avatar: info.avatar,
        nickname: info.nickname,
        status: AccountStatus.NORMAL,
        totalFollowers: info.fansCount,
        totalWorks: info.workCount,
        totalViews: info.readCount,
        totalLikes: info.likeCount,
        totalCollects: info.collectCount,
        countryCode: group.countryCode,
      })
    }
    catch (error) {
      this.logger.error(error)
    }

    return info
  }

  /**
   * Update account information
   * @param id
   * @param account
   * @returns
   */
  async updateAccountInfoById(
    id: string,
    account: Partial<Account>,
  ): Promise<boolean> {
    const oldInfo = await this.getAccountById(id)
    if (!oldInfo)
      return false

    const info = await this.accountRepository.updateById(id, account)
    if (!info)
      return false

    const group = await this.accountGroupRepository.getById(info.groupId)
    if (!group) {
      throw new AppException(ResponseCode.AccountGroupNotFound, 'Group not found')
    }

    try {
      await this.accountPortraitReport({
        accountId: id,
        userId: info.userId,
        type: info.type,
        uid: info.uid,
        avatar: info.avatar,
        nickname: info.nickname,
        status: info.status,
        totalFollowers: info.fansCount,
        totalWorks: info.workCount,
        totalViews: info.readCount,
        totalLikes: info.likeCount,
        totalCollects: info.collectCount,
        countryCode: group.countryCode,
      })
    }
    catch (error) {
      this.logger.error(error)
    }

    return true
  }

  /**
   * Get account by user ID
   */
  async getAccountById(id: string) {
    return this.accountRepository.getAccountById(id)
  }

  /**
   * Get all accounts
   * @param userId
   * @returns
   */
  async getUserAccounts(userId: string) {
    const accounts = await this.accountRepository.getUserAccounts(userId)

    const accountMap: { [key: string]: Account } = {}
    for (const account of accounts) {
      accountMap[account.id] = account
    }
    return accounts
  }

  /**
   * Get all accounts
   * @param filterDto
   * @param pageInfo
   * @returns
   */
  async getAccounts(filterDto: AccountFilterDto, pageInfo: TableDto) {
    return this.accountRepository.getAccounts(filterDto, pageInfo)
  }

  /**
   * Get account list array by ID array ids
   * @param userId
   * @param ids
   * @returns
   */
  async getAccountListByIdsOfUser(userId: string, ids: string[]) {
    return this.accountRepository.getAccountListByIdsOfUser(userId, ids)
  }

  /**
   * Get account list array by ID array ids
   * @param ids
   * @returns
   */
  async getAccountListByIds(ids: string[]) {
    return this.accountRepository.getAccountListByIds(ids)
  }

  /**
   * Get account list by group id
   * @param groupId
   * @returns
   */
  async getAccountListByGroupId(groupId: string) {
    return this.accountRepository.getAccountListByGroupId(groupId)
  }

  /**
   * Get account list by user ID and group ID
   * @param userId
   * @param groupId
   * @returns
   */
  async getAccountListByUserIdAndGroupId(userId: string, groupId: string) {
    return this.accountRepository.listByUserIdAndGroupId(userId, groupId)
  }

  /**
   * Get account statistics
   * @param userId
   * @param type
   * @returns
   */
  async getAccountStatistics(
    userId: string,
    type?: AccountType,
  ): Promise<{
    accountTotal: number
    list: Account[]
    fansCount?: number
    readCount?: number
    likeCount?: number
    collectCount?: number
    commentCount?: number
    income?: number
  }> {
    return this.accountRepository.getAccountStatistics(userId, type)
  }

  /**
   * Get user's total account count
   * @param userId
   * @returns
   */
  async getUserAccountCount(userId: string) {
    return await this.accountRepository.getUserAccountCount(userId)
  }

  async getUserTotalFansCount(userId: string) {
    return this.accountRepository.getByUserIdTotalFansCount(userId)
  }

  /**
   * Get account information by multiple account IDs
   * @param ids
   * @returns
   */
  async getAccountsByIds(ids: string[]) {
    return await this.accountRepository.getAccountsByIds(ids)
  }

  /**
   * Delete
   * @param id
   * @param userId
   * @returns
   */
  async deleteUserAccount(id: string, userId: string): Promise<boolean> {
    return await this.accountRepository.deleteByIdAndUserId(id, userId)
  }

  // Delete multiple accounts
  async deleteUserAccounts(ids: string[], userId: string) {
    return await this.accountRepository.deleteManyByIds(ids, userId)
  }

  /**
   * Update channel status
   * @param id
   * @param status
   * @returns
   */
  async updateAccountStatus(id: string, status: AccountStatus) {
    const res = await this.accountRepository.updateAccountStatus(id, status)
    return res
  }

  async updateAccountStatistics(
    id: string,
    data: AccountStatisticsUpdateData,
  ) {
    const validData = this.pickValidAccountStatistics(data)
    if (Object.keys(validData).length === 0) {
      return false
    }

    const res = await this.accountRepository.updateAccountStatistics(id, validData)
    if (res) {
      const accountInfo = await this.accountRepository.getAccountById(id)
      if (!accountInfo)
        return false

      const group = accountInfo.groupId
        ? await this.accountGroupRepository.getById(accountInfo.groupId)
        : null
      this.accountPortraitReport({
        accountId: accountInfo.id,
        userId: accountInfo.userId,
        type: accountInfo.type as AccountType,
        uid: accountInfo.uid,
        avatar: accountInfo.avatar,
        nickname: accountInfo.nickname,
        status: accountInfo.status,
        totalFollowers: accountInfo.fansCount,
        totalWorks: accountInfo.workCount,
        totalViews: accountInfo.readCount,
        totalLikes: accountInfo.likeCount,
        totalCollects: accountInfo.collectCount,
        countryCode: group?.countryCode,
      })
    }

    return res
  }

  private pickValidAccountStatistics(data: AccountStatisticsUpdateData): AccountStatisticsUpdateData {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => (
        typeof value === 'number' && Number.isFinite(value)
      )),
    ) as AccountStatisticsUpdateData
  }

  /**
   * Get account by query parameters
   */
  async getAccountByParam(param: { [key: string]: string }) {
    const res = await this.accountRepository.getAccountByParam(param)
    return res
  }

  async listByIds(ids: string[]) {
    const res = await this.accountRepository.listByIds(ids)
    return res
  }

  /**
   * Get account list array by space ID array spaceIds
   * @param userId
   * @param spaceIds
   * @returns
   */
  async listBySpaceIds(userId: string, spaceIds: string[]) {
    const res = await this.accountRepository.listBySpaceIds(userId, spaceIds)
    return res
  }

  /**
   * Get all accounts by type array
   * @param types
   * @param status
   * @returns
   */
  async getAccountsByTypes(types: string[], status?: number) {
    const res = await this.accountRepository.getAccountsByTypes(types, status)
    return res
  }

  async sortRank(userId: string, groupId: string, list: { id: string, rank: number }[]) {
    const res = await this.accountRepository.updateManyRankByIds(userId, groupId, list)
    return res
  }

  async reportGroupAccounts(userId: string, group: AccountGroup) {
    const cursor = await this.accountRepository.getAccountCursor({ userId, groupId: group.id })
    for (let account = await cursor.next(); account !== null; account = await cursor.next()) {
      this.accountPortraitReport({
        accountId: account.id,
        userId: account.userId,
        type: account.type as AccountType,
        uid: account.uid,
        countryCode: group.countryCode,
        totalFollowers: account.fansCount,
        totalWorks: account.workCount,
        totalViews: account.readCount,
        totalLikes: account.likeCount,
        totalCollects: account.collectCount,
      })
    }
  }

  async getAggregatedStatistics(
    userId: string,
    type?: AccountType,
  ) {
    const accounts = await this.accountRepository.getUserAccounts(userId)
    const filtered = type
      ? accounts.filter(a => a.type === type)
      : accounts

    const stats = {
      accountTotal: filtered.length,
      fansCount: 0,
      readCount: 0,
      likeCount: 0,
      collectCount: 0,
      commentCount: 0,
      forwardCount: 0,
      workCount: 0,
    }

    for (const account of filtered) {
      if (account.status === AccountStatus.NORMAL) {
        stats.fansCount += Number(account.fansCount ?? 0)
      }
      stats.readCount += Number(account.readCount ?? 0)
      stats.likeCount += Number(account.likeCount ?? 0)
      stats.collectCount += Number(account.collectCount ?? 0)
      stats.commentCount += Number(account.commentCount ?? 0)
      stats.forwardCount += Number(account.forwardCount ?? 0)
      stats.workCount += Number(account.workCount ?? 0)
    }

    return stats
  }

  async refreshAccountStatistics(
    userId: string,
    accountId: string,
  ): Promise<AccountStatsData & { lastStatsTime: Date }> {
    const account = await this.accountRepository.getAccountById(accountId)
    if (!account || account.userId !== userId) {
      throw new AppException(ResponseCode.AccountNotFound)
    }

    if (!this.platformService.isSupportedRefreshPlatform(account.type)) {
      throw new AppException(ResponseCode.AccountRefreshNotSupported)
    }

    if (account.lastStatsTime) {
      const elapsed = Date.now() - new Date(account.lastStatsTime).getTime()
      if (elapsed < REFRESH_COOLDOWN_MS) {
        throw new AppException(ResponseCode.AccountRefreshTooFrequent)
      }
    }

    const stats = await this.platformService.fetchLatestStatsFromPlatform(account)
    const validStats = this.pickValidAccountStatistics(stats)
    if (Object.keys(validStats).length === 0) {
      throw new AppException(ResponseCode.ChannelAccountInfoFailed)
    }

    const now = new Date()
    await this.updateAccountStatistics(accountId, validStats)
    await this.accountRepository.updateById(accountId, { lastStatsTime: now })

    return {
      ...validStats,
      lastStatsTime: now,
    }
  }
}
