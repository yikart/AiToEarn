/*
 * @Author: nevin
 * @Date: 2025-01-17 20:21:07
 * @LastEditTime: 2025-03-03 14:13:26
 * @LastEditors: nevin
 * @Description: 用户
 */
import http from './request';
import { IRefreshToken, IUserInfo, PhoneLoginParams } from '@/api/types/user-t';

export interface GzhLoginTyp {
  phone: string;
  token: string;
  openId: string;
  exp: number;
  userInfo: IUserInfo;
  status: -1 | 0 | 1; // 失败 登录中 登录成功
}

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
    return http.post<GzhLoginTyp>('/user/gzh/qrcode/login', data, {
      isToken: false,
    });
  },

  // 公众号手机号登录
  phoneGzhLogin(data: PhoneLoginParams) {
    return http.post<IRefreshToken>('/user/login/gzh/code/phone', data, {
      isToken: false,
    });
  },

  // 用户设置或绑定手机号
  upUserPhone(data: { phone: string; code: string }) {
    return http.put<string>('/user/updatePhone', data, {
      isToken: true,
    });
  },

  // 绑定手机号
  bindPhone(data: { phone: string; code: string; userId: string }) {
    return http.post('/api/user/bind-phone', data);
  },
};
