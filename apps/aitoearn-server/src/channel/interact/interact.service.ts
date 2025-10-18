import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'

@Injectable()
export class InteractService {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   * TODO: 添加arc评论
   * @param userId
   */
  async addArcComment(
    accountId: string,
    dataId: string,
    content: string,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      'http://127.0.0.1:3000/api/channel/interact/addArcComment',
      {
        accountId,
        dataId,
        content,
      },
    )
    return res.data
  }

  async getArcCommentList(recordId: string, query: TableDto) {
    const res = await this.httpService.axiosRef.post<any>(
      'http://127.0.0.1:3000/api/channel/interact/getArcCommentList',
      {
        recordId,
        pageNo: query.pageNo,
        pageSize: query.pageSize,
      },
    )
    return res.data
  }

  async replyComment(accountId: string, commentId: string, content: string) {
    const res = await this.httpService.axiosRef.post<any>(
      'http://127.0.0.1:3000/api/channel/interact/replyComment',
      {
        accountId,
        commentId,
        content,
      },
    )
    return res.data
  }

  async delComment(accountId: string, commentId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      'http://127.0.0.1:3000/api/channel/interact/delComment',
      {
        accountId,
        commentId,
      },
    )
    return res.data
  }
}
