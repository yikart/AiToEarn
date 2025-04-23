/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-24 14:08:12
 * @LastEditors: nevin
 * @Description: 任务
 */
import http, { hotHttp } from './request';
import { MineTaskListParams, TaskListParams, UserTask } from './types/task';
import { Task, TaskDataInfo } from 'commont/types/task';
import { Pagination } from './types';
import { UserWalletRecord } from './types/finance';

export const taskApi = {
  /**
   * 获取评论搜索
   */
  searchNotesTask(params: any) {
    return hotHttp.get('/comment/search/notes/task', {
      isToken: false,
      params,
    });
  },

  searchNotesResult(params: any) {
    return hotHttp.get<any>('/comment/search/notes', {
      isToken: false,
      params,
    });
  },
  searchNotesList(params: any) {
    return hotHttp.get<any>('/comment/search/notes/list', {
      isToken: false,
      params,
    });
  },

  /**
   * 获取任务列表
   */
  getTaskList<T extends TaskDataInfo>(params: TaskListParams) {
    return http.get<Pagination<Task<T>>>('/tasks/list', {
      isToken: false,
      params,
    });
  },

  /**
   * 获取我的任务列表
   */
  getMineTaskList(params: MineTaskListParams) {
    return http.get<Pagination<UserTask<Task<TaskDataInfo>>>>(
      '/tasks/mine/list',
      {
        isToken: true,
        params,
      },
    );
  },

  /**
   * 获取任务详情
   * @returns
   */
  getTaskInfo(id: string) {
    return http.get<Task<TaskDataInfo>>(`/tasks/info/${id}`);
  },

  /**
   * 申请任务
   */
  taskApply<T extends TaskDataInfo>(id: string) {
    return http.post<Task<T>>(
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
  withdraw(id: string, walletAccountId?: string) {
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
  // 删除搜索笔记任务
  deleteSearchNotesTask: (data: {
    userId: string;
    taskType: string;
    taskId: string;
  }) => hotHttp.post('/comment/search/notes/delete', data),
};
