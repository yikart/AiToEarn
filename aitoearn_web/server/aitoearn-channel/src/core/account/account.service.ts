import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, UpdateQuery } from 'mongoose'
import { TableDto } from '@/common/global/dto/table.dto'
import { Account } from '@/libs/database/schema/account.schema'
import { AccountNatsApi } from '@/transports/account/account.natsApi'
import { AccountType, NewAccount } from '@/transports/account/common'

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,
    private readonly accountNatsApi: AccountNatsApi,
  ) {}

  /**
   * 创建账户
   * 如果已存在，则更新账户信息
   * @returns
   */
  async createAccount(
    account: {
      userId: string
      type: AccountType
      uid: string
    },
    data: NewAccount,
    accountAddPath?: string,
  ) {
    // 查询是否已存在相同账户（可根据实际唯一性字段组合调整查询条件）
    const existAccount = await this.accountModel.findOne({
      userId: account.userId,
      type: account.type,
      uid: account.uid,
    })

    let newOrUpdatedAccount: Account | null

    const newData: UpdateQuery<Account> = { ...account, ...data, loginTime: new Date() };

    if (existAccount) {
      // 已存在，执行更新
      await this.accountModel.updateOne(
        { _id: existAccount._id },
        newData,
      )
      newOrUpdatedAccount = await this.accountModel.findById(existAccount._id)
    }
    else {
      // 不存在，创建新账户
      newOrUpdatedAccount = await this.accountModel.create(newData)
    }

    try {
      const natsRes = await this.accountNatsApi.createAccount(account, {
        ...data,
        account: newOrUpdatedAccount?.id,
        accountAddPath,
      })
      if (natsRes.code)
        throw new Error(natsRes.message)
    }
    catch (error) {
      Logger.error(error)
      return null
    }

    return newOrUpdatedAccount
  }

  /**
   * 更新账户
   * @returns
   */
  async upAccount(accountId: string, data: NewAccount) {
    const res = await this.accountModel.updateOne({ _id: accountId }, data)

    try {
      const natsRes = await this.accountNatsApi.updateAccountInfo(
        accountId,
        data,
      )
      if (natsRes.code)
        throw new Error(natsRes.message)
    }
    catch (error) {
      Logger.error(error)
      return null
    }

    return res
  }

  /**
   * 获取信息
   * @returns
   */
  async getAccountInfo(accountId: string) {
    return this.accountModel.findById(accountId)
  }

  /**
   * 获取列表
   * @param page
   * @param filter
   * @returns
   */
  async getAccountList(page: TableDto, filter: { type?: AccountType } = {}) {
    const list = await this.accountModel.find(
      {
        ...filter,
      },
      {},
      {
        skip: (page.pageNo! - 1) * page.pageSize,
        limit: page.pageSize,
      },
    )

    return {
      list,
      total: await this.accountModel.countDocuments(filter),
    }
  }
}
