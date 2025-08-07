import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { TableDto } from '@/common/dto/table.dto'
import { NatsApi } from '../api'

@Injectable()
export class InteractNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 添加作品评论
   * @returns
   */
  async addArcComment(accountId: string, dataId: string, content: string) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.channel.interact.addArcComment,
      {
        accountId,
        dataId,
        content,
      },
    )
    return res
  }

  /**
   * 获取作品评论列表
   * @returns
   */
  async getArcCommentList(recordId: string, query: TableDto) {
    const res = await this.natsService.sendMessage<{
      list: any[]
      total: number
    }>(
      NatsApi.channel.interact.getArcCommentList,
      {
        recordId,
        pageNo: query.pageNo,
        pageSize: query.pageSize,
      },
    )
    return res
  }

  /**
   * 回复评论
   * @param accountId
   * @param commentId
   * @returns
   */
  async replyComment(accountId: string, commentId: string, content: string) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.channel.interact.replyComment,
      {
        accountId,
        commentId,
        content,
      },
    )
    return res
  }

  /**
   * 删除评论
   * @param accountId
   * @param commentId
   * @returns
   */
  async delComment(accountId: string, commentId: string) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.channel.interact.delComment,
      {
        accountId,
        commentId,
      },
    )
    return res
  }
}
