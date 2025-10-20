import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AccountType, PublishStatus, PublishType } from '@yikart/mongodb'
import { config } from '../../config'
import { NewPublishData, NewPublishRecordData, PlatOptions } from '../common'
import { PublishDayInfoListFiltersDto } from '../dto/publish.dto'
import { PublishRecordItem } from './types/publish.interfaces'

@Injectable()
export class PlatPublishNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   * 创建发布
   * @returns
   * @param newData
   */
  async create(newData: NewPublishData<PlatOptions>) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/plat/publish/create`,
      newData,
    )
    return res.data
  }

  /**
   * 执行发布任务
   * @returns
   * @param id
   */
  async run(id: string) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/plat/publish/run`,
      { id },
    )
    return res.data
  }

  /**
   * 创建发布记录
   * @returns
   * @param newData
   */
  async createRecord(newData: NewPublishRecordData) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/plat/publish/createRecord`,
      newData,
    )
    return res.data
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
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/publish/getList`,
      { ...filter },
    )
    return res.data
  }

  // 修改发布任务时间
  async updatePublishRecordTime(data: {
    publishTime: Date
    userId: string
    id: string
  }) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/plat/publish/changeTime`,
      data,
    )
    return res.data
  }

  // 删除发布任务
  async deletePublishRecord(data: { userId: string, id: string }) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/plat/publish/delete`,
      data,
    )
    return res.data
  }

  // 立即发布任务
  async nowPubTask(id: string) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/plat/publish/nowPubTask`,
      {
        id,
      },
    )
    return res.data
  }

  // 获取发布数据信息
  async getPublishInfoData(userId: string) {
    const res = await this.httpService.axiosRef.post<{
      totalCount: number
      list: PublishRecordItem[]
    }>(
      `${config.channel.baseUrl}/plat/publish/publishInfo`,
      {
        userId,
      },
    )
    return res.data
  }

  async publishDataInfoList(userId: string, data: PublishDayInfoListFiltersDto, page: TableDto) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/plat/publish/PublishDayInfo/list`,
      {
        filters: {
          userId,
          ...data,
        },
        page,
      },
    )
    return res.data
  }

  async getPublishRecordDetail(flowId: string, userId: string) {
    const res = await this.httpService.axiosRef.post<PublishRecordItem | null>(
      `${config.channel.baseUrl}/plat/publish/recordDetail`,
      {
        flowId,
        userId,
      },
    )
    return res.data
  }

  async getPublishTaskDetail(flowId: string, userId: string) {
    const res = await this.httpService.axiosRef.post<PublishRecordItem | null>(
      `${config.channel.baseUrl}/channel/publishTask/taskDetail`,
      {
        flowId,
        userId,
      },
    )
    return res.data
  }
}
