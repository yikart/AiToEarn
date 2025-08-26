import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'

@Injectable()
export class StatisticsNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 获取账号最新数据
   * @param accountId 账户ID
   * @param platform 平台
   * @param uid 频道唯一标识符
   * @returns
   */
  async getAccountDataLatest(
    accountId: string,
    platform: string,
    uid: string,
  ) {
    const res = await this.natsService.sendMessage<string>(
      NatsApi.statistics.account.getAccountDataLatest,
      {
        accountId,
        platform,
        uid,
      },
    )

    return res
  }

  /**
   * 获取账号增量数据
   * @param accountId 账户ID
   * @param platform 平台
   * @param uid 频道唯一标识符
   * @returns
   */
  async getAccountDataIncrease(
    accountId: string,
    platform: string,
    uid: string,
  ) {
    const res = await this.natsService.sendMessage<string>(
      NatsApi.statistics.account.getAccountDataIncrease,
      {
        accountId,
        platform,
        uid,
      },
    )

    return res
  }

  /**
   * 根据查询条件筛选频道
   * @param params 查询参数
   * @param sort 排序
   * @param pageNo 页码
   * @param pageSize 每页数据量
   * @returns
   */
  async getAccountDataByParams(
    params: any,
    sort?: any,
    pageNo?: number,
    pageSize?: number,
  ) {
    const res = await this.natsService.sendMessage<string>(
      NatsApi.statistics.account.getAccountDataByParams,
      {
        params,
        sort,
        pageNo,
        pageSize,
      },
    )

    return res
  }

  /**
   * 获取账号一段时间数据
   * @param accountId 账户ID
   * @param platform 平台
   * @param uid 频道唯一标识符
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns
   */
  async getAccountDataPeriod(
    accountId: string,
    platform: string,
    uid: string,
    startDate: string,
    endDate: string,
  ) {
    const res = await this.natsService.sendMessage<string>(
      NatsApi.statistics.account.getAccountDataPeriod,
      {
        accountId,
        platform,
        uid,
        startDate,
        endDate,
      },
    )

    return res
  }
}
