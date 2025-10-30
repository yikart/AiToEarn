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
import { AccountStatus, PlatType } from '../../../commont/AccountEnum';
import { AccountModel } from '../../db/models/account';
import windowOperate from '../../util/windowOperate';
import { SendChannelEnum } from '../../../commont/UtilsEnum';
import { AccountGroupModel } from '../../db/models/accountGroup';
import { proxyCheck } from '../../plat/coomont';

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
    pType: PlatType,
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
    windowOperate.sendRenderMsg(SendChannelEnum.AccountLoginFinish, account);
    // 保存账户信息
    return account;
  }

  /**
   * 账户登录检测-单个
   */
  @Icp('ICP_ACCOUNT_LOGIN_CHECK')
  async checkAccountLogin(
    event: Electron.IpcMainInvokeEvent,
    pType: PlatType,
    uid: string,
    isSendEvent: boolean = true,
  ): Promise<AccountModel | null> {
    const account = await this.accountService.checkAccountLoginCore(pType, uid);
    if (isSendEvent) {
      windowOperate.sendRenderMsg(SendChannelEnum.AccountLoginFinish, account);
    }
    return account;
  }

  /**
   * 账户登录检测-多个
   */
  @Icp('ICP_ACCOUNT_LOGIN_CHECK_MULTI')
  async checkAccountLoginMulti(
    event: Electron.IpcMainInvokeEvent,
    checkAccounts: {
      pType: PlatType;
      uid: string;
    }[],
  ): Promise<(AccountModel | null)[]> {
    const tasks: Promise<AccountModel | null>[] = [];

    for (const { pType, uid } of checkAccounts) {
      tasks.push(this.accountService.checkAccountLoginCore(pType, uid));
    }
    const accounts = await Promise.all(tasks);
    windowOperate.sendRenderMsg(
      SendChannelEnum.AccountLoginFinish,
      accounts[0],
      accounts,
    );
    return accounts;
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
    data: { type: PlatType; uid: string },
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
  async getAccountListByIdsTcp(
    event: Electron.IpcMainInvokeEvent,
    ids: number[],
  ): Promise<any> {
    return this.getAccountListByIds(ids);
  }
  // 获取账户列表(ids)
  @Et('ET_ACCOUNT_GET_LIST_BY_IDS')
  async getAccountListByIdsEt(
    ids: number[],
    callback: (p: AccountModel[]) => void,
  ): Promise<any> {
    const accounts = await this.getAccountListByIds(ids);
    callback(accounts);
  }
  async getAccountListByIds(ids: number[]) {
    const userInfo = getUserInfo();
    if (!userInfo?.id) return [];
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
    type?: PlatType,
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

  // 删除账户
  @Icp('ICP_ACCOUNTS_DELETE')
  async deleteAccount(
    event: Electron.IpcMainInvokeEvent,
    ids: number[],
  ): Promise<any> {
    const userInfo = getUserInfo();
    return this.accountService.deleteAccounts(ids, userInfo.id);
  }

  // 修改账户的账户组
  @Icp('ICP_ACCOUNTS_EDIT_GROUP')
  async accountEditGroup(
    event: Electron.IpcMainInvokeEvent,
    id: number,
    groupId: number,
  ): Promise<any> {
    return this.accountService.updateAccountInfo(id, {
      groupId,
    });
  }

  // 添加用户组数据
  @Icp('ICP_ACCOUNTS_GROUP_ADD')
  async addAccountGroup(
    event: Electron.IpcMainInvokeEvent,
    data: Partial<AccountGroupModel>,
  ): Promise<any> {
    return this.accountService.addAccountGroup(data);
  }
  // 获取用户组数据
  @Icp('ICP_ACCOUNTS_GROUP_GET')
  async getAccountGroup(event: Electron.IpcMainInvokeEvent): Promise<any> {
    return this.accountService.getAccountGroup();
  }
  // 删除用户组数据
  @Icp('ICP_ACCOUNTS_GROUP_DELETE')
  async deleteAccountGroup(
    event: Electron.IpcMainInvokeEvent,
    id: number,
  ): Promise<any> {
    return this.accountService.deleteAccountGroup(id);
  }
  // 编辑用户组数据
  @Icp('ICP_ACCOUNTS_GROUP_EDIT')
  async editAccountGroup(
    event: Electron.IpcMainInvokeEvent,
    data: Partial<AccountGroupModel>,
  ): Promise<any> {
    return this.accountService.editAccountGroup(data);
  }

  // 代理地址有效性检测
  @Icp('ICP_ACCOUNTS_PROXY_CHECK')
  async proxyCheck(
    event: Electron.IpcMainInvokeEvent,
    proxy: string,
  ): Promise<any> {
    return await proxyCheck(proxy);
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
