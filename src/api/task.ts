/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 22:21:01
 * @LastEditors: nevin
 * @Description: 任务
 */
import http from './request';
import { MineTaskListParams, TaskListParams, UserTask } from './types/task';
import { Task } from 'commont/types/task';
import { Pagination } from './types';
import { UserWalletRecord } from './types/finance';

export const taskApi = {
  /**
   * 获取任务列表
   */
  getTaskList(params: TaskListParams) {
    return http.get<Pagination<Task>>('/tasks/list', {
      isToken: false,
      params,
    });
  },

  /**
   * 获取我的任务列表
   */
  getMineTaskList(params: MineTaskListParams) {
    return http.get<Pagination<UserTask<Task>>>('/tasks/mine/list', {
      isToken: true,
      params,
    });
  },

  /**
   * 获取任务详情
   * @returns
   */
  getTaskInfo(id: string) {
    return http.get<Task>(`/tasks/info/${id}`);
  },

  /**
   * 申请任务
   */
  taskApply(id: string) {
    return http.post<Task>(
      `/tasks/apply/${id}`,
      {},
      {
        isToken: true,
      },
    );
  },

  /**
   * 完成任务
   */
  taskDone(
    id: string,
    data: {
      submissionUrl?: string; // 提交的结果，视频、文章或截图URL
      screenshotUrls?: string[]; // 任务截图
      qrCodeScanResult?: string; // 二维码扫描结果
    },
  ) {
    return http.post<UserTask<string>>(`/tasks/submit/${id}`, data, {
      isToken: true,
    });
  },

  // 提现
  withdraw(id: string, walletAccountId: string) {
    return http.post<UserWalletRecord>(
      `/tasks/withdraw/${id}`,
      {
        accountId: walletAccountId,
      },
      {
        isToken: true,
      },
    );
  },
};
