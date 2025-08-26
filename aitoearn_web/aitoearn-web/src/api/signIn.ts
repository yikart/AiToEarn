/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-04-27 18:42:18
 * @LastEditors: nevin
 * @Description: feedback
 */
import http from "@/utils/request";

export enum SignInType {
  PUL_VIDEO = "pul_video",
}

export const signInApi = {
  /**
   * 创建签到
   */
  async createSignInRecord(type: SignInType = SignInType.PUL_VIDEO) {
    const res = await http.post<any>(`reward/signIn`, {
      type,
    });
    return res!.data;
  },

  /**
   * 获取签到列表
   */
  async getSignInList(params: { type: SignInType; time?: [Date, Date] }) {
    const res = await http.get<any>(`reward/signIn/list`, {
      isToken: true,
      params,
    });
    return res!.data;
  },
};
