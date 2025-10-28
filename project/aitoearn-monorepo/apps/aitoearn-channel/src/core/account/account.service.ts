import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'
import { AccountStatus, AccountType, AitoearnServerClientService, NewAccount } from '@yikart/aitoearn-server-client'
import { Model, UpdateQuery } from 'mongoose'
import { TableDto } from '../../common/global/dto/table.dto'
import { Account } from '../../libs/database/schema/account.schema'

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name)
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,
    private readonly serverClient: AitoearnServerClientService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * 创建账户
   * 如果已存在，则更新账户信息
   * @returns
   */
  async createAccount(
    userId: string,
    account: {
      type: AccountType
      uid: string
    },
    data: NewAccount,
  ) {
    this.logger.log({
      msg: '-------- ***** --------',
      data: {
        account,
        data,
      },
    })
    // 查询是否已存在相同账户
    const existAccount = await this.accountModel.findOne({
      type: account.type,
      uid: account.uid,
    })
    this.logger.log({
      msg: '-------- 00000 --------',
      data: existAccount,
    })
    let newOrUpdatedAccount: Account | null

    const newData: UpdateQuery<Account> = { ...data, ...account, userId, loginTime: new Date() }
    if (existAccount) {
      // 已存在，执行更新
      newOrUpdatedAccount = await this.accountModel.findOneAndUpdate(
        { type: account.type, uid: account.uid },
        newData,
      )

      this.logger.log({
        msg: '-------- 111111 --------',
        data: newOrUpdatedAccount,
      })
    }
    else {
      // 不存在，创建新账户
      newData['_id'] = `${account.type}_${account.uid}`
      newOrUpdatedAccount = await this.accountModel.create(newData)

      this.logger.log({
        msg: '-------- 222222 --------',
        data: newOrUpdatedAccount,
      })
    }

    try {
      const ret = await this.serverClient.account.createAccount(newData)
      this.logger.log({
        msg: '-------- 333333 --------',
        data: ret,
      })
      // 触发账户创建或更新事件
      this.eventEmitter.emit(`account.create.${newOrUpdatedAccount?.type}`, newOrUpdatedAccount?.id)
    }
    catch (error) {
      this.logger.error(error)
      return null
    }
    this.logger.log({
      msg: '-------- 44444 --------',
      data: newOrUpdatedAccount,
    })
    return newOrUpdatedAccount
  }

  /**
   * 更新账户
   * @returns
   */
  async upAccount(accountId: string, data: NewAccount) {
    const res = await this.accountModel.updateOne({ _id: accountId }, data)

    try {
      await this.serverClient.account.updateAccountInfo(
        accountId,
        data,
      )
    }
    catch (error) {
      this.logger.error(error)
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

  async getUserAccountList(userId: string) {
    return this.accountModel.find(
      {
        userId,
      },
    )
  }

  /**
   * 更新频道在线状态
   * @param id
   * @param status
   * @returns
   */
  async updateAccountStatus(id: string, status: AccountStatus) {
    return await this.accountModel.updateOne({ _id: id }, { status })
  }
}
