/*
 * @Author: zhangwei
 * @Date: 2025-05-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: zhangwei
 * @Description: youtube
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { createHash, createHmac } from 'crypto';
import { AccessToken } from './comment';
import { URLSearchParams } from 'url';

import { RedisService } from 'src/lib/redis/redis.service';
import { getCurrentTimestamp } from 'src/util/time.util';
import { getRandomString } from 'src/util';
import { AuthService } from 'src/auth/auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserStatus } from 'src/db/schema/user.schema';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
// const OAuth2 = google.auth.OAuth2;

@Injectable()
export class GoogleService {
  private oauth2Client: any;
  private webClientSecret: string;
  private webClientId: string;
  private webRenderBaseUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) // 注入 User 模型
    private userModel: Model<User>,

    private readonly redisService: RedisService,
    @Inject(forwardRef(() => AuthService))
    private readonly AuthService: AuthService,

  ) {
    this.oauth2Client = new google.auth.OAuth2();
    this.initGoogleSecrets();
  }

  /**
 * 初始化 OAuth2 客户端并设置凭证
 * @param accessToken 传入的 access_token
 */
  setCredentials(accessToken: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    });
  }

  /**
   * 获取初始化好的 OAuth2 客户端
   * @returns 返回 OAuth2 客户端
   */
    getClient() {
      return this.oauth2Client;
    }

  async initGoogleSecrets() {
    this.webClientSecret = this.configService.get<string>("GOOGLE_CONFIG.WEB_CLIENT_SECRET");
    this.webClientId = this.configService.get<string>("GOOGLE_CONFIG.WEB_CLIENT_ID");
    this.webRenderBaseUrl = this.configService.get<string>("GOOGLE_CONFIG.WEB_RENDER_URL");
  }

  async getAuthCode(mail: string, platform: string, type: string) {
    try {
      // const { tokens } = await this.oauth2Client.getToken(code);
      // this.oauth2Client.setCredentials(tokens);
      // this.oauth2Client.credentials = tokens;


      const state = getRandomString(8);
      this.redisService.setKey(`google:state:${state}`, { mail }, 60 * 10);

      // 根据参数platform选择 平台的权限
      let platScope = "";
      const platformScopes = {
        google: [
          "openid",
          "email",
          "https://www.googleapis.com/auth/calendar.readonly",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/userinfo.profile"
        ],
        youtube: [
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/userinfo.profile"
        ],
        meta: [
          "https://www.googleapis.com/auth/meta",
          "https://www.googleapis.com/auth/userinfo.profile"
        ]
      };

      if (platform === "google") {
        platScope += "" + platformScopes.google.join(" ");
      } else if (platformScopes.hasOwnProperty(platform)) {
        platScope += " " + platformScopes[platform].join(" ");
      }


      const params = new URLSearchParams({
        // scope: "openid email https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload",
        // scope: "openid https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload",
        scope: platScope,
        access_type: "offline",
        include_granted_scopes: "true",
        response_type: "code",
        state: state,
        redirect_uri: `${this.webRenderBaseUrl}/api/plat/${platform}/auth/callback`,
        client_id: this.webClientId,
        // prompt: "none",  // 默认 consent
        prompt: "consent"  // 强制重新授权
        // login_hint: mail,
      });
      // const authUrl = `https://accounts.google.com/o/oauth2/v2/auth`;
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

      // const result = await axios.post<{
      //   code: number; // 0;
      //   message: string; // '0';
      //   ttl: number; // 1;
      //   request_id: string; // '7b753a287405461f5afa526a1f672094';
      //   data: {
      //     upload_token: string; // 'd30bedaa4d8eb3128cf35ddc1030e27d';
      //   };
      // }>(url, body.toString(), {
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      //   // headers: { 'Content-Type': 'application/json' }
      // });
      // // return result.data.data.upload_token;

      // return result.data;

      authUrl.search = params.toString();

      return authUrl.toString();  // 返回生成的 URL

    } catch (err) {
      console.log('Error while trying to retrieve access token', err);
      return err;
    };
  }


  async getAuthCode_v2(platform: string, type: string) {
    try {
      const state = getRandomString(8);
      // this.redisService.setKey(`google:state:${state}`, { mail }, 60 * 10);

      console.log("++++++++++++++++++++++++")
      console.log(this.webClientId);
      console.log("++++++++++++++++++++++++")
      // 根据参数platform选择 平台的权限
      let platScope = "";
      const platformScopes = {
        google: [
          "openid",
          "email",
          "https://www.googleapis.com/auth/calendar.readonly",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/userinfo.profile"
        ],
        youtube: [
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/userinfo.profile"
        ],
        meta: [
          "https://www.googleapis.com/auth/meta",
          "https://www.googleapis.com/auth/userinfo.profile"
        ]
      };

      if (platform === "google") {
        platScope += "" + platformScopes.google.join(" ");
      } else if (platformScopes.hasOwnProperty(platform)) {
        platScope += " " + platformScopes[platform].join(" ");
      }

      const params = new URLSearchParams({
        // scope: "openid email https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload",
        // scope: "openid https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload",
        scope: platScope,
        access_type: "offline",
        include_granted_scopes: "true",
        response_type: "code",
        state: state,
        redirect_uri: `${this.webRenderBaseUrl}/api/plat/google/auth/accessToken`,
        client_id: this.webClientId,
        // prompt: "none",  // 默认 consent
        // prompt: "consent"
        // login_hint: mail,
      });
      // const authUrl = `https://accounts.google.com/o/oauth2/v2/auth`;
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

      // const result = await axios.post<{
      //   code: number; // 0;
      //   message: string; // '0';
      //   ttl: number; // 1;
      //   request_id: string; // '7b753a287405461f5afa526a1f672094';
      //   data: {
      //     upload_token: string; // 'd30bedaa4d8eb3128cf35ddc1030e27d';
      //   };
      // }>(url, body.toString(), {
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      //   // headers: { 'Content-Type': 'application/json' }
      // });
      // // return result.data.data.upload_token;

      // return result.data;

      authUrl.search = params.toString();

      return authUrl.toString();  // 返回生成的 URL

    } catch (err) {
      console.log('Error while trying to retrieve access token', err);
      return err;
    };
  }


  /**
   * 获取授权Token
   * @param code
   * @returns
   */
  async setUserAccessToken(data: {
    code: string;
    state: string;
  }) {

    const { code, state } = data;
    console.log("================ code state=======================")
    console.log(code, state);
    console.log("=============================================")

    try {
      const params = new URLSearchParams({
        code: code,
        redirect_uri: `${this.webRenderBaseUrl}/api/plat/google/auth/accessToken`,
        client_id: this.webClientId,
        grant_type: "authorization_code",
        client_secret: this.webClientSecret,
      });
      const tokenUrl  = `https://oauth2.googleapis.com/token`;

      const result = await axios.post<{
        access_token: string;
        expires_in: number;
        token_type: string;
        refresh_token: string;
        id_token: string;
      }>(tokenUrl , params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const mailInfo = await this.redisService.get(`google:state:${state}`);
      // console.log("----------------");
      // console.log(result.data);
      // console.log("mail:", mailInfo);
      const accessTokenInfo = result.data;

      // 初始化 OAuth2 客户端
      // const oAuth2Client = new google.auth.OAuth2();
      this.oauth2Client.setCredentials({
        access_token: accessTokenInfo.access_token,
      });

      const idToken = accessTokenInfo.id_token;
      const ticket = await this.oauth2Client.verifyIdToken({ idToken, audience: this.webClientId });
      const googleUser = ticket.getPayload();
      const googleAccount = { // Google 唯一 ID
        googleId: googleUser.sub,
        email: googleUser.email,
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
        expiresAt: getCurrentTimestamp() + result.data.expires_in
      };

      let userInfo: User | null = null;
      // 优先用 Google ID 查找（最准确）
      if (googleUser.sub) {
        userInfo = await this.userModel.findOne({
          'googleAccount.googleId': googleUser.sub,
          status: UserStatus.OPEN,
        });
      }
      // console.log("这里的info:", userInfo, googleUser.sub, googleUser.email)
      // 如果没有找到，再用 email 兜底查找（存在被别人注册的风险，需谨慎）
      if (!userInfo && googleUser.email) {
        userInfo = await this.userModel.findOne({
          mail: googleUser.email,
          status: UserStatus.OPEN,
        });
      }
      console.log("这里的info2222:", userInfo, googleUser.email)

      if (userInfo) {
        // 绑定 Google 信息
        // userInfo.googleId = googleId;
        // userInfo.mail = mailInfo.mail;
        userInfo.googleAccount = googleAccount
        // if(userInfo.googleAccount.googleId=== googleAccount.googleId) {
        //   userInfo.googleAccount = googleAccount; // 覆盖旧 token
        // } else {
        //   userInfo.googleAccount.push(googleAccount); // 添加新 Google 帐号
        // }

        console.log("更新后的数据：--", userInfo.googleAccount, userInfo.id)
        await this.userModel.updateOne(
          { _id: Object(userInfo.id) },
          { $set: { googleAccount: userInfo.googleAccount } },
        );

        // return userInfo;
      } else {
        console.log("用户不存在，创建");
        const newData = {
          name: `用户_${getRandomString(8)}`,
          mail: mailInfo.mail,
          googleAccount: googleAccount,
          status: UserStatus.OPEN,
        };

        userInfo = await this.userModel.create(newData);
        // console.log("新创建的用户：", userInfo);
      }
      console.log("userInfo22222:---", userInfo);
      const userId = userInfo.id

      this.redisService.del(`UserInfo:${userInfo.id}`);

      const TokenInfo = {
        phone: userInfo.phone,
        id: userInfo.id,
        name: userInfo.name,
        isManager: false,
        googleId: userInfo.googleAccount.googleId
      }
      console.log("发送获取systemToken的info---", TokenInfo);
      const systemToken = await this.AuthService.generateToken(TokenInfo)
      // 剩余有效秒数
      // const expires =
        // accessTokenInfo.expires_in - getCurrentTimestamp() - 60 * 60;

      // const expires = 30 * 24 * 60 * 60
      console.log("accessTokenInfo:---", accessTokenInfo);
      // console.log("expires:---", accessTokenInfo.expires_in);
      this.redisService.setKey(
        `google:accessToken:${userId}`,
        accessTokenInfo,
        accessTokenInfo.expires_in
      );

      // return result.data;
      return systemToken;
    } catch (err) {
      console.log('Error while trying to retrieve access token', err);
      return err;
    };
  }

  /**
   * Google登录
   * @param clientId Google客户端ID
   * @param credential Google认证凭证
   * @returns Account
   */
  async googleLogin(clientId: string, credential: string): Promise<any> {
    try {
      console.log('Verifying Google token with:');
      // 验证Google token
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      console.log('ticket',ticket)
      const googleUser = ticket.getPayload();
      console.log('payload',googleUser)
      if (!googleUser) {
        throw new Error('Invalid Google token');
      }

      console.log('Google login success, googleUser:', googleUser);

      const googleAccount = {
        googleId: googleUser.sub,
        email: googleUser.email,
        // accessToken: result.data.access_token,
        refreshToken: null,
        // expiresAt: result.data.expires_in
      };

      let userInfo: User | null = null;
      // 优先用 Google ID 查找（最准确）
      if (googleUser.sub) {
        userInfo = await this.userModel.findOne({
          'googleAccount.googleId': googleUser.sub,
          status: UserStatus.OPEN,
        });
      }
      // console.log("这里的info:", userInfo, googleUser.sub, googleUser.email)
      // 如果没有找到，再用 email 兜底查找（存在被别人注册的风险，需谨慎）
      if (!userInfo && googleUser.email) {
        userInfo = await this.userModel.findOne({
          mail: googleUser.email,
          status: UserStatus.OPEN,
        });
      }
      console.log("这里的info2222:", userInfo, googleUser.email)

      if (userInfo) {
        console.log("已有用户，更新绑定的 googleAccount:", userInfo);
        // 绑定 Google 信息
        // userInfo.googleId = googleId;
        // userInfo.mail = mailInfo.mail;
        // userInfo.googleAccount = googleAccount
          // 合并逻辑：仅在新 refresh_token 存在时覆盖旧的
        const updatedGoogleAccount = {
          ...userInfo.googleAccount,           // 原有内容
          ...googleAccount,                    // 新数据覆盖（但不覆盖 refresh_token）
          refreshToken: googleAccount.refreshToken != null && googleAccount.refreshToken !== ''
          ? googleAccount.refreshToken
          : userInfo.googleAccount?.refreshToken,
        };

        console.log("更新后的数据：--", updatedGoogleAccount, userInfo.id);

        // console.log("更新后的数据：--", userInfo.googleAccount, userInfo.id)
        // await this.userModel.updateOne(
        //   { _id: Object(userInfo.id) },
        //   { $set: { googleAccount: userInfo.googleAccount } },
        // );
        await this.userModel.updateOne(
          { _id: Object(userInfo.id) },
          { $set: { googleAccount: updatedGoogleAccount } },
        );

        // return userInfo;
      } else {
        console.log("用户不存在，创建");
        const newData = {
          name: `用户_${getRandomString(8)}`,
          mail: googleUser.email,
          googleAccount: googleAccount,
          status: UserStatus.OPEN,
        };

        userInfo = await this.userModel.create(newData);
        // console.log("新创建的用户：", userInfo);
      }
      console.log("userInfo22222:---", userInfo);
      this.redisService.del(`UserInfo:${userInfo.id}`);

      const TokenInfo = {
        phone: userInfo.phone,
        id: userInfo.id,
        name: userInfo.name,
        isManager: false,
        createTime: userInfo.createTime,
        mail: userInfo.mail,
        status: userInfo.status,
        updateTime: userInfo.updateTime,
        googleAccount: userInfo.googleAccount
      }
      console.log("发送获取systemToken的info---", TokenInfo);
      const systemToken = await this.AuthService.generateToken(TokenInfo)
      // 剩余有效秒数
      // const expires =
        // accessTokenInfo.expires_in - getCurrentTimestamp() - 60 * 60;

      // const expires = 30 * 24 * 60 * 60
      // console.log("accessTokenInfo:---", accessTokenInfo);
      // console.log("expires:---", accessTokenInfo.expires_in);
      // this.redisService.setKey(
      //   `google:accessToken:${userId}`,
      //   accessTokenInfo,
      //   accessTokenInfo.expires_in
      // );
      const loginResult = {
        token: null,
        type: "login",
        userInfo: TokenInfo
      }
      loginResult.token = systemToken
      return loginResult;
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error(`Google login failed: ${error.message}`);
    }
  }

  async setUserAccessToken_V2(data: {
    code: string;
    state: string;
  }) {

    const { code, state } = data;
    console.log("================ code state=======================")
    console.log(code, state);
    console.log("=============================================")

    try {
      const params = new URLSearchParams({
        code: code,
        redirect_uri: `${this.webRenderBaseUrl}/api/plat/google/auth/accessToken`,
        client_id: this.webClientId,
        grant_type: "authorization_code",
        client_secret: this.webClientSecret,
      });
      const tokenUrl  = `https://oauth2.googleapis.com/token`;

      const result = await axios.post<{
        access_token: string;
        expires_in: number;
        token_type: string;
        refresh_token: string;
        id_token: string;
      }>(tokenUrl , params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        // headers: { 'Content-Type': 'application/json' }
      });

      // const mailInfo = await this.redisService.get(`google:state:${state}`);
      console.log("----------------");
      console.log(result.data);
      // console.log("mail:", mailInfo);
      const accessTokenInfo = result.data;

      // 初始化 OAuth2 客户端
      // const oAuth2Client = new google.auth.OAuth2();
      this.oauth2Client.setCredentials({
        access_token: accessTokenInfo.access_token,
      });

      const idToken = accessTokenInfo.id_token;
      const ticket = await this.oauth2Client.verifyIdToken({ idToken, audience: this.webClientId });
      const googleUser = ticket.getPayload();
      console.log(googleUser);
      // const googleId = googleUser.sub; // Google 唯一 ID
      const googleAccount = {
        googleId: googleUser.sub,
        email: googleUser.email,
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
        expiresAt: getCurrentTimestamp() + result.data.expires_in
      };

      let userInfo: User | null = null;
      // 优先用 Google ID 查找（最准确）
      if (googleUser.sub) {
        userInfo = await this.userModel.findOne({
          'googleAccount.googleId': googleUser.sub,
          status: UserStatus.OPEN,
        });
      }
      // console.log("这里的info:", userInfo, googleUser.sub, googleUser.email)
      // 如果没有找到，再用 email 兜底查找（存在被别人注册的风险，需谨慎）
      if (!userInfo && googleUser.email) {
        userInfo = await this.userModel.findOne({
          mail: googleUser.email,
          status: UserStatus.OPEN,
        });
      }
      console.log("这里的info2222:", userInfo, googleUser.email)

      if (userInfo) {
        console.log("已有用户，更新绑定的 googleAccount:", userInfo);
        // 绑定 Google 信息
        // userInfo.googleId = googleId;
        // userInfo.mail = mailInfo.mail;
        // userInfo.googleAccount = googleAccount
          // 合并逻辑：仅在新 refresh_token 存在时覆盖旧的
        const updatedGoogleAccount = {
          ...userInfo.googleAccount,           // 原有内容
          ...googleAccount,                    // 新数据覆盖（但不覆盖 refresh_token）
          refreshToken: googleAccount.refreshToken != null && googleAccount.refreshToken !== ''
          ? googleAccount.refreshToken
          : userInfo.googleAccount?.refreshToken,
        };

        console.log("更新后的数据：--", updatedGoogleAccount, userInfo.id);

        // console.log("更新后的数据：--", userInfo.googleAccount, userInfo.id)
        // await this.userModel.updateOne(
        //   { _id: Object(userInfo.id) },
        //   { $set: { googleAccount: userInfo.googleAccount } },
        // );
        await this.userModel.updateOne(
          { _id: Object(userInfo.id) },
          { $set: { googleAccount: updatedGoogleAccount } },
        );

        // return userInfo;
      } else {
        console.log("用户不存在，创建");
        const newData = {
          name: `用户_${getRandomString(8)}`,
          mail: googleUser.email,
          googleAccount: googleAccount,
          status: UserStatus.OPEN,
        };

        userInfo = await this.userModel.create(newData);
        // console.log("新创建的用户：", userInfo);
      }
      console.log("userInfo22222:---", userInfo);
      const userId = userInfo.id

      this.redisService.del(`UserInfo:${userInfo.id}`);

      const TokenInfo = {
        phone: userInfo.phone,
        id: userInfo.id,
        name: userInfo.name,
        isManager: false,
        googleId: userInfo.googleAccount.googleId,
        mail: userInfo.mail
      }
      console.log("发送获取systemToken的info---", TokenInfo);
      const systemToken = await this.AuthService.generateToken(TokenInfo)
      // 剩余有效秒数
      // const expires =
        // accessTokenInfo.expires_in - getCurrentTimestamp() - 60 * 60;

      // const expires = 30 * 24 * 60 * 60
      console.log("accessTokenInfo:---", accessTokenInfo);
      // console.log("expires:---", accessTokenInfo.expires_in);
      this.redisService.setKey(
        `google:accessToken:${userId}`,
        accessTokenInfo,
        accessTokenInfo.expires_in
      );

      const loginResult = {
        token: null,
        type: "login",
        userInfo: TokenInfo
      }
      loginResult.token = systemToken
      return loginResult;

      // return result.data;
      // return systemToken;
    } catch (err) {
      console.log('Error while trying to retrieve access token', err);
      return err;
    };
  }

  async getUserAccessToken(userId: string): Promise<string> {
    const res: AccessToken = await this.redisService.get(
      `google:accessToken:${userId}`,
    );
    // if (!res) return '';

    // // 剩余时间
    // const overTime = res.expires_in;

    // if (overTime < 60 * 60 && overTime > 0) {
    //   // 刷新token
    //   this.refreshAccessToken(userId, res.refresh_token);
    // }
    const userInfo = await this.userModel.findOne({_id: userId});
    this.refreshAccessToken(userId, userInfo.googleAccount.refreshToken);
    return res.access_token;
  }

  /**
   * 刷新授权Token
   * @param refreshToken
   * @returns
   */
  async refreshAccessToken(userId: string, refreshToken?: string) {
    try {
      const userInfo = await this.userModel.findOne({_id: userId});
      if(!refreshToken) {

        console.log("=============userInfo====================");
        console.log(userInfo)
        refreshToken = userInfo?.googleAccount?.refreshToken ?? ''
      }

      const tokenUrl = 'https://oauth2.googleapis.com/token';

      // 请求体的参数
      const params = new URLSearchParams({
        client_id: this.webClientId,  // 使用你的 client_id
        client_secret: this.webClientSecret,  // 使用你的 client_secret
        refresh_token: refreshToken,  // 提供刷新令牌
        grant_type: 'refresh_token',  // 认证类型是刷新令牌
      });

      // 发送 POST 请求到 Google token endpoint 来刷新 access token
      const response = await axios.post(tokenUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      console.log("================response================")
      console.log(response);
      const accessTokenInfo = response.data;
      // console.log("================accessTokenInfo================")
      // console.log(accessTokenInfo);
      // 剩余有效秒数
      const expires = accessTokenInfo.expires_in
        // accessTokenInfo.expires_in - getCurrentTimestamp() - 60 * 60;
      this.redisService.setKey(
        `google:accessToken:${userId}`,
        accessTokenInfo,
        expires,
      );


      const TokenInfo = {
        phone: userInfo?.phone ?? '', // 如果 userInfo.phone 为 undefined 或 null，则使用空字符串
        id: userId,
        name: userInfo.name,
        isManager: false,
        googleId: userInfo?.googleAccount?.googleId ?? ''
      }
      console.log("发送获取systemToken的info---", TokenInfo);
      const systemToken = await this.AuthService.generateToken(TokenInfo)
      // 剩余有效秒数
      // const expires =
        // accessTokenInfo.expires_in - getCurrentTimestamp() - 60 * 60;

      // const expires = 30 * 24 * 60 * 60
      console.log("accessTokenInfo:---", accessTokenInfo);
      // console.log("expires:---", accessTokenInfo.expires_in);
      this.redisService.setKey(
        `google:accessToken:${userId}`,
        accessTokenInfo,
        accessTokenInfo.expires_in
      );

      // return result.data;
      return systemToken;


      // 返回新的 access token 和其他信息
      // return response.data;  // 包含新的 access_token、expires_in、token_type 等信息
    } catch (err) {
      console.log('Error while refreshing access token', err);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * 查询用户已授权权限列表
   * @returns
   */
  async getAccountScopes(accessToken: string) {
    try {
      // 初始化 OAuth2 客户端
      // const oAuth2Client = new google.auth.OAuth2();
      this.oauth2Client.setCredentials({
        access_token: accessToken,
      });

      // 通过访问 token 查询 token 信息
      const tokenInfo = await google.oauth2('v2').tokeninfo({
        access_token: accessToken,
      });

      console.log('Token Info:', tokenInfo.data);

      // 查询用户的基本信息
      const userInfo = await google.oauth2('v2').userinfo.get({
        auth: this.oauth2Client,
      });

      console.log('User Info:', userInfo.data);

      // 返回用户的权限和信息
      return {
        tokenInfo: tokenInfo.data,
        userInfo: userInfo.data,
      };
    } catch (error) {
      console.error('Error getting user permissions:', error);
      throw new Error('Failed to get user permissions');
    }
  }

  /**
   * 获取已授权的用户信息
   * @param data
   */
  async getUserInfo(accessToken: string, token) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // 返回用户信息
      return response.data;
    } catch (err) {
      console.error('Error fetching user info:', err);
      throw new Error('Failed to fetch user info');
    }
  }

}


