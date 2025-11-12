import { Injectable } from '@nestjs/common'
import { VipStatus } from '@yikart/common'
import { AxiosRequestConfig } from 'axios'
import { BaseService } from './base.service'

export interface AddPointsDto {
  userId: string
  amount: number
  type: string
  description?: string
  metadata?: Record<string, any>
}

export interface DeductPointsDto {
  userId: string
  amount: number
  type: string
  description?: string
  metadata?: Record<string, any>
}

@Injectable()
export class UserService extends BaseService {
  async getUserInfo(userId: string): Promise<any> {
    const url = `/internal/user/info`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { id: userId },
    }
    return this.request<any>(url, config)
  }

  async getVip(userId: string) {
    const url = `/internal/user/vip/get`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { userId },
    }
    return this.request<any>(url, config)
  }

  async setVip(userId: string, status: VipStatus) {
    const url = `/internal/user/vip/set`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { userId, status },
    }
    return this.request<boolean>(url, config)
  }

  async addPoints(data: AddPointsDto) {
    const url = `/internal/user/points/add`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    return this.request<void>(url, config)
  }

  async deductPoints(data: DeductPointsDto) {
    const url = `/internal/user/points/deduct`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    return this.request<void>(url, config)
  }
}
