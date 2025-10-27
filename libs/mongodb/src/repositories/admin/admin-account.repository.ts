import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { Account, AccountStatus, AccountType } from '../../schemas/account.schema'
import { BaseRepository } from '../base.repository'

export class AdminAccountRepository extends BaseRepository<Account> {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,
  ) { super(accountModel) }

  async getAccountById(id: string) {
    return this.accountModel.findOne({ _id: id }).exec()
  }

  /**
   * 获取所有账户
   * @param filterDto
   * @param pageInfo
   * @returns
   */
  async getAccountList(inFilter: {
    userId?: string
    status?: AccountStatus
    types?: AccountType[]
  }, pageInfo: {
    pageNo: number
    pageSize: number
  }) {
    const { pageNo, pageSize } = pageInfo
    const filter: RootFilterQuery<Account> = {
      ...(inFilter.userId && { userId: inFilter.userId }),
      ...(inFilter.status !== undefined && { status: inFilter.status }),
      ...(inFilter.types && { type: { $in: inFilter.types } }),
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
}
