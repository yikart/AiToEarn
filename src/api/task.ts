import http from "@/utils/request";
import { AccountType } from "./types/account.type";

export enum TaskOpportunityStatus {
  PENDING = 'pending', // 待接取
  ACCEPTED = 'accepted', // 已接取
  EXPIRED = 'expired', // 已过期
}

export interface TaskOpportunity {
  _id: string;
  id: string;
  taskId: string
  accountId: string
  userId: string
  accountType: AccountType
  uid: string
  status: TaskOpportunityStatus
  expiredAt: Date
  metadata?: Record<string, any> // 额外信息，如匹配得分等
}

// 获取待接受的任务列表
export const apiGetTaskOpportunityList = (params: {
  page?: number;
  pageSize?: number;
}) => {
  return http.get<{list: TaskOpportunity[]}>(`task/opportunity/list/${params.page}/${params.pageSize}` );
};

/**
 * 接取任务
 * @param opportunityId 
 * @returns 
 */
export const apiAcceptTask = (opportunityId: string) => {
  return http.post<any>(`task/accept`, { opportunityId });
};


// 获取待接受的任务列表
export const apiGetUserTaskList = (params: {
  page?: number;
  pageSize?: number;
}) => {
  return http.get<{list: TaskOpportunity[]}>(`task/opportunity/list/${params.page}/${params.pageSize}` );
};

/**
 * 接取任务
 * @param userTaskId 
 * @returns 
 */
export const apiSubmitTask = (userTaskId: string) => {
  return http.post<any>(`task/submit`, { userTaskId });
};