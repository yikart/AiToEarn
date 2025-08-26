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

export interface SignInResponse {
  success: boolean;
  message?: string;
  score?: number; // 签到后更新的积分
  data?: any;
}

export const signInApi = {
  /**
   * 创建签到
   */
  async createSignInRecord(type: SignInType = SignInType.PUL_VIDEO): Promise<SignInResponse> {
    const res = await http.post<SignInResponse>(`reward/signIn`, {
      type,
    });
    return res!.data;
  },

  /**
   * 获取签到日历数据
   */
  async getSignInCalendar(year: number, month: number) {
    const res = await http.get<any>(`reward/signIn/calendar`, {
      isToken: true,
      params: { year, month },
    });
    return res!.data;
  },


};
