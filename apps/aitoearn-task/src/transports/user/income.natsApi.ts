import { Injectable } from '@nestjs/common'
import { ServerBaseApi } from '../serverBase.api'
import { IncomeType } from './comment'

@Injectable()
export class IncomeNatsApi extends ServerBaseApi {
  /**
   * 增加收入
   */
  async add(userId: string, data: {
    amount: number // 分
    type: IncomeType
    relId?: string
    desc?: string
    metadata?: Record<string, unknown>
  }) {
    const res = await this.sendMessage<boolean>(
      'incomeInternal/income/add',
      { userId, ...data },
    )

    return res
  }

  // 扣除余额
  async deduct(userId: string, data: {
    amount: number
    type: IncomeType
    relId?: string
    desc?: string
    metadata?: Record<string, unknown>
  }) {
    const res = await this.sendMessage<boolean>(
      'incomeInternal/income/deduct',
      { userId, ...data },
    )

    return res
  }
}
