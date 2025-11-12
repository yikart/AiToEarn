import { Injectable } from '@nestjs/common'
import { AccountDataRepository } from '@yikart/statistics-db'
import { getDayRangeUTC } from '../../common/utils'

@Injectable()
export class AccountDataService {
  constructor(
    private readonly accountDataRepository: AccountDataRepository,
  ) {
  }

  /**
   * 获取数据库连接状态
   */
  async getConnectionState(): Promise<number> {
    return this.accountDataRepository.getConnectionState()
  }

  /**
   * 调试方法：获取集合信息
   */
  async getCollectionInfo(platform: string) {
    return this.accountDataRepository.getCollectionInfo(platform)
  }

  /**
   * 根据账号和日期查询作者数据
   */
  async getAuthorDataByDate(accountId: string, platform: string, date: string) {
    const dataTime = getDayRangeUTC(date)
    return this.accountDataRepository.getAuthorDataByDate(accountId, platform, [dataTime.start, dataTime.end])
  }

  /**
   * 根据账号查询频道最新数据
   */
  async getAccountDataLatest(accountId: string, platform: string, uid: string) {
    return this.accountDataRepository.getAccountDataLatest(accountId, platform, uid)
  }

  /**
   * 根据账号查询频道最新增量数据
   */
  async getAccountDataIncrease(platform: string, uid: string) {
    return this.accountDataRepository.getAccountDataIncrease(platform, uid)
  }

  /**
   * 根据账号查询作品最新增量数据
   */
  async getPostDataIncrease(platform: string, uid: string) {
    return this.accountDataRepository.getPostDataIncrease(platform, uid)
  }

  /**
   * 根据查询条件筛选账号
   */
  async getAccountDataByParams(params: any, sort: string, pageNo: number, pageSize: number) {
    return this.accountDataRepository.getAccountDataByParams(params, sort, pageNo, pageSize)
  }

  /**
   * 根据账号查询频道一段时间数据
   */
  async getAccountDataPeriod(accountId: string, platform: string, uid: string, startDate: string, endDate: string) {
    return this.accountDataRepository.getAccountDataPeriod(accountId, platform, uid, startDate, endDate)
  }

  /**
   * 根据platform和uid数组查询频道最新数据并汇总fansCount
   * @param queries 包含platform和uid组合的数组
   * @returns 汇总后的fansCount总数和查询到的所有数据
   */
  async getChannelDataLatestByUids(queries: Array<{ platform: string, uid: string }>) {
    return this.accountDataRepository.getChannelDataLatestByUids(queries)
  }

  /**
   * 根据platform和uid数组查询频道一段时间增量数据
   * @param queries 包含platform和uid组合的数组
   * @param startDate 可选，格式示例 '2025-09-01'（默认 7 天前）
   * @param endDate 可选，格式示例 '2025-09-04'（默认 昨天）
   * @returns 查询到的所有增量数据
   */
  async getChannelDataPeriodByUids(
    queries: Array<{ platform: string, uid: string }>,
    startDate?: string,
    endDate?: string,
  ) {
    return this.accountDataRepository.getChannelDataPeriodByUids(queries, startDate, endDate)
  }

  /**
   * 根据platform和uid数组查询频道最新增量
   * @param queries 包含platform和uid组合的数组
   * @returns 返回dailyDelta字段的汇总数据
   */
  async getChannelDeltaByUids(queries: Array<{ platform: string, uid: string }>) {
    return this.accountDataRepository.getChannelDeltaByUids(queries)
  }
}
