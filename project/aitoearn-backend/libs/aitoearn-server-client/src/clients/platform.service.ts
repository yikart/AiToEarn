import { Injectable } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { AxiosRequestConfig } from 'axios'
import { WorkDetailInfo, WorkLinkInfo } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class PlatformService extends BaseService {
  async getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string, accountId?: string): Promise<WorkLinkInfo> {
    const url = `/internal/channel/work/link/info`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { accountType, workLink, dataId, accountId },
    }
    return this.request<WorkLinkInfo>(url, config)
  }

  async getWorkDetail(accountType: AccountType, accountId: string, dataId: string): Promise<WorkDetailInfo | null> {
    const url = `/internal/channel/work/detail`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { accountType, accountId, dataId },
    }
    return this.request<WorkDetailInfo | null>(url, config)
  }

  async verifyWorkOwnership(accountType: AccountType, accountId: string, dataId: string): Promise<boolean> {
    const url = `/internal/channel/work/verify-ownership`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { accountType, accountId, dataId },
    }
    return this.request<boolean>(url, config)
  }
}
