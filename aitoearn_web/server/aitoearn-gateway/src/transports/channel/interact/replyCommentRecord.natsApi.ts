import { Injectable } from '@nestjs/common'
import { TableDto } from '@/common/dto/table.dto'
import { BaseNatsApi } from '@/transports/base.natsApi'
import { AccountType } from '../../account/comment'
import { NatsApi } from '../../api'
import { ReplyCommentRecord } from './common'

@Injectable()
export class ReplyCommentRecordNatsApi extends BaseNatsApi {
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
      NatsApi.channel.replyCommentRecord.add,
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
      NatsApi.channel.replyCommentRecord.list,
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
      NatsApi.channel.replyCommentRecord.del,
      {
        id,
      },
    )
    return res
  }
}
