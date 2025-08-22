import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { BaseNatsApi } from '../base.natsApi'
import { Account, AccountStatus, AccountType } from './comment'

@Injectable()
export class AccountNatsApi extends BaseNatsApi {
  /**
   * 添加或更新账号
   @param newData
   * @returns
   */
  async createAccount(newData: Partial<Account>): Promise<Account> {
    const res = await this.sendMessage<Account>(
      NatsApi.account.account.create,
      {
        account: {
          userId: newData.userId,
          type: newData.type,
          uid: newData.uid,
        },
        data: newData,
      },
    )

    return res
  }

  /**
   * 更新用户信息
   * @param id
   * @param data
   * @returns
   */
  async updateAccountInfo(id: string, data: any) {
    const res = await this.sendMessage<boolean>(
      NatsApi.account.account.updateAccountInfo,
      { id, ...data },
    )

    return res
  }

  /**
   * 根据用户id获取账号
   */
  async getAccountInfoById(accountId: string) {
    const res = await this.sendMessage<Account>(
      NatsApi.account.account.getAccountInfoById,
      { accountId },
    )

    return res
  }

  /**
   * 更新用户状态
   * @param id
   * @param status
   * @returns
   */
  async updateAccountStatus(id: string, status: AccountStatus) {
    const res = await this.sendMessage<boolean>(
      NatsApi.account.account.updateAccountStatus,
      { id, status },
    )

    return res
  }

  /**
   * 获取所有账户
   * @param userId
   * @returns
   */
  async getUserAccounts(userId: string) {
    const res = await this.sendMessage<Account[]>(
      NatsApi.account.account.getUserAccounts,
      { userId },
    )

    return res
  }

  /**
   * 根据ID数组ids获取账户列表数组
   * @param userId
   * @param ids
   * @returns
   */
  async getAccountListByIds(userId: string, ids: string[]) {
    const res = await this.sendMessage<Account[]>(
      NatsApi.account.account.getAccountListByIds,
      { userId, ids },
    )

    return res
  }

  /**
   * 获取账户的统计信息
   * @param userId
   * @param type
   * @returns
   */
  async getAccountStatistics(userId: string, type?: AccountType) {
    const res = await this.sendMessage<{
      accountTotal: number
      list: Account[]
      fansCount?: number
      readCount?: number
      likeCount?: number
      collectCount?: number
      commentCount?: number
      income?: number
    }>(NatsApi.account.account.getAccountListByIds, { userId, type })

    return res
  }

  /**
   * 获取用户的账户总数
   * @param userId
   * @returns
   */
  async getUserAccountCount(userId: string) {
    const res = await this.sendMessage<number>(
      NatsApi.account.account.getUserAccountCount,
      { userId },
    )

    return res
  }

  /**
   * 删除
   * @param id
   * @param userId
   * @returns
   */
  async deleteAccount(id: string, userId: string): Promise<boolean> {
    const res = await this.sendMessage<boolean>(
      NatsApi.account.account.deleteUserAccount,
      { userId, accountId: id },
    )

    return res
  }

  // 删除多个账户
  async deleteAccounts(ids: string[], userId: string) {
    const res = await this.sendMessage<boolean>(
      NatsApi.account.account.deleteUserAccounts,
      { userId, ids },
    )

    return res
  }

  // 更新账户的统计信息
  async updateAccountStatistics(
    id: string,
    fansCount?: number,
    readCount?: number,
    likeCount?: number,
    collectCount?: number,
    commentCount?: number,
    income?: number,
    workCount?: number,
  ) {
    const res = await this.sendMessage<number>(
      NatsApi.account.account.updateAccountStatistics,
      {
        account: id,
        fansCount,
        readCount,
        likeCount,
        collectCount,
        commentCount,
        income,
        workCount,
      },
    )

    return res
  }

  /**
   * 根据查询参数获取账号
   */
  async getAccountByParam(param: { [key: string]: string }) {
    const res = await this.sendMessage<Account>(
      NatsApi.account.account.getAccountByParam,
      { param },
    )

    return res
  }
}
