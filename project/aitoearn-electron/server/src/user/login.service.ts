/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2025-02-06 13:44:23
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable } from '@nestjs/common';
import { AppHttpException } from '../filters/http-exception.filter';
import { ErrHttpBack } from '../filters/http-exception.back-code';
import { RedisService } from '../lib/redis/redis.service';
import { AlicloudSmsService } from '../lib/sms/alicloud-sms.service';
import { getRandomString } from '../util';

export enum LoginTypeCacheKey {
  Password = 'phone_register_code',
  Code = 'phone_login_code',
  PhoneAuth = 'phone_login_auth_token', // 手机号一键登录
}
@Injectable()
export class LoginService {
  constructor(
    private readonly redisService: RedisService,
    private readonly alicloudSmsService: AlicloudSmsService,
  ) {}

  /**
   * 发送手机号注册的验证码
   * @param phone
   */
  async postPhoneRegisterCode(phone: string) {
    const cacheKey = `${LoginTypeCacheKey.Password}:${phone}`;
    let code = await this.redisService.get(cacheKey);
    if (code) throw new AppHttpException(ErrHttpBack.err_user_code_had);

    code = getRandomString(6, true);
    const res = await this.alicloudSmsService.sendLoginSms(phone, code);

    if (process.env.NODE_ENV === 'production') {
      if (!res) throw new AppHttpException(ErrHttpBack.err_user_code_send_fail);
    }

    this.redisService.setKey(cacheKey, code, 60 * 5);
    console.log('发送短信成功', code);

    return process.env.NODE_ENV === 'production' ? res : code;
  }

  /**
   * 发送手机号登录的验证码
   * @param phone
   */
  async postPhoneLoginCode(phone: string) {
    const cacheKey = `${LoginTypeCacheKey.Code}:${phone}`;
    let code = await this.redisService.get(cacheKey);
    if (code) throw new AppHttpException(ErrHttpBack.err_user_code_had);

    code = getRandomString(6, true);

    let res = false;
    if (process.env.NODE_ENV === 'production') {
      res = await this.alicloudSmsService.sendLoginSms(phone, code);

      if (!res) throw new AppHttpException(ErrHttpBack.err_user_code_send_fail);
    }

    this.redisService.setKey(cacheKey, code, 60 * 5);
    console.log('发送短信成功', code);

    return process.env.NODE_ENV === 'production' ? res : code;
  }

  /**
   * 发送手机号注册的验证码
   * @param phone
   * @param code
   */
  async verifyPhoneCode(
    phone: string,
    code: string,
    key: LoginTypeCacheKey = LoginTypeCacheKey.Password,
  ): Promise<boolean> {
    const cacheKey = `${key}:${phone}`;
    const oldCode = await this.redisService.get(cacheKey);
    if (!oldCode) return false;

    if (code === oldCode) {
      this.redisService.del(cacheKey);
      return true;
    }

    return false;
  }

  // 微信用户信息
  async setWxUserInfo(userInfo: any) {
    console.log('userInfo', userInfo);
  }
  // 支付宝用户信息
  async setZfbUserInfo(userInfo: any) {
    console.log('userInfo', userInfo);
  }
}
