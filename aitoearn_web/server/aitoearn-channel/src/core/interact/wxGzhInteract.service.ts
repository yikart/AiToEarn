/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: 微信公众号-交互
 */
import { Injectable, Logger } from '@nestjs/common';
import { Account } from '@/libs/database/schema/account.schema';
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema';
import { WxGzhService } from '../plat/wxPlat/wxGzh.service';
import { InteracteBase } from './interact.base';

@Injectable()
export class WxGzhInteractService extends InteracteBase {
  constructor(readonly wxGzhService: WxGzhService) {
    super();
  }

  async addArcComment(account: Account, dataId: string, content: string) {
    Logger.log('addArcComment', account.id, dataId, content);
    return true;
  }

  async getArcCommentList(
    publishRecord: PublishRecord,
    query: {
      pageNo: number;
      pageSize: number;
    },
  ) {
    Logger.log('getArcCommentList', publishRecord, query);
    return {
      list: [],
      total: 0,
    };
  }

  async replyComment(accountId: string, commentId: string, content: string) {
    Logger.log('replyComment', commentId, content);
    return true;
  }

  async delComment(accountId: string, commentId: string) {
    Logger.log('delComment', commentId);
    return true;
  }
}
