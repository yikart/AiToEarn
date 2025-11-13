import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { AccountType, AppException, ResponseCode, TableDto } from '@yikart/common'
import { Account, AccountRepository, AccountStatus } from '@yikart/mongodb'
import { ChannelService } from '../channel/channel.service'
import { AccountPortraitReportData } from '../channel/common'
import { NewAccountCrawlerData } from '../statistics/common'
import { StatisticsService } from '../statistics/statistics.service'
import { AccountGroupService } from './accountGroup.service'
import { AccountFilterDto, CreateAccountDto } from './dto/account.dto'

@Injectable()
export class AccountService {
  logger = new Logger(AccountService.name)

  constructor(
    private readonly accountRepository: AccountRepository,
    @Inject(forwardRef(() => AccountGroupService))
    private readonly accountGroupService: AccountGroupService,
    private readonly channelService: ChannelService,
    private readonly statisticsService: StatisticsService,
    private readonly queueService: QueueService,
  ) { }

  /**
   * Account data reporting
   * @param _data
   */
  private async accountPortraitReport(
    _data: AccountPortraitReportData,
  ) {
  }

  /**
   * TODO: Report new account to data crawler
   * @param data
   */
  private async newChannelReport(
    data: NewAccountCrawlerData,
  ) {
    return this.statisticsService.NewChannelReport(
      data,
    )
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
    return this.accountRepository.switchToDefaultGroup(
      userId,
      groupId,
      defaultGroupId,
    )
  }

  async addAccount(userId: string, data: CreateAccountDto): Promise<Account | null> {
    this.logger.log(`Adding new account with data: ${JSON.stringify(data)}`)
    let group = null
    if (!data.groupId) {
      group = await this.accountGroupService.getDefaultGroup(
        userId,
      )
    }
    else {
      group = await this.accountGroupService.findOneById(data.groupId)
      if (!group) {
        throw new AppException(ResponseCode.AccountGroupNotFound, 'Group not found')
      }
    }
    data.groupId = group.id

    const info: Account | null = await this.accountRepository.addAccount({
      userId,
      ...data,
    })

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

    try {
      this.newChannelReport({
        accountId: info.id,
        userId: info.userId,
        platform: info.type,
        uid: info.uid,
        avatar: info.avatar,
        nickname: info.nickname,
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

    const info = await this.accountRepository.updateAccountInfoById(id, account)
    if (!info)
      return false

    const group = await this.accountGroupService.findOneById(info.groupId)
    if (!group) {
      throw new AppException(ResponseCode.AccountGroupNotFound, 'Group not found')
    }

    try {
      this.accountPortraitReport({
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
    try {
      const channelAccounts = await this.channelService.getUserAccounts(userId)
      for (const acc of channelAccounts) {
        if (accountMap[acc._id]) {
          accountMap[acc._id].status = acc.status
        }
      }
    }
    catch (error: any) {
      this.logger.error(`get user accounts from channel error: ${error.message}`)
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
    return await this.accountRepository.deleteUserAccount(id, userId)
  }

  // Delete multiple accounts
  async deleteUserAccounts(ids: string[], userId: string) {
    return await this.accountRepository.deleteUserAccounts(ids, userId)
  }

  /**
   * Update channel status
   * @param id
   * @param status
   * @returns
   */
  async updateAccountStatus(id: string, status: AccountStatus) {
    const res = await this.accountRepository.updateAccountStatus(id, status)
    this.channelService.updateChannelAccountStatus(id, status)
    return res
  }

  async updateAccountStatistics(
    id: string,
    data: {
      fansCount?: number
      readCount?: number
      likeCount?: number
      collectCount?: number
      commentCount?: number
      income?: number
      workCount?: number
    },
  ) {
    const res = await this.accountRepository.updateAccountStatistics(id, data)
    if (res) {
      const accountInfo = await this.accountRepository.getAccountById(id)
      if (!accountInfo)
        return false
      this.accountPortraitReport({
        type: AccountType.BILIBILI,
        uid: accountInfo.uid,
        totalFollowers: data.fansCount,
        totalWorks: data.workCount,
        totalViews: data.readCount,
        totalLikes: data.likeCount,
        totalCollects: data.collectCount,
      })
    }

    return res
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
    const res = await this.accountRepository.sortRank(userId, groupId, list)
    return res
  }
}
