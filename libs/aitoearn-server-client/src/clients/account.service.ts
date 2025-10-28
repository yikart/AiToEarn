import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { Account, UpdateAccountStatisticsData } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class AccountService extends BaseService {
  /**
   * 创建账户
   * @param account
   * @param data
   * @returns
   */
  async createAccount(
    data: Partial<Account>,
  ) {
    const url = `/api/internal/${data.userId}/socials/accounts`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<Account>(
      url,
      config,
    )

    return res
  }

  // 更新账号信息
  async updateAccountInfo(accountId: string, data: Partial<Account>) {
    const url = `/api/internal/${data.userId}/socials/accounts/${accountId}`
    const config: AxiosRequestConfig = {
      method: 'PATCH',
      data,
    }
    const res = await this.request<Account>(
      url,
      config,
    )
    return res
  }

  /**
   * 获取账户详情
   * @param accountId
   * @returns
   */
  async getAccountInfo(accountId: string) {
    const url = `/api/internal/socials/accounts/${accountId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
    }
    const res = await this.request<Account>(
      url,
      config,
    )
    return res
  }

  /**
   * 更新用户账户统计信息
   * @param accountId
   * @param data
   * @returns
   */
  async updateAccountStatistics(accountId: string, data: UpdateAccountStatisticsData) {
    const url = `/api/internal/socials/accounts/${accountId}/statistics`
    const config: AxiosRequestConfig = {
      method: 'PATCH',
      data,
    }
    const res = await this.request<Account>(
      url,
      config,
    )
    return res
  }
}
