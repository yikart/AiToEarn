import { InjectModel } from '@nestjs/mongoose'
import { AppException, TableDto } from '@yikart/common'
import { Model, RootFilterQuery } from 'mongoose'
import { Account, AccountStatus, AccountType } from '../schemas/account.schema'
import { BaseRepository } from './base.repository'

export class AccountRepository extends BaseRepository<Account> {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,
  ) { super(accountModel) }

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
  async addAccount(data: Partial<Account>): Promise<Account> {
    const info: Account | null = await this.accountModel.findOne({
      type: data.type,
      uid: data.uid,
    })

    if (info) {
      await this.accountModel.updateOne({
        type: data.type,
        uid: data.uid,
      }, {
        ...data,
        status: AccountStatus.NORMAL,
        loginTime: new Date(),
      })
    }
    else {
      data['_id'] = `${data.type}_${data.uid}`
      await this.accountModel.create({ ...data })
    }

    const backInfo = await this.accountModel.findOne({
      type: data.type,
      uid: data.uid,
    })

    if (!backInfo)
      throw new AppException(1000, 'addAccount fail')
    return backInfo
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
  ): Promise<Account | null> {
    await this.accountModel.updateOne(
      { _id: id },
      { $set: account },
    )

    const info = await this.getAccountById(id)
    return info
  }

  /**
   * 根据用户id获取账号
   */
  async getAccountById(id: string) {
    return this.accountModel.findOne({ _id: id }).exec()
  }

  /**
   * 获取所有账户
   * @param userId
   * @returns
   */
  async getUserAccounts(userId: string) {
    const accounts = await this.accountModel.find({
      userId,
    })
    if (!accounts || accounts.length === 0) {
      return []
    }
    return accounts
  }

  /**
   * 获取所有账户
   * @param filterDto
   * @param pageInfo
   * @returns
   */
  async getAccounts(filterDto: {
    userId?: string
    types?: string[]
  }, pageInfo: TableDto) {
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
  async getAccountsByIds(ids: string[]) {
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
    const res = await this.accountModel.updateOne({ _id: id }, { status })
    return res
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

  /**
   * 根据空间ID数组spaceIds获取账户列表数组
   * @param spaceIds
   * @returns
   */
  async listBySpaceIds(spaceIds: string[]) {
    return this.accountModel.find({
      groupId: { $in: spaceIds },
    })
  }

  /**
   * 根据type数组获取所有账户
   * @param types
   * @param status
   * @returns
   */
  async getAccountsByType(types: string[], status?: number) {
    const filter: RootFilterQuery<Account> = {}
    filter.type = {
      $in: types,
    }
    if (status) {
      filter.status = status
    }

    const accounts = await this.accountModel
      .find(filter)

    return accounts
  }

  // 排序
  async sortRank(userId: string, groupId: string, list: { id: string, rank: number }[]) {
    const promises = list.map(element =>
      this.accountModel.updateOne({ userId, groupId, _id: element.id }, { $set: { rank: element.rank } }),
    )
    await Promise.all(promises)
    return true
  }
}
