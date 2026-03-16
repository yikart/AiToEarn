import { Injectable } from '@nestjs/common'
import { AccountGroup } from '@yikart/mongodb'
import { AxiosRequestConfig } from 'axios'
import { Account, UpdateAccountStatisticsData } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class AccountService extends BaseService {
  /** 创建账户 */
  async createAccount(data: Partial<Account>) {
    const url = `/internal/${data.userId}/socials/accounts`
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
    const url = `/internal/${data.userId}/socials/accounts/${accountId}`
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

  async getAccountInfo(accountId: string) {
    const url = `/internal/socials/account/${accountId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
    }
    const res = await this.request<Account>(
      url,
      config,
    )
    return res
  }

  async updateAccountStatistics(accountId: string, data: UpdateAccountStatisticsData) {
    const url = `/internal/socials/accounts/${accountId}/statistics`
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

  async getAccountInfoInternal(id: string) {
    const url = `/internal/account/info`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { id },
    }
    return this.request<Account>(url, config)
  }

  async getAccountListByIds(ids: string[]) {
    const url = `/internal/account/list/ids`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { ids },
    }
    return this.request<Account[]>(url, config)
  }

  async getAccountListByTypes(types: string[], status?: number) {
    const url = `/internal/account/list/types`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { types, status },
    }
    return this.request<Account[]>(url, config)
  }

  async getAccountListByParam(param: Record<string, unknown>) {
    const url = `/internal/account/list/param`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: param,
    }
    return this.request<Account[]>(url, config)
  }

  async getAccountGroupInfo(id: string) {
    const url = `/internal/accountGroup/info/${id}`
    const config: AxiosRequestConfig = {
      method: 'GET',
    }
    return this.request<AccountGroup>(url, config)
  }
}
