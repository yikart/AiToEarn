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
import { ReplyService } from './service';
import { SendChannelEnum } from '../../../commont/UtilsEnum';
import { AutorReplyCommentScheduleEvent } from '../../../commont/types/reply';
import type { WorkData } from '../plat/plat.type';
import { GlobleCache } from '../../global/cache';
import { AutoReplyCache } from './cacheData';
import type { CorrectQuery } from '../../global/table';
import { PlatType } from '../../../commont/AccountEnum';
import { getUserInfo } from '../user/comment';
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
   * 搜索列表
   */
  @Icp('ICP_SEARCH_NODE_LIST')
  async getSearchNodeList(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    qe?: string, // 搜索内容
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
   * 获取评论列表
   */
  @Icp('ICP_COMMENT_LIST')
  async getCommentList(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    data: WorkData,
    pcursor?: string,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    console.log('------ 评论列表 start ------');

    const res = await platController.getCommentList(account, data, pcursor);
    console.log('------ 评论列表 end ------', res);

    return res;
  }

  /**
   * 获取其他人评论列表
   */
  @Icp('ICP_COMMENT_LIST_BY_OTHER')
  async getCommentListByOther(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    data: WorkData,
    pcursor?: string,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await platController.getCreatorCommentListByOther(
      account,
      data,
      pcursor,
    );
    return res;
  }

  /**
   * 获取二级评论列表
   */
  @Icp('ICP_SECOND_COMMENT_LIST_BY_OTHER')
  async getSecondCommentListByOther(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    data: WorkData,
    root_comment_id: string,
    pcursor?: string,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await platController.getCreatorSecondCommentListByOther(
      account,
      data,
      root_comment_id,
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
    authorId?: string,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await platController.createCommentByOther(
      account,
      dataId,
      content,
      authorId,
    );
    return res;
  }

  /**
   * 作品一键AI评论(该进程只同时进行一个)
   */
  @Icp('ICP_REPLY_COMMENT_LIST_BY_AI')
  async createCommentList(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    data: WorkData,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    if (GlobleCache.getCache('replyCommentListByAi')) return null;

    GlobleCache.setCache(`replyCommentListByAi`, true, 60 * 60);

    const res = await this.replyService.autorReplyComment(
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

    GlobleCache.delCache(`replyCommentListByAi`);

    return res;
  }

  /**
   * 回复二级评论
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
      videoAuthId?: string; // 视频作者ID
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

    const res = await this.replyService.addReplyQueue(
      account,
      dataInfo as WorkData,
      autoRunData,
    );

    return res.status === 1;
  }

  /**
   * 获取一键回复评论的任务信息
   */
  @Icp('ICP_GET_AUTO_REPLY_INFO')
  async getAutoReplyInfo(
    event: Electron.IpcMainInvokeEvent,
  ): Promise<any | null> {
    return AutoReplyCache.getInfo();
  }

  /**
   * 获取回复评论的记录列表
   */
  @Icp('ICP_GET_REPLAY_COMMENT_RECORD_LIST')
  async getReplyCommentRecordList(
    event: Electron.IpcMainInvokeEvent,
    page: CorrectQuery,
    query: {
      accountId?: number;
      type?: PlatType;
    },
  ): Promise<any> {
    const userInfo = getUserInfo();

    return this.replyService.getReplyCommentRecordList(
      userInfo.id,
      page,
      query,
    );
  }
}
