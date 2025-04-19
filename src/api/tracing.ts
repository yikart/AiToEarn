/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 22:21:01
 * @LastEditors: nevin
 * @Description: 跟踪
 */
import http from './request';

export enum TracingType {
  EVENT = 'event', // 事件
}

export enum TracingTag {
  AccountAdd = 'AccountAdd', // 账号添加
  VideoPul = 'VideoPul', // 视频发布
  OpenProjectUse = 'OpenProjectUse', // 开源项目调用
}

export interface Tracing {
  id: string;
  userId: string;
  type: TracingType;
  tag: TracingTag;
  accountId?: number; // 平台账号ID
  desc?: string;
  dataId?: string; // 关联数据id
  createTime: string;
  updateTime: string;
}

export const TracingApi = {
  /**
   * 创建跟踪
   * @param data
   */
  apiCreateTracing(data: {
    id: string;
    type: TracingType;
    tag: string;
    accountId?: number; // 平台账号ID
    desc?: string;
    dataId?: string; // 关联数据id
  }) {
    return http.post<string>(`/tracing`, data);
  },
};
