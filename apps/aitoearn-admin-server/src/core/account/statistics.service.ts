import { Injectable } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { AdminAccountRepository } from '@yikart/mongodb'
import { AccountDataRepository, AccountType, PostRepository, TaskRepository } from '@yikart/statistics-db'

@Injectable()
export class StatisticsService {
  constructor(
    private readonly adminAccountRepository: AdminAccountRepository,
    private readonly accountDataRepository: AccountDataRepository,
    private readonly taskRepository: TaskRepository,
    private readonly postRepository: PostRepository,
  ) { }

  /**
   * 获取账号最新数据
   * @param accountId
   * @returns
   */
  async getAccountDataLatest(accountId: string) {
    const accountInfo = await this.adminAccountRepository.getAccountById(
      accountId,
    )
    if (!accountInfo) {
      throw new AppException(1000, 'account not found')
    }
    const res = await this.accountDataRepository.getAccountDataLatest(accountId, accountInfo.type, accountInfo.uid)
    return res
  }

  /**
   * 获取账号增量数据
   * @param accountId string
   * @returns
   */
  async getAccountDataIncrease(accountId: string) {
    const accountInfo = await this.adminAccountRepository.getAccountById(
      accountId,
    )
    if (!accountInfo) {
      throw new AppException(1, 'account not found')
    }

    const res = await this.accountDataRepository.getAccountDataIncrease(accountInfo.type, accountInfo.uid)
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
  async getAccountDataByParams(params: any, sort?: any, pageNo = 1, pageSize = 10) {
    const res = await this.accountDataRepository.getAccountDataByParams(params, sort, pageNo, pageSize)
    return res
  }

  /**
   * 获取账号一段时间数据
   * @param accountId 账户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns
   */
  async getAccountDataPeriod(
    accountId: string,
    startDate: string,
    endDate: string,
  ) {
    const accountInfo = await this.adminAccountRepository.getAccountById(
      accountId,
    )
    if (!accountInfo) {
      throw new AppException(1, 'account not found')
    }
    const res = await this.accountDataRepository.getAccountDataPeriod(accountId, accountInfo.type, accountInfo.uid, startDate, endDate)
    return res
  }

  /**
   * 批量获取频道最新数据并汇总粉丝数
   * @param id
   * @returns
   */
  async getChannelDataLatestByUids(queries: Array<{ platform: string, uid: string }>) {
    const res = await this.accountDataRepository.getChannelDataLatestByUids(queries)
    return res
  }

  /**
   * 批量获取频道一段时间数据
   * @param queries 包含多个 { platform, uid } 的数组
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns
   */
  async getChannelDataPeriodByUids(queries: Array<{ platform: string, uid: string }>, startDate?: string, endDate?: string) {
    const res = await this.accountDataRepository.getChannelDataPeriodByUids(queries, startDate, endDate)
    return res
  }

  /**
   * 根据任务ID 获取作品数据 并汇总
   * @param taskId
   * @returns
   */
  async getTaskPostsDataCube(taskId: string) {
    const res = await this.taskRepository.getTaskPostsSummary(taskId)
    return res
  }

  /**
   * 根据任务ID 获取作品数据 并汇总
   * @param accountId 账户ID
   * @param taskId 任务Id
   * @returns
   */
  async getTaskPostPeriodDetail(platform: string, postId: string) {
    const res = await this.postRepository.getPostDataByDateRange({ platform, postId })
    return res
  }

  /**
   * 根据作品ID 获取单个作品数据
   * @param platform 平台
   * @param postId 作品Id
   * @returns
   */
  async getPostDetail(platform: AccountType, postId: string) {
    const res = await this.postRepository.getPostsByPid({ platform, postId })
    return res
  }
}
