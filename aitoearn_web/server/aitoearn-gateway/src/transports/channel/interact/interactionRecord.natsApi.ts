import { Injectable } from '@nestjs/common'
import { TableDto } from '@/common/dto/table.dto'
import { BaseNatsApi } from '@/transports/base.natsApi'
import { AccountType } from '../../account/comment'
import { NatsApi } from '../../api'
import { InteractionRecord } from './common'

@Injectable()
export class InteractionRecordNatsApi extends BaseNatsApi {
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
    commentTime?: Date
    likeTime?: Date
    collectTime?: Date
  }) {
    const res = await this.sendMessage<boolean>(
      NatsApi.channel.interactionRecord.add,
      data,
    )
    return res
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
    const res = await this.sendMessage<{
      list: InteractionRecord[]
      total: number
    }>(
      NatsApi.channel.interactionRecord.list,
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
      NatsApi.channel.interactionRecord.del,
      {
        id,
      },
    )
    return res
  }
}
