import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { config } from '../../../config'

@Injectable()
export class InteractNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   * 添加作品评论
   * @returns
   */
  async addArcComment(accountId: string, dataId: string, content: string) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/channel/interact/addArcComment`,
      {
        accountId,
        dataId,
        content,
      },
    )
    return res.data
  }

  /**
   * 获取作品评论列表
   * @returns
   */
  async getArcCommentList(recordId: string, query: TableDto) {
    const res = await this.httpService.axiosRef.post<{
      list: any[]
      total: number
    }>(
      `${config.channel.baseUrl}/channel/interact/getArcCommentList`,
      {
        recordId,
        pageNo: query.pageNo,
        pageSize: query.pageSize,
      },
    )
    return res.data
  }

  /**
   * 回复评论
   * @param accountId
   * @param commentId
   * @returns
   */
  async replyComment(accountId: string, commentId: string, content: string) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/channel/interact/replyComment`,
      {
        accountId,
        commentId,
        content,
      },
    )
    return res.data
  }

  /**
   * 删除评论
   * @param accountId
   * @param commentId
   * @returns
   */
  async delComment(accountId: string, commentId: string) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/channel/interact/delComment`,
      {
        accountId,
        commentId,
      },
    )
    return res.data
  }
}
