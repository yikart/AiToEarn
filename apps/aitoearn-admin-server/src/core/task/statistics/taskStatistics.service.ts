import { Injectable } from '@nestjs/common'
import { StatisticsApi } from '../../../transports/statistics/statistics.api'

@Injectable()
export class TaskStatisticsService {
  constructor(private readonly statisticsApi: StatisticsApi) {}

  // 根据任务ID 获取作品数据 并汇总
  async getTaskPostsStatistics(
    taskId: string,
  ) {
    const res = await this.statisticsApi.getTaskPostsDataCube(taskId)
    return res
  }

  // 根据作品ID 按日期时间段 获取作品数据数组
  async getTaskPostStatisticsDetail(
    platform: string,
    postId: string,
  ) {
    const res = await this.statisticsApi.getTaskPostPeriodDetail(platform, postId)
    return res
  }
}
