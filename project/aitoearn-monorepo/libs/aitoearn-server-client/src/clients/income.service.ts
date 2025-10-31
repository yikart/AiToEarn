import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { IncomeType } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class IncomeService extends BaseService {
  async addIncome(data: {
    userId: string
    amount: number // 分
    type: IncomeType
    relId?: string
    desc?: string
    metadata?: Record<string, unknown>
  }) {
    const url = `/internal/income/add`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    return this.request(url, config)
  }

  async deductIncome(data: {
    userId: string
    amount: number
    type: IncomeType
    relId?: string
    desc?: string
    metadata?: Record<string, unknown>
  }) {
    const url = `/internal/income/deduct`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    return this.request(url, config)
  }
}
