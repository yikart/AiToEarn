/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 23:00:49
 * @LastEditors: nevin
 * @Description: operate
 */
import http from './request';

export const operateApi = {
  /**
   * 获取banner
   */
  getBannerList(tag?: string) {
    return http.get<string>(`/banner/list`, {
      isToken: true,
      params: {
        tag,
      },
    });
  },
};
