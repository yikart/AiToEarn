import { Injectable, Logger } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { AccountType, AppException, ResponseCode, TableDto } from '@yikart/common'
import { Account, AccountGroup, AccountGroupRepository, AccountRepository, AccountStatus } from '@yikart/mongodb'
import { AccountPortraitReportData } from '../channel/common'
import { AccountFilterDto, CreateAccountDto } from './account.dto'

@Injectable()
export class AccountService {
  logger = new Logger(AccountService.name)

  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountGroupRepository: AccountGroupRepository,
    private readonly queueService: QueueService,
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
}
