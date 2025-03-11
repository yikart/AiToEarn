/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-02-06 19:14:12
 * @LastEditors: nevin
 * @Description: reply Reply
 */
import { AccountService } from '../account/service';
import { Controller, Icp, Inject } from '../core/decorators';
import { ReplyService } from './service';

@Controller()
export class ReplyController {
  @Inject(ReplyService)
  private readonly replyService!: ReplyService;

  @Inject(AccountService)
  private readonly accountService!: AccountService;

  /**
   * 测试获取抖音作品列表
   */
  @Icp('ICP_CREATOR_LIST')
  async addUser(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
  ): Promise<any> {
    const account = await this.accountService.getAccountById(accountId);
    if (!account) return null;

    const res = await this.replyService.testGetDouyinList(account);
    return res;
  }
}
