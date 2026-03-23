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

  async createOrUpdateById(
    account: {
      type: AccountType
      uid: string
    },
    accountData: Partial<Account>,
  ): Promise<Account | null> {
    const { clientType, type, uid } = accountData
    let _id = `${type}_${uid}`
    if (
      [AccountType.Xhs].includes(type as AccountType)
    ) {
      _id += `_${clientType}`
      accountData.clientType = clientType
    }
    const res = await this.accountModel.findOneAndUpdate({
      type: account.type,
      uid: account.uid,
    }, {
      _id,
      ...accountData,
    }, { upsert: true, new: true }).lean({ virtuals: true }).exec()
    return res
  }

  async update(id: string, updateDto: Partial<Account>): Promise<Account | null> {
    return await this.accountModel
      .findByIdAndUpdate(id, updateDto)
      .lean({ virtuals: true })
      .exec()
  }

  async delete(id: string) {
    await this.accountModel.deleteOne({ _id: id }).exec()
  }

  async getUserAccountList(userId: string) {
    return await this.accountModel.find({ userId }).lean({ virtuals: true }).exec()
  }

  async listRelayAccountsByUserId(userId: string) {
    return await this.accountModel.find({ userId, relayAccountRef: { $ne: null } }).lean({ virtuals: true }).exec()
  }

  async getList(
    page: {
      pageNo: number
      pageSize: number
    },
    filter: {
      name?: string
      type?: AccountType
    },
  ) {
    const { pageNo, pageSize } = page
    const queryFilter: RootFilterQuery<Account> = {
      ...(filter.name && { name: filter.name }),
      ...(filter.type && { type: filter.type }),
    }

    const [total, list] = await Promise.all([
      this.accountModel.countDocuments(queryFilter),
      this.accountModel
        .find(queryFilter)
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .lean({ virtuals: true })
        .exec(),
    ])

    return {
      list,
      total,
    }
  }

  /**
   * Switch accounts under user group to default group
   * @param userId
   * @param groupId
   * @param defaultGroupId
   */
  async updateManyToDefaultGroup(
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
   * Update account information
   * @param id
   * @param account
   * @returns
   */
  override async updateById(
    id: string,
    account: Partial<Account>,
  ) {
    return await this.accountModel.findByIdAndUpdate(
      id,
      { $set: account },
      { new: true },
    ).lean({ virtuals: true }).exec()
  }

  /**
   * Get account by user ID
   */
  async getAccountById(id: string) {
    return this.accountModel.findOne({ _id: id }).lean({ virtuals: true }).exec()
  }

  /**
   * Get account by user uid
   */
  async getAccountByUid(uid: string, type: AccountType) {
    return this.accountModel.findOne({ uid, type }).lean({ virtuals: true }).exec()
  }

  /**
   * Get all accounts
   * @param userId
   * @returns
   */
  async getUserAccounts(userId: string) {
    const accounts = await this.accountModel.find({
      userId,
    }).lean({ virtuals: true })
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
      .lean({ virtuals: true })

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
    }).lean({ virtuals: true })
  }

  async getAccountListByIds(ids: string[]) {
    return this.accountModel.find({
      id: { $in: ids },
    }).lean({ virtuals: true })
  }

  async getAccountListByGroupId(groupId: string) {
    return this.accountModel.find({ groupId }).lean({ virtuals: true })
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
    }).lean({ virtuals: true })

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
    }).lean({ virtuals: true })
  }

  /**
   * Delete
   * @param id
   * @param userId
   * @returns
   */
  async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const res = await this.accountModel.deleteOne({
      _id: id,
      userId,
    })

    return res.deletedCount > 0
  }

  async deleteManyByIds(ids: string[], userId: string) {
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
    const result = await this.accountModel.findOne(param).lean({ virtuals: true })
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
    }).lean({ virtuals: true })
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
    }).lean({ virtuals: true })
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
      .lean({ virtuals: true })

    return accounts
  }

  async updateManyRankByIds(userId: string, groupId: string, list: { id: string, rank: number }[]) {
    const promises = list.map(element =>
      this.accountModel.updateOne({ userId, groupId, _id: element.id }, { $set: { rank: element.rank } }),
    )
    await Promise.all(promises)
    return true
  }

  // Get account cursor for iteration operations
  async getAccountCursor(filter: { groupId?: string, userId?: string }) {
    const cursor = this.accountModel.find({ ...(filter.groupId && { groupId: filter.groupId }), ...(filter.userId && { userId: filter.userId }) }).lean({ virtuals: true }).cursor()
    return cursor
  }

  async listByUserIdAndGroupId(userId: string, groupId: string) {
    return this.accountModel.find({ userId, groupId }).lean({ virtuals: true })
  }

  /**
   * Batch update userId for accounts that have no userId or empty userId
   * @param accountIds - List of account IDs to update
   * @param userId - User ID to set
   * @returns Number of updated accounts
   */
  async updateManyUserIdByIds(accountIds: string[], userId: string): Promise<number> {
    if (accountIds.length === 0) {
      return 0
    }
    const result = await this.accountModel.updateMany(
      {
        _id: { $in: accountIds },
        $or: [
          { userId: { $exists: false } },
          { userId: '' },
          { userId: null },
        ],
      },
      { $set: { userId } },
    )
    return result.modifiedCount
  }
}
