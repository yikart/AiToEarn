/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-02-06 19:14:12
 * @LastEditors: nevin
 * @Description: reply Reply
 */
import { AccountType } from '../../../commont/AccountEnum';
import { AccountService } from '../account/service';
import { Controller, Icp, Inject } from '../core/decorators';
import platController from '../plat';
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
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await platController.getWorkList(account, pageInfo);
    return res;
  }
}
