import { Injectable, Inject, forwardRef, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

import { RedisService } from 'src/lib/redis/redis.service';
import { AuthService } from 'src/auth/auth.service';
import { AccountService } from 'src/modules/account/account.service';
import { Account, AccountStatus, AccountType } from 'src/db/schema/account.schema';
import { AccountToken, TokenPlatform, TokenStatus } from 'src/db/schema/accountToken.schema';
import { User } from 'src/db/schema/user.schema';
import { IdService } from 'src/db/id.service';
import { getCurrentTimestamp } from 'src/util/time.util';
import axios from 'axios'

import { TwitterOAuthTokenResponse, TwitterUser } from './dto/twitter.dto';

// Twitter API Constants
const TWITTER_API_V2_BASE_URL = 'https://api.twitter.com/2';
const TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const AUTHORIZE_URL = 'https://twitter.com/i/oauth2/authorize';

@Injectable()
export class TwitterAuthService {
  private webClientSecret: string;
  private webClientId: string;
  private webRenderBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
    private readonly idService: IdService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly accountService: AccountService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Account.name) private readonly accountModel: Model<Account>,
    @InjectModel(AccountToken.name) private readonly accountTokenModel: Model<AccountToken>,
  ) {
    this.initTwitterSecrets();
  }
  /**
   * 初始化Twitter API密钥
   */
  private initTwitterSecrets() {
    // 从配置服务获取Twitter API密钥
    this.webClientId = this.configService.get<string>('TWITTER_CONFIG.WEB_CLIENT_ID');
    this.webClientSecret = this.configService.get<string>('TWITTER_CONFIG.WEB_CLIENT_SECRET');
    this.webRenderBaseUrl = this.configService.get<string>('TWITTER_CONFIG.WEB_RENDER_URL');

    if (!this.webClientId || !this.webClientSecret || !this.webRenderBaseUrl) {
      console.warn('Twitter API配置缺失，请检查环境变量或配置文件');
    }
  }

  /**
   * 生成PKCE码校验器和挑战码
   */
  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    // 生成随机码验证器
    const codeVerifier = crypto.randomBytes(32).toString('base64url');

    // 生成码挑战
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return { codeVerifier, codeChallenge };
  }

  /**
   * 获取Twitter授权URL
   * @param userId 用户ID
   * @param mail 用户邮箱
   * @returns 包含授权URL的对象
   */
  async getAuthorizationUrl(userId: string, mail?: string): Promise<object> {
    const state = crypto.randomBytes(16).toString('hex');
    const { codeVerifier, codeChallenge } = this.generatePKCE();

    // 存储状态数据和PKCE验证码
    const stateData = {
      originalState: state,
      userId: userId,
      email: mail,
      codeVerifier: codeVerifier
    };

    // 将状态数据保存到Redis，5分钟有效期
    await this.redisService.setKey(`twitter:state:${state}`, JSON.stringify(stateData), 600);

    // 定义请求的权限范围
    const scopes = [
      'tweet.write',
      'tweet.read',
      'tweet.moderate.write',
      'users.read',
      'space.read',
      'like.read',
      'like.write',
      'list.read',
      'list.write',
      'media.write',
      'offline.access']; // offline.access用于获取刷新令牌

    // 构建授权URL参数
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.webClientId,
      redirect_uri: `${this.webRenderBaseUrl}/api/plat/twitter/auth/callback`,
      scope: scopes.join(' '),
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256', // 使用SHA-256算法
    });

    // 构建完整的授权URL
    const authUrl = `${AUTHORIZE_URL}?${params.toString()}`;
    console.log('Twitter授权URL:', authUrl);

    return { url: authUrl };
  }

  /**
   * 处理Twitter授权回调
   * @param code 授权码
   * @param state 状态码
   * @returns 处理结果
   */
  async handleAuthorizationCallback(code: string, state: string): Promise<object> {
    // 从Redis获取存储的状态数据
    const stateDataJson = await this.redisService.get(`twitter:state:${state}`);
    if (!stateDataJson) {
      throw new BadRequestException('无效或过期的状态码');
    }
    // 解析状态数据
    const stateData = JSON.parse(stateDataJson);
    const { userId, codeVerifier } = stateData;

    // 验证状态数据
    if (!userId || !codeVerifier) {
      throw new BadRequestException('状态数据不完整');
    }

    try {
      // 删除Redis中的状态数据
      await this.redisService.del(`twitter:state:${state}`);

      // 交换授权码获取访问令牌
      const tokenResponse = await this.exchangeCodeForTokens(code, codeVerifier);
      const { access_token, refresh_token, expires_in, scope } = tokenResponse;

      // 获取Twitter用户资料
      const twitterUser = await this.getTwitterUserProfile(access_token);

      // 获取或存储刷新令牌
      console.log('获取到Twitter访问令牌:', access_token.substring(0, 10) + '...');
      console.log('有效期:', expires_in, '秒');

      // 更新或创建账户信息
      await this.updateTwitterAccountInfo(
        userId,
        twitterUser.id,
        access_token,
        refresh_token,
        expires_in
      );

      // 缓存访问令牌
      await this.redisService.setKey(
        `twitter:accessToken:${twitterUser.id}`,
        {
          access_token,
          refresh_token,
          expires_in
        },
        expires_in
      );

      // 查询更新后的账号信息
      const existingAccount = await this.accountModel.findOne({
        type: AccountType.TWITTER,
        uid: twitterUser.id
      });

      // 生成并返回结果
      const results = {
        data: {
          accountInfo: existingAccount,
          userInfo: {
            userId: userId,
            uid: twitterUser.id
          }
        },
        msg: "success",
        code: 0
      };

      console.log("最终返回", results);
      return results;

    } catch (error) {
      console.error('处理Twitter授权回调失败:', error);
      throw new HttpException(
        error.response?.data?.error_description || '授权失败',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  /**
   * 交换授权码获取令牌
   * @param code 授权码
   * @param codeVerifier PKCE验证码
   * @returns Twitter OAuth令牌响应
   */
  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TwitterOAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: this.webClientId,
      redirect_uri: `${this.webRenderBaseUrl}/api/plat/twitter/auth/callback`,
      code_verifier: codeVerifier,
    });

    const base64Credentials = Buffer.from(`${this.webClientId}:${this.webClientSecret}`).toString('base64');

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<TwitterOAuthTokenResponse>(TOKEN_URL, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Credentials}`,
          },
        }),
      );
      return data;
    } catch (error) {
      console.error('交换Twitter授权码失败:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.error_description || '获取Twitter令牌失败',
        error.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取Twitter用户资料
   * @param accessToken 访问令牌
   * @returns Twitter用户资料
   */
  private async getTwitterUserProfile(accessToken: string): Promise<TwitterUser> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ data: TwitterUser }>(`${TWITTER_API_V2_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            'user.fields': 'id,name,username,profile_image_url,description,public_metrics,created_at,verified',
          },
        }),
      );
      return data.data;
    } catch (error) {
      console.error('获取Twitter用户资料失败:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.detail || '获取Twitter用户资料失败',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 更新Twitter账户信息
   * 根据Twitter用户ID创建或更新账户
   * @param userId 用户ID
   * @param twitterId Twitter用户ID
   * @param accessToken 访问令牌
   * @param refreshToken 刷新令牌
   * @param expires_in 令牌有效期（秒）
   */
  private async updateTwitterAccountInfo(
    userId: string,
    twitterId: string,
    accessToken: string,
    refreshToken: string,
    expires_in: number
  ): Promise<void> {
    try {
      // 获取Twitter用户资料
      const twitterUser = await this.getTwitterUserProfile(accessToken);

      // 准备账号信息
      const channelInfo = {
        userId: userId,
        type: AccountType.TWITTER,
        uid: twitterId,
        account: twitterUser.username,
        nickname: twitterUser.name,
        avatar: twitterUser.profile_image_url,
        homePage: `https://twitter.com/${twitterUser.username}`,
        fansCount: twitterUser.public_metrics?.followers_count || 0,
        followCount: twitterUser.public_metrics?.following_count || 0,
        workCount: twitterUser.public_metrics?.tweet_count || 0,
        likeCount: 0,
        readCount: 0,
        collectCount: 0,
        forwardCount: 0,
        commentCount: 0,
        updateTime: new Date(),
        status: AccountStatus.USABLE,
        loginCookie: "1111", // Twitter不使用cookie认证
        token: "111", // 存储访问令牌
      };

      console.log(channelInfo);

      // 使用AccountService创建或更新账户
      const account = await this.accountService.addOrUpdateAccount(channelInfo);
      console.log("成功创建或更新Twitter账号:", account);

      // 检查是否存在账号Token
      let accountToken = await this.accountTokenModel.findOne({
        accountId: twitterId,
        platform: TokenPlatform.TWITTER
      });

      if (accountToken) {
        if (refreshToken && refreshToken.trim() !== '') {
          accountToken.refreshToken = refreshToken;
        }
        // 更新现有Token
        // await this.accountTokenModel.findOneAndUpdate(
        //   { accountId: twitterId, platform: TokenPlatform.TWITTER },
        //   {
        //     refreshToken: refreshToken,
        //     updateTime: new Date(),
        //     expiresAt: new Date((getCurrentTimestamp() + expires_in) * 1000)
        //   },
        // );
        accountToken.expiresAt = new Date((getCurrentTimestamp() + expires_in) * 1000);
        accountToken.updateTime = new Date();
        await accountToken.save();
        console.log("成功更新Twitter账号Token");
      } else {
        // 创建新Token
        await this.accountTokenModel.create({
          userId,
          accountId: twitterId,
          platform: TokenPlatform.TWITTER,
          refreshToken: refreshToken,
          expiresAt: new Date((getCurrentTimestamp() + expires_in) * 1000),
          status: TokenStatus.USABLE,
          createTime: new Date(),
          updateTime: new Date(),
        });
        console.log("成功创建Twitter账号Token");
      }
    } catch (error) {
      console.error('更新Twitter账号信息失败:', error);
      // 不抛出异常，避免影响授权流程
    }
  }

  /**
   * 刷新用户的Twitter访问令牌
   * @param userId 用户ID
   * @param accountId 账号ID
   * @param refreshToken 刷新令牌
   * @returns 新的访问令牌信息
   */
  async refreshAccessToken(userId: string, accountId: string, refreshToken: string): Promise<object> {
    console.log(userId, accountId, refreshToken);
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.webClientId,
        // redirect_uri: `${this.webRenderBaseUrl}/api/plat/twitter/auth/callback`,
      });
      // 请求体的参数
      // const params = new URLSearchParams({
      //   client_id: this.webClientId,  // 使用你的 client_id
      //   client_secret: this.webClientSecret,  // 使用你的 client_secret
      //   refresh_token: refreshToken,  // 提供刷新令牌
      //   grant_type: 'refresh_token',  // 认证类型是刷新令牌
      // });

      const base64Credentials = Buffer.from(`${this.webClientId}:${this.webClientSecret}`).toString('base64');

      const { data } = await firstValueFrom(
        this.httpService.post(TOKEN_URL, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Credentials}`,
          },
          // auth: {
          //   username: this.webClientId,
          //   password: this.webClientSecret
          // }
        })
      );
      // const response = await axios.post(TOKEN_URL, params.toString(), {
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // });
      // console.log("================response================")
      // console.log(response);
      // const accessTokenInfo = response.data;
      // // console.log("================accessTokenInfo================")
      // // console.log(accessTokenInfo);
      // // 剩余有效秒数
      // const expires = accessTokenInfo.expires_in
      // const { data } = await firstValueFrom(
      //   this.httpService.post(TOKEN_URL, params.toString(), {
      //     headers: {
      //       'Content-Type': 'application/x-www-form-urlencoded'
      //     }
      //   })
      // );
      // await this.redisService.setKey(
      //   `twitter:accessToken:${accountId}`,
      //   accessTokenInfo,
      //   expires
      // );
      console.log('Twitter API响应:', JSON.stringify(data));
      const { access_token, refresh_token, expires_in } = data;

      // 更新Redis中的令牌
      const TokenInfo = { access_token, refresh_token, expires_in };
      await this.redisService.setKey(
        `twitter:accessToken:${accountId}`,
        TokenInfo,
        expires_in
      );

      console.log('刷新Twitter访问令牌成功');
      const userInfo = await this.userModel.findOne({_id: userId});
      const systemTokenInfo = {
        phone: userInfo?.phone ?? '', // 如果 userInfo.phone 为 undefined 或 null，则使用空字符串
        id: userId,
        name: userInfo.name,
        isManager: false,
        googleId: userInfo?.googleAccount?.googleId ?? ''
      }
      // 生成系统令牌
      const systemToken = await this.authService.generateToken(systemTokenInfo);

      return { url: systemToken };
    } catch (err) {
      console.log(err);
      console.error('刷新Twitter访问令牌失败:', err.response?.data || err.message);
      throw new HttpException(
        err.response?.data?.error_description || '刷新令牌失败',
        err.response?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 获取用户的Twitter访问令牌
   * @param accountId 账号ID
   * @returns 访问令牌
   */
  async getUserAccessToken(accountId: string): Promise<string> {
    console.log("获取访问令牌，accountId:", accountId);

    // 先检查Redis缓存
    const cachedToken = await this.redisService.get(`twitter:accessToken:${accountId}`);
    if (cachedToken && cachedToken.access_token) {
      console.log("从Redis获取到有效令牌");
      return cachedToken.access_token;
    }

    // 如果缓存中没有，尝试刷新
    const accountTokenInfo = await this.accountTokenModel.findOne({accountId: accountId});
    if (!accountTokenInfo || !accountTokenInfo.refreshToken) {
      throw new BadRequestException('无效的账号或刷新令牌丢失');
    }

    // 刷新并获取新令牌
    const refreshResult = await this.refreshAccessToken(
      accountTokenInfo.userId,
      accountTokenInfo.accountId,
      accountTokenInfo.refreshToken
    );

    // 刷新后再次从Redis获取
    const newToken = await this.redisService.get(`twitter:accessToken:${accountId}`);
    if (!newToken || !newToken.access_token) {
      throw new BadRequestException('刷新令牌后未能获取访问令牌');
    }

    return newToken.access_token;
  }

  /**
   * 检查用户是否已授权Twitter
   * @param accountId 账号ID
   * @returns 是否已授权
   */
  async isAuthorized(accountId: string): Promise<boolean> {
    try {
      const accessToken = await this.getUserAccessToken(accountId);
      return !!accessToken;
    } catch (error) {
      return false;
    }
  }

  /**
   * 撤销Twitter授权
   * @param accountId 账号ID
   * @returns 撤销结果
   */
  async revokeAuthorization(accountId: string): Promise<boolean> {
    try {
      const accessToken = await this.getUserAccessToken(accountId);
      if (!accessToken) {
        return true; // 已经没有授权了
      }

      // 撤销Twitter令牌
      const params = new URLSearchParams({
        token: accessToken,
        client_id: this.webClientId,
        token_type_hint: 'access_token'
      });

      const base64Credentials = Buffer.from(`${this.webClientId}:${this.webClientSecret}`).toString('base64');

      await firstValueFrom(
        this.httpService.post(`${TWITTER_API_V2_BASE_URL}/oauth2/revoke`, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Credentials}`,
          },
        }),
      );

      // 删除缓存的令牌
      await this.redisService.del(`twitter:accessToken:${accountId}`);

      // 更新用户信息，移除授权信息
      await this.accountTokenModel.updateOne(
        { accountId: accountId },
        { $unset: { 'refreshToken': 1, 'expiresAt': 1 } }
      );

      return true;
    } catch (error) {
      console.error('撤销Twitter授权失败:', error);
      return false;
    }
  }

  /**
   * 获取初始化后的Twitter API客户端
   * @param accountId 账号ID
   * @returns 初始化后的客户端
   */
  async getTwitterClient(accountId: string): Promise<any> {
    const accessToken = await this.getUserAccessToken(accountId);
    if (!accessToken) {
      throw new Error('No access token available, user needs to authorize');
    }

    // 返回一个简单的API客户端，可以根据需要扩展
    return {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      baseUrl: TWITTER_API_V2_BASE_URL,
      async get(endpoint: string, params = {}) {
        // 这里可以实现实际的API调用逻辑
        // 或者使用第三方Twitter客户端库
      }
    };
  }
}
