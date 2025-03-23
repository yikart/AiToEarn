/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: Reply reply
 */
import { Injectable } from '../core/decorators';
import PQueue from 'p-queue';
import { CommentData } from '../plat/plat.type';
import { AccountModel } from '../../db/models/account';
import platController from '../plat';
import { toolsApi } from '../api/tools';

@Injectable()
export class ReplyService {
  replyQueue: PQueue;
  constructor() {
    this.replyQueue = new PQueue({ concurrency: 2 });
  }

  /**
   * 自动一键评论
   * 规则:评论所有的一级评论,已有自己的评论的不评论
   */
  async autorReplyComment(account: AccountModel, dataId: string) {
    // 1. 获取作品的评论列表, 如果返回
    let theHasMore = true;
    let thePcursor = undefined;

    const list: CommentData[] = [];

    while (theHasMore) {
      const {
        list,
        pageInfo: { pcursor, hasMore },
      } = await platController.getCommentList(account, dataId, thePcursor);

      for (const item of list) {
        list.push(item);
      }

      thePcursor = pcursor;
      theHasMore = !!hasMore;
    }

    // 2. 循环AI回复评论
    for (const element of list) {
      const aiRes = await toolsApi.aiRecoverReview({
        content: element.content,
      });

      platController.replyComment(account, element.commentId, aiRes, {
        dataId,
        comment: element,
      });
    }

    return true;
  }

  addReplyQueue(account: AccountModel, dataId: string) {
    this.replyQueue.add(() => {
      this.autorReplyComment(account, dataId);
    });
  }
}
