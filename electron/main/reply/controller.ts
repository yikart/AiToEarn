/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-02-06 19:14:12
 * @LastEditors: nevin
 * @Description: reply Reply
 */
import { AccountService } from '../account/service';
import { Controller, Icp, Inject } from '../core/decorators';
import platController from '../plat';
import { WorkData } from '../plat/plat.type';
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
    pageInfo: {
      pageNo: number;
      pageSize: number;
    },
  ): Promise<{
    list: WorkData[];
    count: number;
  }> {
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
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await platController.getCommentList(account, dataId);
    return res;
  }
}
