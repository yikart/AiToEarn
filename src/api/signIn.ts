/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-04-27 18:42:18
 * @LastEditors: nevin
 * @Description: feedback
 */
import http from './request';

export enum SignInType {
  PUL_VIDEO = 'pul_video',
}
export const signInApi = {
  /**
   * 创建签到
   */
  createSignInRecord(type: SignInType = SignInType.PUL_VIDEO) {
    return http.post<any>(`/reward/signIn`, {
      type,
    });
  },

  /**
   * 获取签到列表
   */
  getSignInList(params: { type: SignInType; time?: [Date, Date] }) {
    return http.get<any>(`/reward/signIn/list`, {
      isToken: true,
      params,
    });
  },
};
