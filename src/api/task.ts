/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 00:12:15
 * @LastEditors: nevin
 * @Description: 任务
 */
import http from './request';
import { MineTaskListParams, TaskListParams, UserTask } from './types/task';
import { Task } from 'commont/types/task';
import { Pagination } from './types';

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
    return http.post<Task>(`/tasks/apply/${id}`);
  },

  /**
   * 完成任务
   */
  taskDone(id: string) {
    return http.post<Task>(`/tasks/done/${id}`);
  },
};
