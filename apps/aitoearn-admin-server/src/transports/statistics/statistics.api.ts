import { Injectable } from '@nestjs/common'
import { TaskBaseApi } from '../taskBase.api'

@Injectable()
export class StatisticsApi extends TaskBaseApi {
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
    const res = await this.sendMessage<string>(
      'statistics/account/getAccountDataLatest',
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
    const res = await this.sendMessage<string>(
      'statistics/account/getAccountDataIncrease',
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
    const res = await this.sendMessage<string>(
      'statistics/account/getAccountDataByParams',
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
    const res = await this.sendMessage<string>(
      'statistics/account/getAccountDataPeriod',
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

  /**
   * 批量获取频道最新数据并汇总粉丝数
   * @param queries 包含多个 { platform, uid } 的数组
   */
  async getChannelDataLatestByUids(
    queries: Array<{ platform: string, uid: string }>,
  ) {
    const res = await this.sendMessage(
      'statistics/account/getChannelDataLatestByUids',
      { queries },
    )
    return res
  }

  /**
   * 批量获取频道一段时间数据
   * @param queries 包含多个 { platform, uid } 的数组
   * @param startDate 开始日期
   * @param endDate 结束日期
   */
  async getChannelDataPeriodByUids(
    queries: Array<{ platform: string, uid: string }>,
    startDate?: string,
    endDate?: string,
  ) {
    const res = await this.sendMessage(
      'statistics/account/getChannelDataPeriodByUids',
      {
        queries,
        startDate,
        endDate,
      },
    )
    return res
  }

  /**
   * 根据任务ID 获取作品数据 并汇总
   * @param taskId 任务Id
   * @returns
   */
  async getTaskPostsDataCube(
    taskId: string,
  ) {
    const res = await this.sendMessage<unknown>(
      'statistics/task/posts/dataCube',
      {
        taskId,
      },
    )

    return res
  }

  /**
   * 根据任务ID 获取作品数据 并汇总
   * @param accountId 账户ID
   * @param taskId 任务Id
   * @returns
   */
  async getTaskPostPeriodDetail(
    // accountId: string,
    platform: string,
    postId: string,
  ) {
    const res = await this.sendMessage<unknown>(
      'statistics/task/posts/periodDetail',
      {
        platform,
        postId,
      },
    )

    return res
  }

  /**
   * 根据作品ID 获取单个作品数据
   * @param platform 平台
   * @param postId 作品Id
   * @returns
   */
  async getPostDetail(
    platform: string,
    postId: string,
  ) {
    const res = await this.sendMessage<string>(
      'statistics/post/detail',
      {
        platform,
        postId,
      },
    )

    return res
  }
}
