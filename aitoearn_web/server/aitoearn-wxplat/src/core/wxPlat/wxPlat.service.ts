/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: WxPlat
 */
import { Injectable, Logger } from '@nestjs/common';
import { AppException } from '@/common';
import { ExceptionCode } from '@/common/enums/exception-code.enum';
import { config } from '@/config';
import { RedisService } from '@/libs';
import { WxPlatApiService } from '@/libs/wxPlat/wxPlatApi.service';
import { decode } from './WXMsgCrypto';

@Injectable()
export class WxPlatService {
  private encodingAESKey = '';
  private componentAccessTokenCacheKey = 'wxPlat:component_access_token';

  constructor(
    private readonly redisService: RedisService,
    private readonly wxPlatApiService: WxPlatApiService,
  ) {
    this.encodingAESKey = config.wxPlat.encodingAESKey;
  }

  decryptWXData(data: string) {
    return decode(data, this.encodingAESKey);
  }

  /**
   * 设置三方平台票据
   * @param componentVerifyTicket
   */
  async setComponentVerifyTicket(componentVerifyTicket: string) {
    const value = await this.getComponentVerifyTicket();
    if (value)
      return true;

    const res = await this.redisService.setKey<string>(
      `wxPlat:component_verify_ticket`,
      componentVerifyTicket,
      11 * 60 * 60,
    );
    return res;
  }

  /**
   * 获取三方平台票据
   */
  getComponentVerifyTicket() {
    return this.redisService.get<string>(
      `wxPlat:component_verify_ticket`,
      false,
    );
  }

  /**
   * 获取component_access_token企业授权token
   * @returns
   */
  private async getComponentAccessToken(): Promise<string | null> {
    const token = await this.redisService.get<string>(
      this.componentAccessTokenCacheKey,
      false,
    );
    if (token)
      return token;

    const componentVerifyTicket = await this.getComponentVerifyTicket();
    if (!componentVerifyTicket)
      return null;

    const res = await this.wxPlatApiService.getComponentAccessToken(
      componentVerifyTicket,
    );

    Logger.debug('----- setComponentAccessToken -----', res);
    if (!res)
      return null;

    // 缓存
    const setValue = await this.redisService.setKey(
      this.componentAccessTokenCacheKey,
      res.component_access_token,
      res.expires_in - 1200,
    );

    return setValue ? res.component_access_token : null;
  }

  /**
   * 获取授权页面链接
   * @param redirectUri
   * @param type
   * @returns
   */
  async getAuthPageUrl(redirectUri: string, type: 'h5' | 'pc'): Promise<string> {
    const componentAccessToken = await this.getComponentAccessToken();
    if (!componentAccessToken)
      throw new AppException(ExceptionCode.File, '不存在平台授权令牌');

    const res
      = await this.wxPlatApiService.getPreAuthCode(componentAccessToken);
    if (!res)
      throw new AppException(ExceptionCode.File, '获取预授权码失败');

    const outUrl = this.wxPlatApiService.getAuthPageUrl(
      res.pre_auth_code,
      redirectUri,
      type,
    );
    return outUrl;
  }

  /**
   * 获取应用授权信息
   * @param authCode
   * @returns
   */
  async getQueryAuth(authCode: string) {
    // 根据授权码获取授权信息
    const componentAccessToken = await this.getComponentAccessToken();
    if (!componentAccessToken)
      return null;

    const auth = await this.wxPlatApiService.getQueryAuth(
      componentAccessToken,
      authCode,
    );
    if (!auth)
      return null;
    return auth;
  }

  /**
   * 获取应用授权信息
   * @param authCode
   * @returns
   */
  async getAuthorizerInfo(authorizerAppid: string) {
    // 根据授权码获取授权信息
    const componentAccessToken = await this.getComponentAccessToken();
    if (!componentAccessToken)
      return null;

    // 获取授权方的账号信息
    const authInfo = await this.wxPlatApiService.getAuthorizerInfo(
      componentAccessToken,
      authorizerAppid,
    );
    if (!authInfo)
      return null;

    return authInfo;
  }

  /**
   * 获取应用授权信息
   * @param authorizerAppId
   * @param authorizerRefreshToken
   * @returns
   */
  async getAuthorizerAccessToken(authorizerAppId: string, authorizerRefreshToken: string) {
    const componentAccessToken = await this.getComponentAccessToken();
    if (!componentAccessToken)
      return null;

    const res = await this.wxPlatApiService.getAuthorizerAccessToken(
      componentAccessToken,
      authorizerAppId,
      authorizerRefreshToken,
    );
    return res;
  }
}
