import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AccountType } from '@yikart/mongodb'
import { config } from '../../../config'
import { ReplyCommentRecord } from './common'

@Injectable()
export class ReplyCommentRecordNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  async add(data: {
    userId: string
    accountId: string
    type: AccountType
    worksId?: string
    commentId: string
    commentContent: string
    replyContent: string
  }) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/channel/replyCommentRecord/add`,
      data,
    )
    return res.data
  }

  async list(userId: string, filters: {
    accountId?: string
    type?: AccountType
    commentId?: string
    time?: [Date, Date]
  }, page: TableDto) {
    const res = await this.httpService.axiosRef.post<{
      list: ReplyCommentRecord[]
      total: number
    }>(
      `${config.channel.baseUrl}/channel/replyCommentRecord/list`,
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
      `${config.channel.baseUrl}/channel/replyCommentRecord/del`,
      {
        id,
      },
    )
    return res.data
  }
}
