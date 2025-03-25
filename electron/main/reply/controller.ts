/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-03-24 09:34:03
 * @LastEditors: nevin
 * @Description: reply Reply
 */
import windowOperate from '../../util/windowOperate';
import { AutoRunModel, AutoRunType } from '../../db/models/autoRun';
import { AccountService } from '../account/service';
import { AutoRunService } from '../autoRun/service';
import { Controller, Et, Icp, Inject } from '../core/decorators';
import platController from '../plat';
import { AutorReplyCommentScheduleEvent } from './comment';
import { ReplyService } from './service';
import { SendChannelEnum } from '../../../commont/UtilsEnum';

@Controller()
export class ReplyController {
  @Inject(ReplyService)
  private readonly replyService!: ReplyService;

  @Inject(AccountService)
  private readonly accountService!: AccountService;

  @Inject(AutoRunService)
  private readonly autoRunService!: AutoRunService;


  

    /**
   * 作品点赞
   */
    @Icp('ICP_DIANZAN_DY_OTHER')
    async dianzanDyOther(
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
   * 作品收藏
   */
  @Icp('ICP_SHOUCANG_DY_OTHER')
  async shoucangDyOther(
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
   * 获取其他人评论列表
   */
  @Icp('ICP_COMMENT_LIST_BY_OTHER')
  async getCommentListByOther(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    dataId: string,
    pcursor?: string,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await platController.getCreatorCommentListByOther(
      account,
      dataId,
      pcursor,
    );
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
   * 创建评论
   */
  @Icp('ICP_CREATE_COMMENT_BY_OTHER')
  async createCommentByOther(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    dataId: string,
    content: string,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await platController.createCommentByOther(
      account,
      dataId,
      content,
    );
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

    const res = await this.replyService.autorReplyComment(
      account,
      dataId,
      (e: {
        tag: AutorReplyCommentScheduleEvent;
        status: -1 | 0 | 1;
        error?: any;
      }) => {
        windowOperate.sendRenderMsg(SendChannelEnum.CommentRelyProgress, e);
      },
    );

    return res;
  }

  /**
   * 回复评论
   */
  @Icp('ICP_REPLY_COMMENT_BY_OTHER')
  async replyCommentByOther(
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

    const res = await platController.replyCommentByOther(
      account,
      commentId,
      content,
      option,
    );
    return res;
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
    const { accountId, dataId } = autoRunData;
    if (!dataId) return null;

    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    this.replyService.addReplyQueue(account, dataId, autoRunData);

    // 创建记录
    this.autoRunService.createAutoRunRecord(autoRunData);
  }
}
