import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { TableDto } from '@/common/dto/table.dto'
import { Account, AccountStatus, AccountType } from '@/libs'
import { AccountPortraitReportData } from '@/transports/task/common'
import { AccountGroupService } from './accountGroup/accountGroup.service'
import { AccountFilterDto } from './dto/account.dto'

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,

    @Inject(forwardRef(() => AccountGroupService))
    private readonly accountGroupService: AccountGroupService,
    private eventEmitter: EventEmitter2,
  ) {
  }

  /**
   * 账户数据上报
   * @param data
   */
  private async accountPortraitReport(
    data: AccountPortraitReportData,
  ) {
    this.eventEmitter.emit('account.portrait.report', data)
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
    return this.accountModel.updateMany(
      { userId, groupId },
      { groupId: defaultGroupId },
    )
  }

  /**
   * 添加或更新账号
   * @param account
   * @param data
   * @returns
   */
  async addAccount(
    account: {
      userId: string
      type: AccountType
      uid: string
    },
    data: Partial<Account>,
  ): Promise<Account | null> {
    const info: Account | null = await this.accountModel.findOne(account)
    if (info) {
      const uRes = await this.updateAccountInfo(info.id, data)
      return uRes ? info : null
    }

    const defaultGroup = await this.accountGroupService.getDefaultGroup(
      account.userId,
    )

    data['groupId'] = defaultGroup.id
    const res = await this.accountModel.create({ ...data, ...account })
    this.accountPortraitReport({
      accountId: res.id,
      totalFollowers: res.fansCount,
      totalWorks: res.workCount,
      totalViews: res.readCount,
      totalLikes: res.likeCount,
      totalCollects: res.collectCount,
    })
    return res
  }

  /**
   * 更新账号信息
   * @param id
   * @param account
   * @returns
   */
  async updateAccountInfo(
    id: string,
    account: Partial<Account>,
  ): Promise<boolean> {
    const res = await this.accountModel.updateOne(
      { _id: id },
      { $set: account },
    )
    return res.matchedCount > 0 || res.modifiedCount > 0
  }

  /**
   * 根据用户id获取账号
   */
  async getAccountById(id: string) {
    return this.accountModel.findOne({ _id: id })
  }

  /**
   * 获取所有账户
   * @param userId
   * @returns
   */
  async getUserAccounts(userId: string) {
    return this.accountModel.find({
      userId,
    })
  }

  /**
   * 获取所有账户
   * @param filterDto
   * @param pageInfo
   * @returns
   */
  async getAccounts(filterDto: AccountFilterDto, pageInfo: TableDto) {
    const { pageNo, pageSize } = pageInfo
    const filter: RootFilterQuery<Account> = {
    }
    if (filterDto.userId) {
      filter.userId = filterDto.userId
    }

    if (filterDto.types) {
      filter.type = {
        $in: filterDto.types,
      }
    }

    const total = await this.accountModel.countDocuments(filter)
    const list = await this.accountModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNo! - 1) * pageSize)
      .limit(pageSize)
      .lean()

    return {
      total,
      list,
    }
  }

  /**
   * 根据ID数组ids获取账户列表数组
   * @param userId
   * @param ids
   * @returns
   */
  async getAccountListByIds(userId: string, ids: string[]) {
    return this.accountModel.find({
      userId,
      id: { $in: ids },
    })
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
    const accountList = await this.accountModel.find({
      userId,
      ...(type && { type }),
    })

    const res = {
      accountTotal: accountList.length,
      list: accountList,
      fansCount: 0,
    }

    // for (const element of accountList) {
    // TODO: 获取统计信息
    // const ret = await platController.getStatistics(element).catch((err) => {
    //   console.error(err);
    // });
    // res.fansCount += ret?.fansCount || 0;
    // }

    return res
  }

  /**
   * 获取用户的账户总数
   * @param userId
   * @returns
   */
  async getUserAccountCount(userId: string) {
    return await this.accountModel.countDocuments({ userId })
  }

  /**
   * 根据多个账户id查询账户信息
   * @param ids
   * @returns
   */
  async getAccountsByIds(ids: number[]) {
    return await this.accountModel.find({
      id: { $in: ids },
    })
  }

  /**
   * 删除
   * @param id
   * @param userId
   * @returns
   */
  async deleteUserAccount(id: string, userId: string): Promise<boolean> {
    const res = await this.accountModel.deleteOne({
      _id: id,
      userId,
    })

    return res.deletedCount > 0
  }

  // 删除多个账户
  async deleteUserAccounts(ids: string[], userId: string) {
    const res = await this.accountModel.deleteMany({
      _id: { $in: ids },
      userId,
    })
    return res.deletedCount > 0
  }

  /**
   * 更新用户状态
   * @param id
   * @param status
   * @returns
   */
  async updateAccountStatus(id: string, status: AccountStatus) {
    return await this.accountModel.updateOne({ _id: id }, { status })
  }

  // 更新账户的统计信息
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
    this.accountPortraitReport({
      accountId: id,
      totalFollowers: data.fansCount,
      totalWorks: data.workCount,
      totalViews: data.readCount,
      totalLikes: data.likeCount,
      totalCollects: data.collectCount,
    })
    const res = await this.accountModel.updateOne(
      { _id: id },
      {
        $set: data,
      },
    )
    return res.matchedCount > 0 || res.modifiedCount > 0
  }

  /**
   * 根据查询参数获取账号
   */
  async getAccountByParam(param: { [key: string]: string }) {
    return await this.accountModel.findOne(param)
  }

  /**
   * 根据ID数组ids获取账户列表数组
   * @param userId
   * @param ids
   * @returns
   */
  async listByIds(ids: string[]) {
    return this.accountModel.find({
      _id: { $in: ids },
    })
  }
}
