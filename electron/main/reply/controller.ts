/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-02-06 19:14:12
 * @LastEditors: nevin
 * @Description: reply Reply
 */
import { AccountService } from '../account/service';
import { toolsApi } from '../api/tools';
import { Controller, Icp, Inject } from '../core/decorators';
import platController from '../plat';
import type { CommentData, PageInfo } from '../plat/plat.type';
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
    pageInfo: PageInfo,
  ) {
    const account = await this.accountService.getAccountById(accountId);

    if (!account)
      return {
        list: [],
        count: 0,
      };

    const res = await platController.getWorkList(account, pageInfo);

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
    pageInfo: PageInfo,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await platController.getCommentList(account, dataId, pageInfo);
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
    const res1 = await toolsApi.aiRecoverReview({
      content: '今天天气真好',
    });

    console.log('------ res1', res1);

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
      } = await platController.getCommentList(account, dataId, {
        pcursor: thePcursor,
      });

      list.forEach((item) => {
        list.push(item);
      });

      thePcursor = pcursor;
      theHasMore = !!hasMore;
    }

    // 2. 循环AI回复评论
    for (const element of list) {
      platController.replyComment(account, element.commentId, '嗨', {
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
}
