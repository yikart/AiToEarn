/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: 微信公众号-交互
 */
import { Injectable, Logger } from '@nestjs/common'
import { PublishRecord } from '@yikart/aitoearn-server-client'
import { Account } from '../../libs/database/schema/account.schema'
import { WxGzhService } from '../plat/wxPlat/wxGzh.service'
import { InteracteBase } from './interact.base'

@Injectable()
export class WxGzhInteractService extends InteracteBase {
  private readonly logger = new Logger(WxGzhInteractService.name)
  constructor(readonly wxGzhService: WxGzhService) {
    super()
  }

  /**
   * 创建文章评论
   * @param account
   * @param dataId
   * @param content
   * @returns
   */
  async addArcComment(account: Account, dataId: string, content: string) {
    this.logger.log('addArcComment', account.id, dataId, content)
    return true
  }

  async getArcCommentList(
    publishRecord: PublishRecord,
    query: {
      pageNo: number
      pageSize: number
    },
  ) {
    this.logger.log('getArcCommentList', publishRecord, query)
    return {
      list: [],
      total: 0,
    }
  }

  async replyComment(accountId: string, commentId: string, content: string) {
    this.logger.log('replyComment', commentId, content)
    return true
  }

  async delComment(accountId: string, commentId: string) {
    this.logger.log('delComment', commentId)
    return true
  }
}
