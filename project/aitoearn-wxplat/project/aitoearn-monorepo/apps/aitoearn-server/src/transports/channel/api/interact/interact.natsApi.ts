import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { ChannelBaseApi } from '../../../channelBase.api'

@Injectable()
export class InteractNatsApi extends ChannelBaseApi {
  /**
   * 添加作品评论
   * @returns
   */
  async addArcComment(accountId: string, dataId: string, content: string) {
    const res = await this.sendMessage<boolean>(
      `channel/interact/addArcComment`,
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
    const res = await this.sendMessage<{
      list: any[]
      total: number
    }>(
      `channel/interact/getArcCommentList`,
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
    const res = await this.sendMessage<boolean>(
      `channel/interact/replyComment`,
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
    const res = await this.sendMessage<boolean>(
      `channel/interact/delComment`,
      {
        accountId,
        commentId,
      },
    )
    return res
  }
}
