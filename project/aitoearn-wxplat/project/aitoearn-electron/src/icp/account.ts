/*
 * @Author: nevin
 * @Date: 2025-01-23 15:48:14
 * @LastEditTime: 2025-02-21 11:47:00
 * @LastEditors: nevin
 * @Description:
 */

import { AccountInfo } from '@/views/account/comment';
import { AccountStatus, PlatType } from '@@/AccountEnum';
import { DashboardData } from '@/views/statistics/comment';
import { AccountGroupModel } from '../../electron/db/models/accountGroup';

export type AccountGroup = AccountGroupModel;

// 更新账户状态
export async function ipcUpdateAccountStatus(
  accountId: number,
  status: AccountStatus,
) {
  return await window.ipcRenderer.invoke(
    'ICP_ACCOUNT_UPDATE_STATUS',
    accountId,
    status,
  );
}

/**
 * 账户登录状态检测
 * @param pType
 * @param uid
 * @param isSendEvent 是否发送账户更新的事件
 */
export async function acpAccountLoginCheck(
  pType: PlatType,
  uid: string,
  isSendEvent: boolean = true,
) {
  const res: AccountInfo = await window.ipcRenderer.invoke(
    'ICP_ACCOUNT_LOGIN_CHECK',
    pType,
    uid,
    isSendEvent,
  );
  return res;
}
// 账户登录状态检测，多个账号
export async function acpAccountLoginCheckMulti(
  checkAccounts: {
    pType: PlatType;
    uid: string;
  }[],
) {
  const res: AccountInfo[] = await window.ipcRenderer.invoke(
    'ICP_ACCOUNT_LOGIN_CHECK_MULTI',
    checkAccounts,
  );
  return res;
}

/**
 * 登录账户
 * @param pType
 * @returns
 */
export async function accountLogin(pType: PlatType) {
  const res: AccountInfo = await window.ipcRenderer.invoke(
    'ICP_ACCOUNT_LOGIN',
    pType,
  );
  return res;
}

// 获取账户信息
export async function icpGetAccountInfo(type: PlatType, uid: string) {
  const res: AccountInfo = await window.ipcRenderer.invoke(
    'ICP_ACCOUNT_GET_INFO',
    type,
    uid,
  );
  return res;
}

// 获取我的账户列表
export async function icpGetAccountList() {
  try {
    const res: AccountInfo[] = await window.ipcRenderer.invoke(
      'ICP_ACCOUNT_GET_LIST',
    );
    return res;
  } catch (error) {
    console.error('获取账户列表失败', error);
  }
}

// 获取我的账户列表(ids)
export async function icpGetAccountListByIds(ids: number[]) {
  try {
    const res: AccountInfo[] = await window.ipcRenderer.invoke(
      'ICP_ACCOUNT_GET_LIST_BY_IDS',
      ids,
    );
    return res;
  } catch (error) {
    console.error('获取账户列表失败', error);
  }
}

// 获取账户数量
export async function icpGetAccountCount() {
  const res: number = await window.ipcRenderer.invoke('ICP_ACCOUNT_GET_COUNT');
  return res;
}

// 获取账户统计
export async function icpGetAccountStatistics() {
  const res = await window.ipcRenderer.invoke('ICP_ACCOUNT_STATISTICS');
  return res;
}

// 获取账户统计
export async function icpGetAccountDashboard(id: number, time?: any) {
  const res: DashboardData[] = await window.ipcRenderer.invoke(
    'ICP_ACCOUNT_DASHBOARD',
    id,
    time,
  );
  return res;
}

// 删除多个账户
export async function icpDeleteAccounts(ids: number[]) {
  return await window.ipcRenderer.invoke('ICP_ACCOUNTS_DELETE', ids);
}

// 添加用户组数据
export async function icpAddAccountGroup(data: Partial<AccountGroup>) {
  return await window.ipcRenderer.invoke('ICP_ACCOUNTS_GROUP_ADD', data);
}
// 获取用户组数据
export async function icpGetAccountGroup(): Promise<AccountGroup[]> {
  return await window.ipcRenderer.invoke('ICP_ACCOUNTS_GROUP_GET');
}
// 删除用户组数据
export async function icpDeleteAccountGroup(id: number) {
  return await window.ipcRenderer.invoke('ICP_ACCOUNTS_GROUP_DELETE', id);
}
// 编辑用户组数据
export async function icpEditDeleteAccountGroup(data: Partial<AccountGroup>) {
  return await window.ipcRenderer.invoke('ICP_ACCOUNTS_GROUP_EDIT', data);
}
// 修改账户的账户组
export async function icpAccountEditGroup(id: number, groupId: number) {
  return await window.ipcRenderer.invoke(
    'ICP_ACCOUNTS_EDIT_GROUP',
    id,
    groupId,
  );
}

// 代理地址有效性检测
export async function icpProxyCheck(proxy: string) {
  return await window.ipcRenderer.invoke('ICP_ACCOUNTS_PROXY_CHECK', proxy);
}
