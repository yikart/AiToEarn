import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AccountType } from '@yikart/mongodb'
import { config } from '../../../config'
import { InteractionRecord } from './common'

@Injectable()
export class InteractionRecordNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  async add(data: {
    userId: string
    accountId: string
    type: AccountType
    worksId: string
    worksTitle?: string
    worksCover?: string
    worksContent?: string
    commentContent?: string
    commentRemark?: string
    commentTime?: string
    likeTime?: string
    collectTime?: string
  }) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/channel/interactionRecord/add`,
      data,
    )
    return res.data
  }

  /**
   * 获取作品评论列表
   * @returns
   */
  async list(userId: string, filters: {
    accountId?: string
    type?: AccountType
    worksId?: string
    time?: [Date, Date]
  }, page: TableDto) {
    const res = await this.httpService.axiosRef.post<{
      list: InteractionRecord[]
      total: number
    }>(
      `${config.channel.baseUrl}/channel/interactionRecord/list`,
      {
        filters: {
          userId,
          ...filters,
        },
        page,
      },
    )
    return res.data
  }

  /**
   * 删除
   * @param id
   * @returns
   */
  async del(id: string) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/channel/interactionRecord/del`,
      {
        id,
      },
    )
    return res.data
  }
}
