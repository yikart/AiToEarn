/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: WxPlat
 */
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AppException } from '@/common';
import { ExceptionCode } from '@/common/enums/exception-code.enum';
import { config } from '@/config';
import { AccountService } from '@/core/account/account.service';
import { RedisService } from '@/libs';
import { WxPlatAuthorizerInfo } from '@/libs/wxPlat/comment';
import { WxPlatApiService } from '@/libs/wxPlat/wxPlatApi.service';
import { AccountType, NewAccount } from '@/transports/account/common';
import { AuthTaskInfo } from '../common';
import { WxPlatAuthInfo } from './common';
import { decode } from './WXMsgCrypto';

@Injectable()
export class WxPlatService {
  private authBackHost = '';
  private prefix = '';
  private encodingAESKey = '';
  private componentAccessTokenCacheKey = 'wxPlat:component_access_token';

  constructor(
    private readonly redisService: RedisService,
    private readonly wxPlatApiService: WxPlatApiService,
    private readonly accountService: AccountService,
  ) {
    this.prefix = config.nats.prefix;
    this.encodingAESKey = config.wxPlat.encodingAESKey;
    this.authBackHost = config.wxPlat.authBackHost;
  }

  private getAuthDataCacheKey(taskId: string) {
    return `channel:wxPlat:authTask:${taskId}`;
  }

  // 公众号token缓存key
  private getAuthAccessTokenCacheKey(accountId: string) {
    return `channel:wxPlat:authorizerAccessToken:${accountId}`;
  }

