/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-02-28 21:47:31
 * @LastEditors: nevin
 * @Description: 财务
 */
import http from './request';
import {
  CreateUserWalletAccountParams,
  UserWalletAccount,
} from './types/userWalletAccount';

export const financeApi = {
  // --------- userWalletAccount STR ---------

  /**
   * 获取验证码
   */
  getWalletAccountCode(phone: string) {
    return http.post<string>(
      `userWalletAccount/phoneCode/${phone}`,
      {},
      {
        isToken: true,
      },
    );
  },

  /**
   * 创建用户钱包账户
   */
  createUserWalletAccount(data: CreateUserWalletAccountParams) {
    return http.post<UserWalletAccount>('/userWalletAccount', data, {
      isToken: true,
    });
  },

  /**
   * 获取用户钱包账户列表
   * @returns
   */
  getUserWalletAccountList() {
    return http.get<UserWalletAccount[]>(`/userWalletAccount/list`, {
      isToken: true,
    });
  },

  /**
   * 删除用户钱包账户
   */
  deleteUserWalletAccount(id: string) {
    return http.delete<boolean>(`/userWalletAccount/delete/${id}`);
  },
  // --------- userWalletAccount END ---------
};
