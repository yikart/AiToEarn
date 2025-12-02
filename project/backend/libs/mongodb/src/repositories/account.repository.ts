import { Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType, TableDto } from '@yikart/common'
import { Model, RootFilterQuery } from 'mongoose'
import { Account, AccountStatus } from '../schemas'
import { BaseRepository } from './base.repository'

export class AccountRepository extends BaseRepository<Account> {
  logger = new Logger(AccountRepository.name)
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,
  ) { super(accountModel) }

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
    return this.accountModel.updateMany(
      { userId, groupId },
      { groupId: defaultGroupId },
    )
  }

  async addAccount(data: Partial<Account>): Promise<Account> {
    const { clientType, type, uid } = data
    const info: Account | null = await this.accountModel.findOne({
      type,
      uid,
    })

    if (info) {
      await this.accountModel.updateOne({
        type,
        uid,
      }, {
        ...data,
        status: AccountStatus.NORMAL,
        loginTime: new Date(),
      })
    }
    else {
      let newId = `${type}_${uid}`
      if (
        [AccountType.Xhs, AccountType.Douyin].includes(type as AccountType)
      ) {
        newId += `_${clientType}`
        data.clientType = clientType
      }
      data['_id'] = newId
      await this.accountModel.create({ ...data })
    }

    return (await this.accountModel.findOne({
      type,
      uid,
    }))!
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
  ): Promise<Account | null> {
    await this.accountModel.updateOne(
      { _id: id },
      { $set: account },
    )

    const info = await this.getAccountById(id)
    return info
  }

  /**
   * Get account by user ID
   */
  async getAccountById(id: string) {
    return this.accountModel.findOne({ _id: id }).exec()
  }

  /**
   * Get all accounts
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
   * Get account list array by ID array ids
   * @param userId
   * @param ids
   * @returns
   */
  async getAccountListByIdsOfUser(userId: string, ids: string[]) {
    return this.accountModel.find({
      userId,
      id: { $in: ids },
    })
  }

  /**
   * Get account list array by ID array ids
   * @param userId
   * @param ids
   * @returns
   */
  async getAccountListByIds(ids: string[]) {
    return this.accountModel.find({
      id: { $in: ids },
    })
  }

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

  async getUserAccountCount(userId: string) {
    return await this.accountModel.countDocuments({ userId })
  }

  /**
   * Get account information by multiple account IDs
   * @param ids
   * @returns
   */
  async getAccountsByIds(ids: string[]) {
    return await this.accountModel.find({
      id: { $in: ids },
    })
  }

  /**
   * Delete
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

  async deleteUserAccounts(ids: string[], userId: string) {
    const res = await this.accountModel.deleteMany({
      _id: { $in: ids },
      userId,
    })
    return res.deletedCount > 0
  }

  /**
   * Update user status
   * @param id
   * @param status
   * @returns
   */
  async updateAccountStatus(id: string, status: AccountStatus) {
    const res = await this.accountModel.updateOne({ _id: id }, { status })
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
    const res = await this.accountModel.updateOne(
      { _id: id },
      {
        $set: data,
      },
    )
    return res.matchedCount > 0 || res.modifiedCount > 0
  }

  async getAccountByParam(param: { [key: string]: string }) {
    this.logger.log(`getAccountByParam query param: ${JSON.stringify(param)}`)
    const result = await this.accountModel.findOne(param)
    return result
  }

  /**
   * Get account list array by ID array ids
   * @param ids
   * @returns
   */
  async listByIds(ids: string[]) {
    return this.accountModel.find({
      _id: { $in: ids },
    })
  }

  /**
   * Get account list array by space ID array spaceIds
   * @param spaceIds
   * @returns
   */
  async listBySpaceIds(userId: string, spaceIds: string[]) {
    return this.accountModel.find({
      userId,
      groupId: { $in: spaceIds },
    })
  }

  /**
   * Get all accounts by type array
   * @param types
   * @param status
   * @returns
   */
  async getAccountsByTypes(types: string[], status?: number) {
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

  async sortRank(userId: string, groupId: string, list: { id: string, rank: number }[]) {
    const promises = list.map(element =>
      this.accountModel.updateOne({ userId, groupId, _id: element.id }, { $set: { rank: element.rank } }),
    )
    await Promise.all(promises)
    return true
  }

  // Get account cursor for iteration operations
  async getAccountCursor(filter: { groupId?: string, userId?: string }) {
    const cursor = this.accountModel.find({ ...(filter.groupId && { groupId: filter.groupId }), ...(filter.userId && { userId: filter.userId }) }).cursor()
    return cursor
  }

  async getUserAccountList(accountIds: string[]) {
    return this.accountModel.find({
      _id: { $in: accountIds },
    }).lean()
  }
}
