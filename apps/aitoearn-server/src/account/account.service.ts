import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { Account, AccountRepository, AccountStatus, AccountType } from '@yikart/mongodb'
import { ChannelService } from '../channel/channel.service'
import { NewAccountCrawlerData } from '../statistics/common'
import { StatisticsService } from '../statistics/statistics.service'
import { AccountPortraitReportData } from '../task/common'
import { TaskService } from '../task/task.service'
import { AccountGroupService } from './accountGroup.service'
import { AccountFilterDto, CreateAccountDto } from './dto/account.dto'

@Injectable()
export class AccountService {
  logger = new Logger(AccountService.name)

  constructor(
    private readonly accountRepository: AccountRepository,
    @Inject(forwardRef(() => AccountGroupService))
    private readonly accountGroupService: AccountGroupService,
    private readonly taskService: TaskService,
    private readonly channelService: ChannelService,
    private readonly statisticsService: StatisticsService,
  ) { }

  /**
   * 账户数据上报
   * @param data
   */
  private async accountPortraitReport(
    data: AccountPortraitReportData,
  ) {
    return this.taskService.accountPortraitReport(
      data,
    )
  }

  /**
   * TODO: 新账号上报到数据爬取
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
   * 将用户组下的账户切换到默认组
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

  /**
   * 添加或更新账号
   * @param account
   * @param data
   * @returns
   */
  async addAccount(data: CreateAccountDto): Promise<Account | null> {
    if (!data.groupId) {
      const defaultGroup = await this.accountGroupService.getDefaultGroup(
        data.userId,
      )
      data['groupId'] = defaultGroup.id
    }

    const info: Account | null = await this.accountRepository.addAccount({
      type: data.type,
      uid: data.uid,
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
   * 更新账号信息
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
      })
    }
    catch (error) {
      this.logger.error(error)
    }
    return true
  }

  /**
   * 根据用户id获取账号
   */
  async getAccountById(id: string) {
    return this.accountRepository.getAccountById(id)
  }

  /**
   * 获取所有账户
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
   * 获取所有账户
   * @param filterDto
   * @param pageInfo
   * @returns
   */
  async getAccounts(filterDto: AccountFilterDto, pageInfo: TableDto) {
    return this.accountRepository.getAccounts(filterDto, pageInfo)
  }

  /**
   * 根据ID数组ids获取账户列表数组
   * @param userId
   * @param ids
   * @returns
   */
  async getAccountListByIds(userId: string, ids: string[]) {
    return this.accountRepository.getAccountListByIds(userId, ids)
  }

  /**
   * 获取账户的统计信息
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
   * 获取用户的账户总数
   * @param userId
   * @returns
   */
  async getUserAccountCount(userId: string) {
    return await this.accountRepository.getUserAccountCount(userId)
  }

  /**
   * 根据多个账户id查询账户信息
   * @param ids
   * @returns
   */
  async getAccountsByIds(ids: string[]) {
    return await this.accountRepository.getAccountsByIds(ids)
  }

  /**
   * 删除
   * @param id
   * @param userId
   * @returns
   */
  async deleteUserAccount(id: string, userId: string): Promise<boolean> {
    return await this.accountRepository.deleteUserAccount(id, userId)
  }

  // 删除多个账户
  async deleteUserAccounts(ids: string[], userId: string) {
    return await this.accountRepository.deleteUserAccounts(ids, userId)
  }

  /**
   * 更新渠道状态
   * @param id
   * @param status
   * @returns
   */
  async updateAccountStatus(id: string, status: AccountStatus) {
    const res = await this.accountRepository.updateAccountStatus(id, status)
    this.channelService.updateChannelAccountStatus(id, status)
    return res
  }

  /**
   * 更新账户的统计信息
   * @param id
   * @param data
   * @returns
   */
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
   * 根据查询参数获取账号
   */
  async getAccountByParam(param: { [key: string]: string }) {
    const res = await this.accountRepository.getAccountByParam(param)
    return res
  }

  /**
   * 根据ID数组ids获取账户列表数组
   * @param ids
   * @returns
   */
  async listByIds(ids: string[]) {
    const res = await this.accountRepository.listByIds(ids)
    return res
  }

  /**
   * 根据空间ID数组spaceIds获取账户列表数组
   * @param spaceIds
   * @returns
   */
  async listBySpaceIds(spaceIds: string[]) {
    const res = await this.accountRepository.listBySpaceIds(spaceIds)
    return res
  }

  /**
   * 根据type数组获取所有账户
   * @param types
   * @param status
   * @returns
   */
  async getAccountsByType(types: string[], status?: number) {
    const res = await this.accountRepository.getAccountsByType(types, status)
    return res
  }

  // 排序
  async sortRank(userId: string, groupId: string, list: { id: string, rank: number }[]) {
    const res = await this.accountRepository.sortRank(userId, groupId, list)
    return res
  }
}
