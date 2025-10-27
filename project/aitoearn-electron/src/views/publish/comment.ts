/*
 * @Author: nevin
 * @Date: 2025-02-05 17:43:14
 * @LastEditTime: 2025-02-17 17:50:44
 * @LastEditors: nevin
 * @Description:
 */

import { PubRecordModel as PubRecordModelLast } from '../../../electron/db/models/pubRecord';
import { AccountStatus } from '../../../commont/AccountEnum';
import { ipcUpdateAccountStatus } from '../../icp/account';
import { AccountInfo } from '../account/comment';

export type PubRecordModel = PubRecordModelLast;

// 接口失效处理
export async function accountFailureDispose<T>(
  {
    status,
    data,
  }: {
    status: number;
    data?: T;
  },
  account: AccountInfo,
  callback: (account: AccountInfo) => void,
) {
  if (status !== 200 && status !== 201) {
    if (status === 401) {
      account.status = AccountStatus.DISABLE;
      callback(account);
      await ipcUpdateAccountStatus(account.id, AccountStatus.DISABLE);
    }
    return [];
  }
  return data || [];
}
