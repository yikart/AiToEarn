/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 22:21:01
 * @LastEditors: nevin
 * @Description: 工具
 */
import http from './request';
import { AiCreateType } from './types/tools';

export const toolsApi = {
  /**
   * 获取智能标题
   * @param url
   * @param type 1=标题 2=描述
   * @param max
   */
  apiVideoAiTitle(url: string, type: AiCreateType, max: number) {
    return http.post<string>(
      '/tools/ai/video/title',
      {
        url,
        type,
        max: max - 10,
      },
      {
        isToken: true,
      },
    );
  },

  /**
   * 智能图文
   */
  apiReviewImgAi(data: {
    imgUrl: string;
    title?: string;
    desc?: string;
    max?: number;
  }) {
    return http.post<string>('/tools/ai/reviewImg', data, {
      isToken: true,
    });
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
  uploadFile(file: Blob) {
    const formData = new FormData();
    formData.append('file', file);
    return http.post<{
      name: string;
    }>('/oss/upload/permanent', formData);
  },

  /**
   * 上传文件临时
   */
  uploadFileTemp(file: Blob) {
    const formData = new FormData();
    formData.append('file', file);
    return http.post<{
      name: string;
    }>('/oss/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
