/*
 * @Author: nevin
 * @Date: 2025-01-23 15:48:14
 * @LastEditTime: 2025-02-21 11:47:00
 * @LastEditors: nevin
 * @Description:
 */

import { AccountInfo } from '@/views/account/comment';
import { AccountStatus, AccountType } from '../../commont/AccountEnum';
import { DashboardData } from '../views/statistics/comment';

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
 */
export async function acpAccountLoginCheck(pType: AccountType, uid: string) {
  const res: AccountInfo = await window.ipcRenderer.invoke(
    'ICP_ACCOUNT_LOGIN_CHECK',
    pType,
    uid,
  );
  return res;
}

/**
 * 登录账户
 * @param pType
 * @returns
 */
export async function accountLogin(pType: AccountType) {
  const res: AccountInfo = await window.ipcRenderer.invoke(
    'ICP_ACCOUNT_LOGIN',
    pType,
  );
  return res;
}

// 获取账户信息
export async function icpGetAccountInfo(type: AccountType, uid: string) {
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
