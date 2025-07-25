import { Injectable } from '@nestjs/common'
import { NewPublishData, PlatOptons } from 'src/core/plat/common'
import { NatsService } from 'src/transports/nats.service'
import { AccountType } from '../account/comment'
import { NatsApi } from '../api'
import { PubType } from '../content/common'
import { PublishRecordItem } from './types/publish.interfaces'

export enum PublishStatus {
  FAIL = -1, // 发布失败
  UNPUBLISH = 0, // 未发布
  RELEASED = 1, // 已发布
  PUB_LOADING = 2, // 发布中
}

@Injectable()
export class PlatPublishNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 创建发布
   * @returns
   * @param newData
   */
  async create(newData: NewPublishData<PlatOptons>) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.plat.publish.create,
      newData,
    )

    return res
  }

  /**
   * 执行发布任务
   * @returns
   * @param id
   */
  async run(id: string) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.plat.publish.run,
      { id },
    )

    return res
  }

  // 获取发布记录
  async getPublishRecordList(filter: {
    userId: string
    accountId?: string
    accountType?: AccountType
    type?: PubType
    status?: PublishStatus
    time?: [Date, Date]
  }) {
    return await this.natsService.sendMessage<{
      totalCount: number
      list: PublishRecordItem[]
    }>(NatsApi.plat.publish.getList, {
      ...filter,
    })
  }

  // 修改发布任务时间
  async updatePublishRecordTime(data: {
    publishTime: Date
    userId: string
    id: string
  }) {
    return await this.natsService.sendMessage<boolean>(
      NatsApi.plat.publish.changeTime,
      data,
    )
  }

  // 删除发布任务
  async deletePublishRecord(data: { userId: string, id: string }) {
    return await this.natsService.sendMessage<boolean>(
      NatsApi.plat.publish.delete,
      data,
    )
  }
}
