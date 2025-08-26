import { Injectable } from '@nestjs/common'
import { AccountNatsApi } from 'src/transports/account/account.natsApi'
import { StatisticsNatsApi } from '@/transports/statistics/statistics.natsApi'

@Injectable()
export class StatisticsService {
  constructor(
    private readonly accountNatsApi: AccountNatsApi,
    private readonly statisticsNatsApi: StatisticsNatsApi,
  ) {}

  // 获取账号最新数据
  async getAccountDataLatest(accountId: string) {
    // 获取账号基础信息
    const accountInfo = await this.accountNatsApi.getAccountInfoById(accountId)
    console.log(accountInfo)
    return await this.statisticsNatsApi.getAccountDataLatest(accountId, accountInfo.type, accountInfo.uid)
  }

  // 获取账号增量数据
  async getAccountDataIncrease(accountId: string) {
    // 获取账号基础信息
    const accountInfo = await this.accountNatsApi.getAccountInfoById(accountId)
    console.log(accountInfo)
    return await this.statisticsNatsApi.getAccountDataIncrease(accountId, accountInfo.type, accountInfo.uid)
  }

  // 获取账号一段时间数据
  async getAccountDataPeriod(accountId: string, startDate: string, endDate: string) {
    // 获取账号基础信息
    const accountInfo = await this.accountNatsApi.getAccountInfoById(accountId)
    console.log(accountInfo)
    return await this.statisticsNatsApi.getAccountDataPeriod(accountId, accountInfo.type, accountInfo.uid, startDate, endDate)
  }
}
