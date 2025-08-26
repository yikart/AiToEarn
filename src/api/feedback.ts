/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 23:00:49
 * @LastEditors: nevin
 * @Description: feedback
 */
import http from './request';

export enum FeedbackType {
  errReport = 'errReport', // 错误反馈
  feedback = 'feedback', // 反馈
  msgReport = 'msgReport', // 消息举报
  msgFeedback = 'msgFeedback', // 消息反馈
}

export interface CreatefeedbackParmas {
  content: string;
  imgUrlList: string[];
  // fileList: string[];
  fileUrlList: string[];
}

export const operateApi = {
  /**
   * 创建反馈
   */
  createfeedback(data: CreatefeedbackParmas) {
    return http.post<any>(`/feedback`, {
      type: FeedbackType.feedback,
      ...data,
    });
  },
};
