/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-03-24 09:34:03
 * @LastEditors: nevin
 * @Description: interaction Interaction 互动
 */
import windowOperate from '../../util/windowOperate';
import { AutoRunModel, AutoRunType } from '../../db/models/autoRun';
import { AccountService } from '../account/service';
import { AutoRunService } from '../autoRun/service';
import { Controller, Et, Icp, Inject } from '../core/decorators';
import platController from '../plat';
import { InteractionService } from './service';
import { SendChannelEnum } from '../../../commont/UtilsEnum';
import { AutorReplyCommentScheduleEvent } from '../../../commont/types/reply';
import type { WorkData } from '../plat/plat.type';

@Controller()
export class InteractionController {
  @Inject(InteractionService)
  private readonly interactionService!: InteractionService;

  @Inject(AccountService)
  private readonly accountService!: AccountService;

  @Inject(AutoRunService)
  private readonly autoRunService!: AutoRunService;

  /**
   * 搜索列表
   */
  @Icp('ICP_INTERACTION_SEARCH_NODE_LIST')
  async getSearchNodeList(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    qe?: string,
    pageInfo?: any,
  ) {
    const account = await this.accountService.getAccountById(accountId);

    if (!account)
      return {
        list: [],
        count: 0,
      };

    const res = await platController.getsearchNodeList(account, qe, pageInfo);

    return res;
  }

  /**
   * 作品点赞
   */
  @Icp('ICP_DIANZAN_DY_OTHER')
  async dianzanDyOther(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    dataId: string,
    option?: any,
  ) {
    const account = await this.accountService.getAccountById(accountId);

    if (!account)
      return {
        list: [],
        count: 0,
      };

    const res = await platController.dianzanDyOther(account, dataId, option);

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

    const res = await platController.shoucangDyOther(account, pcursor);

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
   * 一键AI互动
   */
  @Icp('ICP_REPLY_COMMENT_LIST_BY_AI')
  async createCommentList(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    data: WorkData,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await this.interactionService.autorReplyComment(
      account,
      data,
      (e: {
        tag: AutorReplyCommentScheduleEvent;
        status: -1 | 0 | 1;
        data?: any;
        error?: any;
      }) => {
        windowOperate.sendRenderMsg(SendChannelEnum.CommentRelyProgress, e);
      },
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
    data: WorkData,
    cycleType: string,
  ): Promise<AutoRunModel | null> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await this.autoRunService.createAutoRun(
      {
        accountId,
        cycleType,
        type: AutoRunType.ReplyComment,
        userId: account.uid,
      },
      data,
    );

    return res;
  }

  // 运行自动评论任务
  @Et('ET_AUTO_RUN_REPLY_COMMENT')
  async runAutoReplyComment(autoRunData: AutoRunModel): Promise<boolean> {
    const { accountId, dataInfo } = autoRunData;
    if (!dataInfo) return false;

    const account = await this.accountService.getAccountById(accountId);
    if (!account) return false;

    const res = await this.interactionService.addReplyQueue(
      account,
      dataInfo as WorkData,
      autoRunData,
    );

    return res.status === 1;
  }
}
