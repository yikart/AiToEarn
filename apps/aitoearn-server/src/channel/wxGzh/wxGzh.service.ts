import { Injectable } from '@nestjs/common'
import { PlatWxGzhNatsApi } from '../../transports/channel/api/wxGzh.natsApi'

@Injectable()
export class WxGzhService {
  constructor(private readonly platWxGzhNatsApi: PlatWxGzhNatsApi) {}

  // 创建授权任务
  async createAuthTask(userId: string, type: 'pc' | 'h5', spaceId: string) {
    const prefix = ''
    const res = await this.platWxGzhNatsApi.createAuthTask(
      userId,
      type,
      prefix,
      spaceId,
    )
    return res
  }

  // 获取授权任务信息
  async getAuthTaskInfo(taskId: string) {
    const res = await this.platWxGzhNatsApi.getAuthTaskInfo(taskId)
    return res
  }

  // 获取累计用户数据
  async getUserCumulate(accountId: string, beginDate: string, endDate: string) {
    const res = await this.platWxGzhNatsApi.getUserCumulate(accountId, beginDate, endDate)
    return res
  }

  // 获取图文阅读概况数据
  async getUserRead(accountId: string, beginDate: string, endDate: string) {
    const res = await this.platWxGzhNatsApi.getUserRead(accountId, beginDate, endDate)
    return res
  }
}
