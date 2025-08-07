import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { AuthBackQueryDto } from '@/core/plat/wxGzh/dto/wxGzh.dto'
import { NatsApi } from '../api'

@Injectable()
export class PlatWxGzhNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 创建授权任务
   * @param userId
   * @param type
   * @param prefix
   * @returns
   */
  async createAuthTask(userId: string, type: 'pc' | 'h5', prefix?: string) {
    const res = await this.natsService.sendMessage<{
      url: string
      taskId: string
    }>(NatsApi.plat.wxGzh.auth, {
      userId,
      type,
      prefix,
    })

    return res
  }

  /**
   * 获取授权任务信息
   * @param taskId
   * @returns
   */
  async getAuthTaskInfo(taskId: string) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.wxGzh.getAuthInfo,
      {
        taskId,
      },
    )

    return res
  }

  async createAccountAndSetAccessToken(taskId: string, query: AuthBackQueryDto) {
    const res = await this.natsService.sendMessage<null>(
      NatsApi.plat.wxGzh.createAccountAndSetAccessToken,
      {
        taskId,
        ...query,
      },
    )

    return res
  }

  async updatePublishRecord(data: {
    publish_id: string
    appId: string
    article_url?: string
    article_id: string
  }) {
    const res = await this.natsService.sendMessage<null>(
      NatsApi.plat.wxGzh.updatePublishRecord,
      data,
    )

    return res
  }

  /**
   * 获取账号的授权信息
   * @param accountId
   * @returns
   */
  async getAccountAuthInfo(accountId: string) {
    const res = await this.natsService.sendMessage<null>(
      NatsApi.plat.bilibili.getAccountAuthInfo,
      {
        accountId,
      },
    )

    return res
  }

  /**
   * 获取累计用户数据
   * @param accountId
   * @param beginDate 开始日期
   * @param endDate 结束日期(最大跨度7天)
   * @returns
   */
  async getUserCumulate(accountId: string, beginDate: string, endDate: string) {
    const res = await this.natsService.sendMessage<null>(
      NatsApi.plat.wxGzh.getUserCumulate,
      {
        accountId,
        beginDate,
        endDate,
      },
    )

    return res
  }

  /**
   * 获取图文阅读概况数据
   * @param accountId 开始日期
   * @param beginDate 开始日期
   * @param endDate 结束日期(最大值为昨日)
   * @returns
   */
  async getUserRead(accountId: string, beginDate: string, endDate: string) {
    const res = await this.natsService.sendMessage<null>(
      NatsApi.plat.wxGzh.getUserRead,
      {
        accountId,
        beginDate,
        endDate,
      },
    )

    return res
  }
}
