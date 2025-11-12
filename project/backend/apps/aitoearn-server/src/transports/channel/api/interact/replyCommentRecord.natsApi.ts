import { Injectable } from '@nestjs/common'
import { AccountType, TableDto } from '@yikart/common'
import { ChannelBaseApi } from '../../../channelBase.api'
import { ReplyCommentRecord } from './common'

@Injectable()
export class ReplyCommentRecordNatsApi extends ChannelBaseApi {
  async add(data: {
    userId: string
    accountId: string
    type: AccountType
    worksId?: string
    commentId: string
    commentContent: string
    replyContent: string
  }) {
    const res = await this.sendMessage<boolean>(
      `channel/replyCommentRecord/add`,
      data,
    )
    return res
  }

  async list(userId: string, filters: {
    accountId?: string
    type?: AccountType
    commentId?: string
    time?: [Date, Date]
  }, page: TableDto) {
    const res = await this.sendMessage<{
      list: ReplyCommentRecord[]
      total: number
    }>(
      `channel/replyCommentRecord/list`,
      {
        filters: {
          userId,
          ...filters,
        },
        page,
      },
    )
    return res
  }

  /**
   * 删除
   * @param id
   * @returns
   */
  async del(id: string) {
    const res = await this.sendMessage<boolean>(
      `channel/replyCommentRecord/del`,
      {
        id,
      },
    )
    return res
  }
}
