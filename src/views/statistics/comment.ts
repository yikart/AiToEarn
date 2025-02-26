/*
 * @Author: nevin
 * @Date: 2025-02-05 17:43:14
 * @LastEditTime: 2025-02-19 22:18:16
 * @LastEditors: nevin
 * @Description:
 */

import { AccountInfo } from '../account/comment';

export interface StatisticsInfo {
  accountTotal: number;
  list: AccountInfo[];
  fansCount: number;
  readCount: number;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  income: number;
}

// 获取平台账户统计信息返回值
export type DashboardData = {
  fans: number;
  read: number;
  comment: number;
  like: number;
  collect: number;
  forward: number;
};
