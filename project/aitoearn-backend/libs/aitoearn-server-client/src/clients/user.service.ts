import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { UserInfo } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class UserService extends BaseService {
  async getUserInfo(userId: string): Promise<UserInfo> {
    const url = `/internal/user/info`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { id: userId },
    }
    return this.request<UserInfo>(url, config)
  }

  /**
   * 批量获取用户信息
   */
  async listByIds(userIds: string[]): Promise<UserInfo[]> {
    const url = `/internal/user/list-by-ids`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { userIds },
    }
    return this.request<UserInfo[]>(url, config)
  }
}
