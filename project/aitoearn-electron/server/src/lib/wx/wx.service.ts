/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:56
 * @LastEditTime: 2025-02-24 22:20:10
 * @LastEditors: nevin
 * @Description: 微信服务
 */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { generateSignature } from './utils';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class WxService {
  appId = '';
  appSecret = '';
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.appId = this.configService.get('WX_CONFIG.APP_ID');
    this.appSecret = this.configService.get('WX_CONFIG.APP_SECRET');
  }

  /**
   *  获取access_token
   * @returns
   */
  private async getMiniAppAccessToken(): Promise<string> {
    const orgValue: string = await this.redisService.get(
      `${this.appId}:access_token`,
    );
    if (orgValue) return orgValue;

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
    const result: {
      data: {
        access_token: string;
        expires_in: number;
      };
    } = await axios.get(url);

    if (result.data.access_token) {
      await this.redisService.setKey(
        `${this.appId}:access_token`,
        result.data.access_token,
        result.data.expires_in,
      );
    }

    return result.data.access_token;
  }

  async code2Session(code: string): Promise<{
    session_key: string;
    unionid: string;
    errmsg: string;
    openid: string;
    errcode: number;
  }> {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${this.appId}&secret=${this.appSecret}&js_code=${code}&grant_type=authorization_code`;
    const result = await axios.get(url);
    return result.data;
  }

  /**
   * 校验登录状态
   * @param openid
   * @param session_key
   * @returns
   */
  async checkSessionKey(openid: string, session_key: string): Promise<boolean> {
    const access_token: string = await this.getMiniAppAccessToken();

    const url = `https://api.weixin.qq.com/wxa/checksession?access_token=${access_token}&signature=${generateSignature(session_key)}&openid=${openid}&sig_method=hmac_sha256`;
    const result = await axios.get(url);
    return result.data.errcode === 0;
  }

  /**
   * 获取手机号
   * @param code
   * @returns
   */
  async getPhoneNumber(code: string): Promise<string> {
    const access_token: string = await this.getMiniAppAccessToken();

    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${access_token}`;
    const result = await axios.post(url, {
      code: code,
    });

    return result.data.phone_info.phoneNumber;
  }

  /**
   * 获取app的认证信息
   * @param code
   * @returns
   */
  async getAppAuthInfo(code: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
    unionid: string;
  }> {
    const key: string = `wx_auth_info:${code}`;
    const orgValue = await this.redisService.get(key);
    if (orgValue) return orgValue;

    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.appId}&secret=${this.appSecret}&code=${code}&grant_type=authorization_code`;
    const result = await axios.get(url);

    if (result.data)
      this.redisService.setKey(key, result.data, result.data.expires_in);

    return result.data;
  }
}
