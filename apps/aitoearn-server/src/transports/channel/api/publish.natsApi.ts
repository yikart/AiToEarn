import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AccountType, PublishStatus, PublishType } from '@yikart/mongodb'
import { NewPublishData, NewPublishRecordData, PlatOptions } from '../../../channel/common'
import { PublishDayInfoListFiltersDto } from '../../../channel/dto/publish.dto'
import { ChannelBaseApi } from '../../channelBase.api'
import { PublishRecordItem } from './types/publish.interfaces'

@Injectable()
export class PlatPublishNatsApi extends ChannelBaseApi {
  /**
   * 创建发布
   * @returns
   * @param newData
   */
  async create(newData: NewPublishData<PlatOptions>) {
    const res = await this.sendMessage<boolean>(
      `plat/publish/create`,
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
      `plat/publish/run`,
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
      `plat/publish/createRecord`,
      newData,
    )
    return res
  }

  // 获取发布记录
  async getPublishRecordList(filter: {
    userId: string
    accountId?: string
    accountType?: AccountType
    type?: PublishType
    status?: PublishStatus
    time?: [Date, Date]
  }) {
    const res = await this.sendMessage<any>(
      `plat/publish/getList`,
      { ...filter },
    )
    return res
  }

  // 修改发布任务时间
  async updatePublishRecordTime(data: {
    publishTime: Date
    userId: string
    id: string
  }) {
    const res = await this.sendMessage<boolean>(
      `plat/publish/changeTime`,
      data,
    )
    return res
  }

  // 删除发布任务
  async deletePublishRecord(data: { userId: string, id: string }) {
    const res = await this.sendMessage<boolean>(
      `plat/publish/delete`,
      data,
    )
    return res
  }

  // 立即发布任务
  async nowPubTask(id: string) {
    const res = await this.sendMessage<boolean>(
      `plat/publish/nowPubTask`,
      {
        id,
      },
    )
    return res
  }

  // 获取发布数据信息
  async getPublishInfoData(userId: string) {
    const res = await this.sendMessage<{
      totalCount: number
      list: PublishRecordItem[]
    }>(
      `plat/publish/publishInfo`,
      {
        userId,
      },
    )
    return res
  }

  async publishDataInfoList(userId: string, data: PublishDayInfoListFiltersDto, page: TableDto) {
    const res = await this.sendMessage<boolean>(
      `plat/publish/PublishDayInfo/list`,
      {
        filters: {
          userId,
          ...data,
        },
        page,
      },
    )
    return res
  }

  async getPublishRecordDetail(flowId: string, userId: string) {
    const res = await this.sendMessage<PublishRecordItem | null>(
      `plat/publish/recordDetail`,
      {
        flowId,
        userId,
      },
    )
    return res
  }

  async getPublishTaskDetail(flowId: string, userId: string) {
    const res = await this.sendMessage<PublishRecordItem | null>(
      `channel/publishing/task/detail`,
      {
        flowId,
        userId,
      },
    )
    return res
  }
}
