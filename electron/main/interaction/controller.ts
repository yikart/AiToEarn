/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-04-27 09:51:25
 * @LastEditors: nevin
 * @Description: interaction Interaction 互动
 */
import windowOperate from '../../util/windowOperate';
import { AutoRunModel, AutoRunType } from '../../db/models/autoRun';
import { AccountService } from '../account/service';
import { AutoRunService } from '../autoRun/service';
import { Controller, Et, Icp, Inject, Scheduled } from '../core/decorators';
import { InteractionService } from './service';
import { SendChannelEnum } from '../../../commont/UtilsEnum';
import type { WorkData } from '../plat/plat.type';
import { AutorWorksInteractionScheduleEvent } from '../../../commont/types/interaction';
import { AutoInteractionCache } from './cacheData';
import { getUserInfo } from '../user/comment';
import type { CorrectQuery } from '../../global/table';
import { AccountType } from '../../../commont/AccountEnum';
import { taskApi } from '../api/taskApi';
import platController from '../plat';

@Controller()
export class InteractionController {
  @Inject(InteractionService)
  private readonly interactionService!: InteractionService;

  @Inject(AccountService)
  private readonly accountService!: AccountService;

  @Inject(AutoRunService)
  private readonly autoRunService!: AutoRunService;

  /**
   * 一键AI互动
   */
  @Icp('ICP_INTERACTION_ONE_DATA')
  async interactionOneData(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    works: WorkData,
    option: {
      commentContent: string; // 评论内容
    },
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await this.interactionService.autorInteraction(
      account,
      [works],
      option as any,
      (e: {
        tag: AutorWorksInteractionScheduleEvent;
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
   * 一键AI互动
   */
  @Icp('ICP_INTERACTION_ONE_KEY')
  async interactionOneKey(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    worksList: WorkData[],
    option: {
      commentContent: string; // 评论内容
      taskId?: string; // 任务ID
      platform?: string; // 平台ID
      likeProb?: any; // 点赞概率
      collectProb?: any; // 收藏概率
      commentProb?: any; // 评论概率
      commentType: any; // 评论类型
    },
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await this.interactionService.autorInteraction(
      account,
      worksList,
      option,
      (e: {
        tag: AutorWorksInteractionScheduleEvent;
        status: -1 | 0 | 1;
        data?: any;
        error?: any;
      }) => {
        windowOperate.sendRenderMsg(SendChannelEnum.InteractionProgress, e);
      },
    );

    return res;
  }

  /**
   * 创建自动AI评论截流任务
   */
  @Icp('ICP_AUTO_RUN_INTERACTION')
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
      dataInfo as WorkData[],
      {
        commentContent: dataInfo.commentContent,
      },
      autoRunData,
    );

    return res.status === 1;
  }

  /**
   * 获取AI评论截流的记录列表
   */
  @Icp('ICP_GET_INTERACTION_RECORD_LIST')
  async getInteractionRecordList(
    event: Electron.IpcMainInvokeEvent,
    page: CorrectQuery,
    query: {
      accountId?: number;
      type?: AccountType;
    },
  ): Promise<any> {
    const userInfo = getUserInfo();

    return this.interactionService.getInteractionRecordList(
      userInfo.id,
      page,
      query,
    );
  }

  /**
   * 获取AI评论截流的任务信息
   */
  @Icp('ICP_GET_AUTO_INTERACTION_INFO')
  async getAutoInteractionInfo(
    event: Electron.IpcMainInvokeEvent,
  ): Promise<any | null> {
    return AutoInteractionCache.getInfo();
  }

  // 自动互动, 每10秒进行
  @Scheduled('0 * * * * *', 'autoHudong')
  async zidongHudong() {
    // return;
    console.log('自动互动 ing ...');
    const res = await taskApi.getActivityTask();
    console.log('---- zidongHudong ----', res);
    const userList = await this.interactionService.getUserList();
    console.log('---- userList ----', userList);
    if (!userList.length) {
      return;
    }
    const accountList = await this.interactionService.getAccountList(userList[userList.length - 1].id);
    // console.log('---- accountList ----', accountList[0]);
    if (res.items.length > 0) {
      for (const item of res.items) {
        for (const accountType of item.accountTypes) {   
          let myAccountTypeList = [];
          for (const account of accountList) {
            if (account.type === accountType && account.status === 0) {
              myAccountTypeList.push(account);
              // 申请任务
              try {
                const applyTaskRes = await taskApi.applyTask(item.id || item._id, {
                  account: account.account,
                  uid: account.uid,
                  accountType: account.type,
                });
                console.log('---- applyTaskRes ----', applyTaskRes);
                if (applyTaskRes.data.data?.data) {
                  item.taskId = applyTaskRes.data.data?.data.id;
                }
              } catch (error) {
                console.error('申请任务失败:', error);
              }
            }
          }
          // console.log('---- myAccountTypeList ----', myAccountTypeList);
  
          for (const account of myAccountTypeList) {
            // console.log('---- account ----', account);
            console.log('---- item.dataInfo?.commentContent ----', item.dataInfo?.commentContent);
            const autorInteractionList = this.interactionService.getAutorInteractionList(account, [{
              author: {id: item.dataInfo?.authorId || ''} ,
                data : {id: item.dataInfo.worksId, xsec_token: item.dataInfo?.xsec_token || ''},
                dataId : item.dataInfo.worksId,
                option : {xsec_token: item.dataInfo?.xsec_token || ''},
                title : item.title,
            }], {
              accountType: accountType,
              commentContent: item.dataInfo?.commentContent,
            });

            // 提交完成任务
            console.log('---- autorInteractionList ----', autorInteractionList);
            let submitTasStr = '作品'+ item.dataInfo.worksId + '账户'+ account.nickname + '账户ID'+ account.uid;
            console.log('item.taskId', item.taskId)
            const submitTaskRes = await taskApi.submitTask(item.taskId, {
              submissionUrl: submitTasStr,
              screenshotUrls: [],
              qrCodeScanResult: submitTasStr,
            });
            console.log('---- submitTaskRes ----', submitTaskRes);
          }
        }
      }
    }
  }
}
