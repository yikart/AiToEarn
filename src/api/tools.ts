/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 22:21:01
 * @LastEditors: nevin
 * @Description: 工具
 */
import http from './request';

export const toolsApi = {
  /**
   * 获取智能标题
   */
  apiVideoAiTitle(url: string) {
    return http.post<string>(
      '/tools/ai/video/title',
      {
        url,
      },
      {
        isToken: true,
      },
    );
  },

  /**
   * 智能评论
   */
  apiReviewAi(data: { title: string; desc?: string; max?: number }) {
    return http.post<string>('/tools/ai/review', data, {
      isToken: true,
    });
  },

  /**
   * 智能评论回复
   */
  apiReviewAiRecover(data: {
    content: string;
    title?: string;
    desc?: string;
    max?: number;
  }) {
    return http.post<string>('/tools/ai/recover/review', data, {
      isToken: true,
    });
  },

  /**
   * 上传文件
   */
  uploadFile() {
    return http.post<{
      name: string;
    }>('/oss/upload/permanent');
  },
};
