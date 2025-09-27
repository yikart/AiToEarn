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

export interface PublishDayInfo {
  _id: string;
  userId: string;
  publishTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublishDayInfoResponse {
  total: number;
  list: PublishDayInfo[];
}

export interface PublishInfoData {
  _id: string;
  userId: string;
  days: number; // 连续签到天数
  createdAt: string;
  updatedAt: string;
  upInfoDate: string;
  id: string;
}

export interface PublishInfoResponse {
  code: number;
  data: PublishInfoData;
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
  async getSignInCalendar(year: number, month: number): Promise<PublishDayInfoResponse> {
    const res = await http.get<PublishDayInfoResponse>(`plat/publish/publishDayInfo/list/1/99`);
    return res!.data;
  },

  /**
   * 获取连续签到天数
   */
  async getConsecutiveDays(): Promise<PublishInfoResponse> {
    const res:any = await http.get<PublishInfoResponse>(`plat/publish/publishInfo/data`);
    return res;
  },


};

/**
 * 注销账户相关接口
 */
export const cancelAccountApi = {
  /**
   * 获取注销验证码
   */
  async getCancelCode(): Promise<{ success: boolean; message?: string; code?: string }> {
    const res = await http.get<{ success: boolean; message?: string; code?: string }>(`login/cancel/code`);
    return res!.data;
  },

  /**
   * 注销账户
   */
  async cancelAccount(data: { code: string; password: string }): Promise<{ success: boolean; message?: string }> {
    const res = await http.delete<{ success: boolean; message?: string }>(`login/cancel`, data);
    return res!.data;
  },
};