  // 公众号token缓存key
  private getAuthRefreshTokenCacheKey(accountId: string) {
    return `channel:wxPlat:authorizerRefreshToken:${accountId}`;
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
   * 创建用户授权任务
   */
  async createAuthTask(
    data: {
      userId: string;
      type: 'h5' | 'pc';
    },
    options?: {
      transpond?: string;
      accountAddPath?: string;
    },
  ) {
    const taskId = uuidv4();

    const authUrl = await this.getAuthPageUrl(taskId, data.type);
    if (!authUrl)
      throw new AppException(ExceptionCode.File, '不存在平台授权令牌');

    const rRes = await this.redisService.setKey<AuthTaskInfo<WxPlatAuthInfo>>(
      this.getAuthDataCacheKey(taskId),
      {
        taskId,
        transpond: options?.transpond,
        accountAddPath: options?.accountAddPath,
        data: {
          createTime: Date.now(),
          userId: data.userId,
        },
        status: 0,
      },
      60 * 5,
    );

    if (!rRes)
      throw new AppException(ExceptionCode.File, '创建授权任务失败');

    return {
      url: authUrl,
      taskId,
    };
  }

  // 获取授权任务信息
  async getAuthTaskInfo(taskId: string) {
    const taskInfo = await this.redisService.get<AuthTaskInfo<WxPlatAuthInfo>>(
      this.getAuthDataCacheKey(taskId),
    );

    return taskInfo;
  }

  /**
   * 获取授权页面链接
   * @param userId
   * @param type
   * @returns
   */
  async getAuthPageUrl(taskId: string, type: 'h5' | 'pc'): Promise<string> {
    const componentAccessToken = await this.getComponentAccessToken();
    if (!componentAccessToken)
      throw new AppException(ExceptionCode.File, '不存在平台授权令牌');

    const redirectUri = `${this.authBackHost}/wxPlat/auth/back/${taskId}`;

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

  async checkAuth(accountId: string): Promise<{
    status: 0 | 1;
    timeout?: number; // 秒
  }> {
    const refreshToken = await this.redisService.get(this.getAuthRefreshTokenCacheKey(accountId));
    if (!refreshToken) {
      return {
        status: 0,
      };
    }

    const timeout = await this.redisService.getPttl(this.getAuthRefreshTokenCacheKey(accountId));
    return {
      status: 1,
      timeout: timeout / 1000,
    };
  }

  /**
   * (通过授权页面)设置用户的授权配置并创建账号
   * @param taskId
   * @param authData
   */
  async createAccountAndSetAccessToken(
    taskId: string,
    authData: { authCode: string; expiresIn: number },
  ) {
    const taskInfo = await this.redisService.get<AuthTaskInfo<WxPlatAuthInfo>>(
      this.getAuthDataCacheKey(taskId),
    );
    if (!taskInfo || !taskInfo.data)
      return null;
    if (taskInfo.status === 1)
      return null;

    // 计算是否超时
    if (Date.now() - taskInfo.data.createTime > authData.expiresIn * 1000) {
      void this.redisService.del(this.getAuthDataCacheKey(taskId));
      return null;
    }

    // 延长授权时间
    void this.redisService.setPexire(this.getAuthDataCacheKey(taskId), 60 * 3);

    // 根据授权码获取授权信息
    const componentAccessToken = await this.getComponentAccessToken();
    if (!componentAccessToken)
      return null;

    const auth = await this.wxPlatApiService.getQueryAuth(
      componentAccessToken,
      authData.authCode,
    );
    if (!auth)
      return null;

    const { authorizer_appid, expires_in } = auth;

    // 获取授权方的账号信息
    const authInfo = await this.wxPlatApiService.getAuthorizerInfo(
      componentAccessToken,
      authorizer_appid,
    );
    if (!authInfo)
      return null;

    // 创建本平台的平台账号
    const newData = new NewAccount({
      userId: taskInfo.data.userId,
      type: AccountType.WxGzh,
      uid: authorizer_appid,
      account: authInfo.user_name,
      avatar: authInfo.head_img,
      nickname: authInfo.nick_name,
    });

    const accountInfo = await this.accountService.createAccount(
      {
        userId: taskInfo.data.userId,
        type: AccountType.WxGzh,
        uid: authorizer_appid,
      },
      newData,
    );
    if (!accountInfo)
      return null;

    // 设置授权信息
    const setRes = await this.redisService.setKey<WxPlatAuthorizerInfo>(
      this.getAuthAccessTokenCacheKey(accountInfo.id),
      auth,
      expires_in,
    );

    // 设置29天的刷新令牌
    await this.redisService.setKey<string>(
      this.getAuthRefreshTokenCacheKey(accountInfo.id),
      auth.authorizer_refresh_token,
      2592000,
    );

    if (!setRes)
      return null;

    // 更新任务信息
    taskInfo.status = 1;
    taskInfo.data.accountId = accountInfo.id;

    const res = await this.redisService.setKey<AuthTaskInfo<WxPlatAuthInfo>>(
      this.getAuthDataCacheKey(taskId),
      taskInfo,
      60 * 5,
    );

    return res ? accountInfo : null;
  }

  /**
   * 获取授权方接口调用凭据
   * @param accountId
   */
  async getAuthorizerAccessToken(accountId: string) {
    const accountInfo = await this.accountService.getAccountInfo(accountId);
    if (!accountInfo)
      throw new Error('账号不存在');

    try {
      const info = await this.redisService.get<WxPlatAuthorizerInfo>(
        this.getAuthAccessTokenCacheKey(accountId),
      );
      if (info) {
        // 快超时就重新获取
        const overTime = await this.redisService.getPttl(
          this.getAuthAccessTokenCacheKey(accountId),
        );
        if (overTime < 60 * 10)
          return info;

        // 快超时就重新获取
        const componentAccessToken = await this.getComponentAccessToken();
        if (!componentAccessToken)
          throw new Error('获取授权方令牌失败');

        const newInfo = await this.wxPlatApiService.getAuthorizerAccessToken(
          componentAccessToken,
          info.authorizer_appid,
          info.authorizer_refresh_token,
        );
        if (!newInfo)
          throw new Error('获取授权方令牌失败');

        const res = await this.redisService.setKey(
          this.getAuthAccessTokenCacheKey(accountId),
          newInfo,
          newInfo.expires_in,
        );
        if (!res)
          throw new Error('设置授权方令牌缓存失败');

        return newInfo;
      }

      // 没有值重新获取
      // 查看长期的刷新令牌
      const refreshToken = await this.redisService.get<string>(
        this.getAuthRefreshTokenCacheKey(accountId),
      );
      if (!refreshToken)
        throw new Error('获取授权方刷新令牌失败');

      // 快超时就重新获取
      const componentAccessToken = await this.getComponentAccessToken();
      if (!componentAccessToken)
        throw new Error('获取授权方令牌失败');

      const newInfo = await this.wxPlatApiService.getAuthorizerAccessToken(
        componentAccessToken,
        accountInfo.uid,
        refreshToken,
      );
      if (!newInfo)
        throw new Error('获取授权方令牌失败');
      return newInfo;
    }
    catch (error) {
      Logger.error(error);
      throw new AppException(ExceptionCode.File, error);
    }
  }
}
