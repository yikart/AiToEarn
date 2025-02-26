/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-02-22 19:14:28
 * @LastEditors: nevin
 * @Description: 任务
 */
import http from './request';
import { TaskListParams } from './types/task';
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
};
