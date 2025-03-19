/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-03-19 15:01:54
 * @LastEditors: nevin
 * @Description: reply Reply
 */
import { AutoRunModel } from '../../db/models/autoRun';
import { AccountService } from '../account/service';
import { toolsApi } from '../api/tools';
import { Controller, Et, Icp, Inject } from '../core/decorators';
import platController from '../plat';
import type { CommentData } from '../plat/plat.type';
import { ReplyService } from './service';

@Controller()
export class ReplyController {
  @Inject(ReplyService)
  private readonly replyService!: ReplyService;

  @Inject(AccountService)
  private readonly accountService!: AccountService;

  /**
   * 作品列表
   */
  @Icp('ICP_CREATOR_LIST')
  async getCreatorList(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    pcursor?: string,
  ) {
    const account = await this.accountService.getAccountById(accountId);

    if (!account)
      return {
        list: [],
        count: 0,
      };

    const res = await platController.getWorkList(account, pcursor);

    return res;
  }

  /**
   * 获取评论列表
   */
  @Icp('ICP_COMMENT_LIST')
  async getCommentList(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    dataId: string,
    pcursor?: string,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await platController.getCommentList(account, dataId, pcursor);
    return res;
  }

  /**
   * 创建评论
   */
  @Icp('ICP_CREATE_COMMENT')
  async createComment(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    dataId: string,
    content: string,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await platController.createComment(account, dataId, content);
    return res;
  }

  /**
   * 作品一键AI评论
   */
  @Icp('ICP_REPLY_COMMENT_LIST_BY_AI')
  async createCommentList(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    dataId: string,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    // 1. 获取作品的评论列表, 如果返回
    let theHasMore = true;
    let thePcursor = undefined;

    const list: CommentData[] = [];

    while (theHasMore) {
      const {
        list,
        pageInfo: { pcursor, hasMore },
      } = await platController.getCommentList(account, dataId, thePcursor);

      list.forEach((item) => {
        list.push(item);
      });

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

  /**
   * 回复评论
   */
  @Icp('ICP_REPLY_COMMENT')
  async replyComment(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    commentId: string,
    content: string,
    option: {
      dataId?: string; // 作品ID
      comment: any; // 辅助数据,原数据
    },
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await platController.replyComment(
      account,
      commentId,
      content,
      option,
    );
    return res;
  }

  // 运行自动任务
  @Et('ET_AUTO_RUN_REPLY_COMMENT')
  async runAutoReplyComment(autoRunData: AutoRunModel): Promise<any> {
    console.log('------ runAutoReplyComment ------', autoRunData.createTime);
  }
}
