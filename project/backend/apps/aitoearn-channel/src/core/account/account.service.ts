import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { QueueService } from '@yikart/aitoearn-queue'
import { AccountStatus, AccountType, AitoearnServerClientService, NewAccount } from '@yikart/aitoearn-server-client'
import { Model } from 'mongoose'
import { TableDto } from '../../common/global/dto/table.dto'
import { Account } from '../../libs/database/schema/account.schema'

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name)
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,
    private readonly serverClient: AitoearnServerClientService,
    private readonly queueService: QueueService,
  ) { }

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
    this.logger.log(`createAccount: ${JSON.stringify({ account, data })}`)
    await this.accountModel.updateOne({
      type: account.type,
      uid: account.uid,
    }, {
      _id: `${account.type}_${account.uid}`,
      userId,
      ...data,
      loginTime: new Date(),
    }, { upsert: true }).exec()

    try {
      const result = await this.serverClient.account.createAccount({
        userId,
        ...data,
        ...account,
        loginTime: new Date(),
      })
      this.logger.log(`create server account success: ${JSON.stringify(result)}`)
      this.queueService.addDumpSocialMediaAvatarJob({ accountId: result.id })
      return await this.accountModel.findById(result.id)
    }
    catch (error) {
      this.logger.error(`create server account error: ${error}`)
      return null
    }
  }

  /**
   * 更新账户
   * @returns
   */
  async updateAccountInfo(userId: string, accountId: string, data: NewAccount) {
    const res = await this.accountModel.updateOne({ _id: accountId }, data)

    try {
      await this.serverClient.account.updateAccountInfo(
        accountId,
        {
          userId,
          ...data,
        },
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
