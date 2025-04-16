/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 22:21:01
 * @LastEditors: nevin
 * @Description: 项目配置
 */
import http from './request';

export const CfgApi = {
  /**
   * 获取配置
   * @param key
   */
  apiGetCfgInfo(key: string) {
    return http.get<string>(`/cfg/info/${key}`);
  },
};
