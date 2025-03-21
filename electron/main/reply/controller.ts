/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-03-20 23:01:23
 * @LastEditors: nevin
 * @Description: reply Reply
 */
import { AutoRunModel, AutoRunType } from '../../db/models/autoRun';
import { AccountService } from '../account/service';
import { AutoRunService } from '../autoRun/service';
import { Controller, Et, Icp, Inject } from '../core/decorators';
import platController from '../plat';
import { ReplyService } from './service';

@Controller()
export class ReplyController {
  @Inject(ReplyService)
  private readonly replyService!: ReplyService;

  @Inject(AccountService)
  private readonly accountService!: AccountService;

  @Inject(AutoRunService)
  private readonly autoRunService!: AutoRunService;

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

    const res = await this.replyService.autorReplyComment(account, dataId);

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

  /**
   * 创建自动一键评论任务
   */
  @Icp('ICP_AUTO_RUN_CREATE_REPLY')
  async createReplyCommentAutoRun(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    dataId: string,
    cycleType: string,
  ): Promise<AutoRunModel | null> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await this.autoRunService.createAutoRun({
      accountId,
      cycleType,
      type: AutoRunType.ReplyComment,
      userId: account.uid,
      dataId,
    });

    return res;
  }

  // 运行自动任务
  @Et('ET_AUTO_RUN_REPLY_COMMENT')
  async runAutoReplyComment(autoRunData: AutoRunModel): Promise<any> {
    console.log('------ runAutoReplyComment ------', autoRunData.createTime);
  }
}
