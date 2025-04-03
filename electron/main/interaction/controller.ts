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
import { InteractionService } from './service';
import { SendChannelEnum } from '../../../commont/UtilsEnum';
import type { WorkData } from '../plat/plat.type';
import { AutorWorksInteractionScheduleEvent } from '../../../commont/types/interaction';

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
  @Icp('ICP_INTERACTION_ONE_KEY')
  async interactionOneKey(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    worksList: WorkData[],
    option: {
      commentContent: string; // 评论内容
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
        windowOperate.sendRenderMsg(SendChannelEnum.CommentRelyProgress, e);
      },
    );

    return res;
  }

  /**
   * 创建自动一键互动任务
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
}
