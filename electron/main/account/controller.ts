/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-02-19 22:08:57
 * @LastEditors: nevin
 * @Description:
 */
import { Controller, Et, Icp, Inject } from '../core/decorators';
import { AccountService } from './service';
import { getUserInfo } from '../user/comment';
import platController from '../plat';
import type { ICreateBrowserWindowParams } from './BrowserWindow/browserWindow';
import { browserWindowController } from './BrowserWindow';
import { AccountStatus, AccountType } from '../../../commont/AccountEnum';
import { AccountModel } from '../../db/models/account';
import windowOperate from '../../util/windowOperate';
import { SendChannelEnum } from '../../../commont/UtilsEnum';

@Controller()
export class AccountController {
  @Inject(AccountService)
  private readonly accountService!: AccountService;

  // 创建浏览器视图
  @Icp('ICP_ACCOUNT_CREATE_BROWSER_VIEW')
  async createBrowserView(
    event: Electron.IpcMainInvokeEvent,
    data: ICreateBrowserWindowParams,
  ): Promise<void> {
    await browserWindowController.createBrowserWindow(data);
  }

  // 销毁浏览器视图
  @Icp('ICP_ACCOUNT_DESTROY_BROWSER_VIEW')
  async destroyBrowserView(
    event: Electron.IpcMainInvokeEvent,
    webViewId: number,
  ): Promise<void> {
    browserWindowController.destroyBrowserWindow(webViewId);
  }

  /**
   * 登录三方平台
   */
  @Icp('ICP_ACCOUNT_LOGIN')
  async accountLogin(
    event: Electron.IpcMainInvokeEvent,
    pType: AccountType,
  ): Promise<any> {
    const userInfo = getUserInfo();

    const accountInfo = await platController.platlogin(pType);
    if (!accountInfo) return null;

    accountInfo.status = AccountStatus.USABLE;
    accountInfo.userId = userInfo.id;

    const account = await this.accountService.addOrUpdateAccount(
      {
        userId: userInfo.id,
        type: pType,
        uid: accountInfo?.uid || '',
      },
      accountInfo,
    );
    windowOperate.sendRenderMsg(SendChannelEnum.AccountLoginFinish);
    // 保存账户信息
    return account;
  }

  /**
   * 账户登录检测
   */
  @Icp('ICP_ACCOUNT_LOGIN_CHECK')
  async checkAccountLogin(
    event: Electron.IpcMainInvokeEvent,
    pType: AccountType,
    uid: string,
  ): Promise<AccountModel | null> {
    const userInfo = getUserInfo();

    const accountInfo = await this.accountService.getAccountInfo({
      type: pType,
      userId: userInfo.id,
      uid: uid,
    });
    if (!accountInfo) return accountInfo;
    // 取出cookie
    if (!accountInfo.loginCookie) return accountInfo;

    const res = await platController
      .platLoginCheck(pType, accountInfo)
      .catch(() => false);
    console.log(res);
    const account = await this.accountService.updateAccountStatus(
      accountInfo!.id!,
      res ? AccountStatus.USABLE : AccountStatus.DISABLE,
    );
    windowOperate.sendRenderMsg(SendChannelEnum.AccountLoginFinish);
    return account || accountInfo;
  }

  // 更新用户状态
  @Icp('ICP_ACCOUNT_UPDATE_STATUS')
  async updateAccountStatus(
    event: Electron.IpcMainInvokeEvent,
    // 账户ID
    id: number,
    status: AccountStatus,
  ) {
    return this.accountService.updateAccountStatus(id, status);
  }

  // 获取账户信息
  @Icp('ICP_ACCOUNT_GET_INFO')
  async getAccountInfo(
    event: Electron.IpcMainInvokeEvent,
    data: { type: AccountType; uid: string },
  ): Promise<any> {
    const userInfo = getUserInfo();

    const { type, uid } = data;

    const accountInfo = await this.accountService.getAccountInfo({
      type,
      userId: userInfo.id,
      uid,
    });

    // console.log('userInfouserInfo@@@:', accountInfo);

    return accountInfo;
  }

  // 获取账户列表
  @Icp('ICP_ACCOUNT_GET_LIST')
  async getAccountList(event: Electron.IpcMainInvokeEvent): Promise<any> {
    const userInfo = getUserInfo();
    return this.accountService.getAccounts(userInfo.id);
  }

  // 获取账户列表(ids)
  @Icp('ICP_ACCOUNT_GET_LIST_BY_IDS')
  async getAccountListByIds(
    event: Electron.IpcMainInvokeEvent,
    ids: number[],
  ): Promise<any> {
    const userInfo = getUserInfo();
    return this.accountService.getAccountListByIds(userInfo.id, ids);
  }

  // 获取账户总数
  @Icp('ICP_ACCOUNT_GET_COUNT')
  async getAccountCount(event: Electron.IpcMainInvokeEvent): Promise<any> {
    const userInfo = getUserInfo();
    return this.accountService.getAccountCount(userInfo.id);
  }

  // 获取账户统计
  @Icp('ICP_ACCOUNT_STATISTICS')
  async getAccountStatistics(
    event: Electron.IpcMainInvokeEvent,
    type?: AccountType,
  ): Promise<any> {
    const userInfo = getUserInfo();
    return this.accountService.getAccountStatistics(userInfo.id, type);
  }

  // 获取账户的看板数据
  @Icp('ICP_ACCOUNT_DASHBOARD')
  async getDashboard(
    event: Electron.IpcMainInvokeEvent,
    id: number,
    time?: any,
  ) {
    if (!id) return null;

    const account = await this.accountService.getAccountById(id);
    if (!account) return null;
    return this.accountService.getAccountDashboard(account, time);
  }

  // 删除
  @Icp('ICP_ACCOUNT_DELETE')
  async deleteAccount(
    event: Electron.IpcMainInvokeEvent,
    id: number,
  ): Promise<any> {
    const userInfo = getUserInfo();

    return this.accountService.deleteAccount(id, userInfo.id);
  }

  @Et('ET_UP_ALL_ACCOUNT_STATISTICS') // 更新所有的账户的统计信息
  async updateAllAccountStatistics(id: number, status: number) {
    const userInfo = getUserInfo();

    const allAccountList = await this.accountService.getAccounts(userInfo.id);
    for (const element of allAccountList) {
      this.accountService.updateAccountStatistics(
        element.id!,
        element.fansCount,
        element.readCount,
        element.likeCount,
        element.collectCount,
        element.commentCount,
        element.income!,
      );
    }
    await this.accountService.updateAccountStatus(id, status);
  }
}
