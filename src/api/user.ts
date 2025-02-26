/*
 * @Author: nevin
 * @Date: 2025-01-17 20:21:07
 * @LastEditTime: 2025-02-26 09:09:07
 * @LastEditors: nevin
 * @Description: 用户
 */
import http from './request';
import { IRefreshToken, IUserInfo, PhoneLoginParams } from '@/api/types/user-t';

export const userApi = {
  // 手机号验证码登录
  phoneLogin(data: PhoneLoginParams) {
    return http.post<IRefreshToken>('/user/login/code/phone', data, {
      isToken: false,
    });
  },

  // 获取用户信息
  getUserInfo() {
    return http.get<IUserInfo>('/user/mine');
  },

  // 更新用户信息
  updateUserInfo(data: Partial<IUserInfo>) {
    return http.put<IUserInfo>('/user/info/update', data);
  },

  // token刷新
  refreshToken() {
    return http.post<IRefreshToken>('/user/token/refresh');
  },

  // 发送手机号code
  getUserCode(data: { phone: string }) {
    return http.post<string>('/user/code', data, {
      isToken: false,
    });
  },

  // 获取登录的二维码
  getWxLoginQrcode(data: any) {
    return http.get<{ ticket: string; key: string }>('/user/gzh/qrcode/get', {
      isToken: false,
    });
  },

  // 轮询登录
  wxGzhQrcodelogin(data: { ticket: string; key: string }) {
    return http.post<{
      token: string;
      exp: number;
      userInfo: IUserInfo;
      status: -1 | 0 | 1; // 未存在 未登录 已登录
    }>('/user/gzh/qrcode/login', data, {
      isToken: false,
    });
  },
};
