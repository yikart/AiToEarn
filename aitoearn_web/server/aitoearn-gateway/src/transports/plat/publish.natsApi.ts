import { Injectable } from '@nestjs/common'
import { NewPublishData, NewPublishRecordData, PlatOptions } from 'src/core/plat/common'
import { TableDto } from '@/common/dto/table.dto'
import { PublishDayInfoListFiltersDto } from '@/core/plat/dto/publish.dto'
import { AccountType } from '../account/comment'
import { NatsApi } from '../api'
import { BaseNatsApi } from '../base.natsApi'
import { PubType } from '../content/common'
import { PublishDayInfo, PublishRecordItem } from './types/publish.interfaces'

export enum PublishStatus {
  FAIL = -1, // 发布失败
  UNPUBLISH = 0, // 未发布
  RELEASED = 1, // 已发布
  PUB_LOADING = 2, // 发布中
}

@Injectable()
export class PlatPublishNatsApi extends BaseNatsApi {
  /**
   * 创建发布
   * @returns
   * @param newData
   */
  async create(newData: NewPublishData<PlatOptions>) {
    const res = await this.sendMessage<boolean>(
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
    const res = await this.sendMessage<boolean>(
      NatsApi.plat.publish.run,
      { id },
    )

    return res
  }

  /**
   * 创建发布记录
   * @returns
   * @param newData
   */
  async createRecord(newData: NewPublishRecordData) {
    const res = await this.sendMessage<boolean>(
      NatsApi.plat.publish.createRecord,
      newData,
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
    return await this.sendMessage<{
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
    return await this.sendMessage<boolean>(
      NatsApi.plat.publish.changeTime,
      data,
    )
  }

  // 删除发布任务
  async deletePublishRecord(data: { userId: string, id: string }) {
    return await this.sendMessage<boolean>(
      NatsApi.plat.publish.delete,
      data,
    )
  }

  // 立即发布任务
  async nowPubTask(id: string) {
    return await this.sendMessage<boolean>(
      NatsApi.plat.publish.nowPubTask,
      {
        id,
      },
    )
  }

  // 获取发布数据信息
  async getPublishInfoData(userId: string) {
    return await this.sendMessage<{
      totalCount: number
      list: PublishRecordItem[]
    }>(NatsApi.channel.publish.publishInfo.data, {
      userId,
    })
  }

  async publishDataInfoList(userId: string, data: PublishDayInfoListFiltersDto, page: TableDto) {
    return await this.sendMessage<{
      total: number
      list: PublishDayInfo[]
    }>(NatsApi.channel.publish.PublishDayInfo.list, {
      filters: {
        userId,
        ...data,
      },
      page,
    })
  }
}
