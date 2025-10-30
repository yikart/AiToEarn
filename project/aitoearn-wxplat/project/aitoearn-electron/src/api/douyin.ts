/*
 * @Author: nevin
 * @Date: 2025-01-20 22:13:40
 * @LastEditTime: 2025-01-23 23:27:45
 * @LastEditors: nevin
 * @Description: 抖音平台
 */
import http from './request';

interface PublishParams {
  title: string;
  videoPath: string;
  coverPath?: string;
  tags?: string[];
}

export const douyinApi = {
  // 发布视频
  publish(params: PublishParams) {
    const formData = new FormData();
    formData.append('title', params.title);
    formData.append('video', params.videoPath);
    if (params.coverPath) {
      formData.append('cover', params.coverPath);
    }
    if (params.tags) {
      formData.append('tags', JSON.stringify(params.tags));
    }

    return http.post('/douyin/publish', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      isToken: false,
    });
  },
};
