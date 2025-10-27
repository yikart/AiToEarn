import { Injectable, Inject, forwardRef, BadRequestException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

import { RedisService } from 'src/lib/redis/redis.service';
import { IdService } from 'src/db/id.service';

import { AuthService } from 'src/auth/auth.service';
import { AccountService } from 'src/modules/account/account.service';
import { User } from 'src/db/schema/user.schema';
import { Account, AccountType, AccountStatus } from 'src/db/schema/account.schema';
import { AccountToken, TokenPlatform, TokenStatus } from 'src/db/schema/accountToken.schema';
import { TikTokOAuthTokenResponse, TikTokUser } from './dto/tiktok.dto';

// 工具函数
function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

@Injectable()
export class TikTokAuthService {
  private readonly logger = new Logger(TikTokAuthService.name);
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private authUrl: string;
  private tokenUrl: string;
  private revokeUrl: string;
  private refreshTokenUrl: string;
  private apiBaseUrl: string;
  private scopes: string;

  private state: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,

    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,

    @Inject(forwardRef(() => AccountService))
    private readonly accountService: AccountService,

    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Account.name) private readonly accountModel: Model<Account>,
    @InjectModel(AccountToken.name) private readonly accountTokenModel: Model<AccountToken>,
  ) {
    this.initTikTokSecrets();
  }

  /**
   * 初始化TikTok API密钥和配置
   */
  private initTikTokSecrets() {
    const tikTokConfig = this.configService.get('tiktok');
    if (!tikTokConfig) {
      throw new Error('TikTok配置未找到，请检查环境变量和配置文件');
    }

    this.clientId = tikTokConfig.clientId;
    this.clientSecret = tikTokConfig.clientSecret;
    this.redirectUri = tikTokConfig.redirectUri;
    this.authUrl = tikTokConfig.authUrl;
    this.tokenUrl = tikTokConfig.tokenUrl;
    this.revokeUrl = tikTokConfig.revokeUrl;
    this.refreshTokenUrl = tikTokConfig.refreshTokenUrl;
    this.apiBaseUrl = tikTokConfig.apiBaseUrl;
    this.scopes = tikTokConfig.scopes;

    if (!this.clientId || !this.clientSecret) {
      this.logger.error('TikTok客户端ID或密钥未设置');
    }
  }

  /**
   * 生成随机状态码用于OAuth流程
   */
  private generateState(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * 生成PKCE的code_verifier和code_challenge
   * @returns 包含code_verifier和code_challenge的对象
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
   * 获取TikTok授权URL
   * @param mail 用户邮箱
   * @returns 包含授权URL的对象
   */
  async getAuthorizationUrl(userId: string, mail: string): Promise<object> {
    if (!userId) {
      throw new BadRequestException('userId是必需的');
    }

    // 生成状态参数以防止CSRF攻击
    const state = this.generateState();

    // 生成PKCE的code_verifier和code_challenge
    const { codeVerifier, codeChallenge } = this.generatePKCE();

    const stateData = {
      originalState: state, // 保留原始state值
      userId: userId,      // 用户ID
      email: mail,         // 邮箱
      codeVerifier: codeVerifier      // 保存code_verifier用于后续交换token
    };

    // 将状态与用户数据关联并存储在Redis中 (10分钟有效期)
    await this.redisService.setKey(`tiktok:state:${state}`, JSON.stringify(stateData), 600);

    // 构建TikTok授权URL
    // const authUrl = new URL(this.authUrl);
    // authUrl.searchParams.append('client_key', this.clientId);
    // authUrl.searchParams.append('response_type', 'code');
    // authUrl.searchParams.append('redirect_uri', `${this.redirectUri}/api/plat/tiktok/auth/callback`);
    // authUrl.searchParams.append('scope', this.scopes);
    // authUrl.searchParams.append('state', state);
    // // 添加PKCE参数
    // authUrl.searchParams.append('code_challenge', codeChallenge);
    // authUrl.searchParams.append('code_challenge_method', 'S256');

    // return {
    //   url: authUrl.toString()
    // };

    // 构建授权URL参数
    const params = new URLSearchParams({
      response_type: 'code',
      client_key: this.clientId,
      redirect_uri: `${this.redirectUri}/api/plat/tiktok/auth/callback`,
      scope: this.scopes,
      state: state,
      code_challenge: codeChallenge,
      // disable_auto_auth: '0',
      code_challenge_method: 'S256', // 使用SHA-256算法
    });

    // 构建完整的授权URL
    const authUrl = `${this.authUrl}?${params.toString()}`;
    console.log('TikTok授权URL:', authUrl);

    return { url: authUrl };

  }

  /**
   * 处理TikTok授权回调
   * @param code 授权码
   * @param state 状态码
   * @returns 处理结果
   */
  async handleAuthorizationCallback(code: string, state: string): Promise<object> {
    // // 解析状态参数
    // let parsedState;
    // try {
    //   parsedState = JSON.parse(decodeURIComponent(state));
    // } catch (error) {
    //   this.logger.error('无法解析状态参数:', error);
    //   throw new BadRequestException('无效的状态参数格式');
    // }

    // 从Redis获取保存的状态信息
    // const originalState = parsedState.state;

    const stateDataJson = await this.redisService.get(`tiktok:state:${state}`);
    if (!stateDataJson) {
      throw new BadRequestException('无效的状态参数或状态已过期');
    }
    // 解析状态数据
    const stateData = JSON.parse(stateDataJson);
    console.log('stateData:------', stateData);
    const { userId, codeVerifier } = stateData;
    if (!userId || !codeVerifier) {
      throw new BadRequestException('状态数据不完整');
    }

    // 删除Redis中的状态信息
    await this.redisService.del(`tiktok:state:${state}`);

    try {
      // 使用授权码交换令牌，并传入codeVerifier
      const tokenResponse = await this.exchangeCodeForTokens(code, codeVerifier);
      console.log("获取授权码成功！", tokenResponse);
      // 获取用户信息
      const userProfile = await this.getTikTokUserProfile(tokenResponse.access_token, tokenResponse.open_id);

      // 更新或创建TikTok账户信息
      await this.updateTikTokAccountInfo(
        userId,
        userProfile.open_id,
        tokenResponse.access_token,
        tokenResponse.refresh_token,
        tokenResponse.expires_in
      );

      // 保存访问令牌到Redis以便后续使用
      await this.redisService.setKey(
        `tiktok:accessToken:${userProfile.open_id}`,
        {
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_in: tokenResponse.expires_in,
          expiry_time: getCurrentTimestamp() + tokenResponse.expires_in
        },
        tokenResponse.expires_in - 300 // 令牌过期前5分钟
      );

      // 生成系统令牌
      const userInfo = await this.userModel.findOne({ _id: userId });
      const systemTokenInfo = {
        phone: userInfo?.phone ?? '',
        id: userId,
        name: userInfo.name,
        isManager: false,
        googleId: userInfo?.googleAccount?.googleId ?? ''
      };

      const systemToken = await this.authService.generateToken(systemTokenInfo);

      return { data: systemTokenInfo };
    } catch (error) {
      this.logger.error('处理TikTok授权回调失败:', error);
      throw new HttpException(
        '授权TikTok账户失败: ' + (error.response?.data?.error_description || error.message),
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 交换授权码获取令牌
   * @param code 授权码
   * @returns TikTok OAuth令牌响应
   */
  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TikTokOAuthTokenResponse> {
    try {
      // 构建请求体
      const params = new URLSearchParams({
        client_key: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${this.redirectUri}/api/plat/tiktok/auth/callback`,
        // 添加PKCE code_verifier
        // code_verifier: codeVerifier  // Required for mobile and desktop app only.
      });

      // const base64Credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const { data } = await firstValueFrom(
        this.httpService.post(this.tokenUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // 'Authorization': `Basic ${base64Credentials}`,
          }
        })
      );

      if (data.error) {
        throw new BadRequestException(`交换令牌失败: ${data}`);
      }

      // return {
      //   access_token: data.access_token,
      //   refresh_token: data.refresh_token,
      //   expires_in: data.expires_in,
      //   token_type: data.token_type,
      //   scope: data.scope,
      //   open_id: data.open_id
      // };
      return data;
    } catch (error) {
      this.logger.error('交换TikTok授权码失败:', error);
      throw new BadRequestException(`交换授权码失败: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * 获取TikTok用户资料
   * @param accessToken 访问令牌
   * @param openId 用户开放ID
   * @returns TikTok用户资料
   */
  async getTikTokUserProfile(accessToken: string, openId: string): Promise<TikTokUser> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiBaseUrl}/v2/user/info/`, {
          params: {
            fields: 'open_id,union_id,avatar_url,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count,username, display_name',
            // open_id: openId
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      console.log(data)
      // if (data.error) {
      //   throw new BadRequestException(`获取用户信息失败: ${data.error.message}`);
      // }

      return data.data.user;
    } catch (error) {
      this.logger.error('获取TikTok用户信息失败:', error);
      throw new BadRequestException(`获取用户信息失败: ${error.response?.data?.error?.message || error.message || error.code}`);
    }
  }

  /**
   * 更新TikTok账户信息
   * @param userId 用户ID
   * @param tikTokId TikTok用户ID
   * @param accessToken 访问令牌
   * @param refreshToken 刷新令牌
   * @param expires_in 令牌有效期（秒）
   */
  async updateTikTokAccountInfo(
    userId: string,
    tikTokId: string,
    accessToken: string,
    refreshToken: string,
    expires_in: number
  ): Promise<void> {
    try {
      // 获取TikTok用户信息
      const tikTokUser = await this.getTikTokUserProfile(accessToken, tikTokId);

      // 准备账号信息
      const channelInfo = {
        userId: userId,
        type: AccountType.TIKTOK, // 需要在AccountType中添加TIKTOK类型
        uid: tikTokId,
        account: tikTokUser.username,
        nickname: tikTokUser.display_name,
        avatar: tikTokUser.avatar_url,
        homePage: tikTokUser.profile_deep_link,
        fansCount: tikTokUser.follower_count,
        followCount: tikTokUser.following_count,
        workCount: tikTokUser.video_count,
        likeCount: tikTokUser.likes_count,
        readCount: 0,
        collectCount: 0,
        forwardCount: 0,
        commentCount: 0,
        updateTime: new Date(),
        status: AccountStatus.USABLE,
        loginCookie: "1111", // TikTok不使用cookie认证
        token: "111", // 存储访问令牌
      };

      // 使用AccountService创建或更新账户
      const account = await this.accountService.addOrUpdateAccount(channelInfo);
      this.logger.log("成功创建或更新TikTok账号:", account);

      // 检查是否存在账号Token
      let accountToken = await this.accountTokenModel.findOne({
        accountId: tikTokId,
        platform: TokenPlatform.TIKTOK // 需要在TokenPlatform中添加TIKTOK类型
      });

      if (accountToken) {
        if (refreshToken && refreshToken.trim() !== '') {
          accountToken.refreshToken = refreshToken;
        }
        accountToken.expiresAt = new Date((getCurrentTimestamp() + expires_in) * 1000);
        accountToken.updateTime = new Date();
        await accountToken.save();
        this.logger.log("成功更新TikTok账号Token");
      } else {
        // 创建新Token
        await this.accountTokenModel.create({
          userId,
          accountId: tikTokId,
          platform: TokenPlatform.TIKTOK, // 需要在TokenPlatform中添加TIKTOK类型
          refreshToken: refreshToken,
          expiresAt: new Date((getCurrentTimestamp() + expires_in) * 1000),
          status: TokenStatus.USABLE,
          createTime: new Date(),
          updateTime: new Date(),
        });
        this.logger.log("成功创建TikTok账号Token");
      }
    } catch (error) {
      this.logger.error('更新TikTok账号信息失败:', error);
      // 不抛出异常，避免影响授权流程
    }
  }

  /**
   * 刷新用户的TikTok访问令牌
   * @param userId 用户ID
   * @param accountId 账号ID
   * @param refreshToken 刷新令牌
   * @returns 新的访问令牌信息
   */
  async refreshAccessToken(userId: string, accountId: string, refreshToken: string): Promise<object> {
    this.logger.log(`尝试刷新TikTok令牌: userId=${userId}, accountId=${accountId}`);
    try {
      const params = new URLSearchParams({
        client_key: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      });

      const { data } = await firstValueFrom(
        this.httpService.post(this.refreshTokenUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );

      if (data.error) {
        throw new BadRequestException(`刷新令牌失败: ${data.error_description}`);
      }

      // 保存新令牌到Redis
      await this.redisService.setKey(
        `tiktok:accessToken:${accountId}`,
        {
          access_token: data.access_token,
          refresh_token: data.refresh_token || refreshToken, // 有些OAuth提供商在刷新时不返回新的刷新令牌
          expires_in: data.expires_in,
          expiry_time: getCurrentTimestamp() + data.expires_in
        },
        data.expires_in - 300 // 令牌过期前5分钟
      );

      // 更新数据库中的刷新令牌
      if (data.refresh_token) {
        await this.accountTokenModel.updateOne(
          { accountId: accountId, platform: TokenPlatform.TIKTOK },
          {
            refreshToken: data.refresh_token,
            expiresAt: new Date((getCurrentTimestamp() + data.expires_in) * 1000),
            updateTime: new Date()
          }
        );
      }

      this.logger.log('刷新TikTok访问令牌成功');
      // 返回系统令牌用于前端重定向
      const userInfo = await this.userModel.findOne({_id: userId});
      const systemTokenInfo = {
        phone: userInfo?.phone ?? '',
        id: userId,
        name: userInfo.name,
        isManager: false,
        googleId: userInfo?.googleAccount?.googleId ?? ''
      };

      const systemToken = await this.authService.generateToken(systemTokenInfo);
      return { url: systemToken };
    } catch (err) {
      this.logger.error('刷新TikTok访问令牌失败:', err.response?.data || err.message);
      throw new HttpException(
        err.response?.data?.error_description || '刷新令牌失败',
        err.response?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 获取用户的TikTok访问令牌
   * @param accountId 账号ID
   * @returns 访问令牌
   */
  async getUserAccessToken(accountId: string): Promise<string> {
    this.logger.log(`获取TikTok访问令牌: accountId=${accountId}`);

    // 先检查Redis缓存
    const cachedToken = await this.redisService.get(`tiktok:accessToken:${accountId}`);
    if (cachedToken && cachedToken.access_token) {
      this.logger.log("从Redis获取到有效令牌");
      return cachedToken.access_token;
    }

    // 如果缓存中没有，尝试刷新
    const accountTokenInfo = await this.accountTokenModel.findOne({
      accountId: accountId,
      platform: TokenPlatform.TIKTOK
    });

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
    const newToken = await this.redisService.get(`tiktok:accessToken:${accountId}`);
    if (!newToken || !newToken.access_token) {
      throw new BadRequestException('刷新令牌后未能获取访问令牌');
    }

    return newToken.access_token;
  }

  /**
   * 检查用户是否已授权TikTok
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
   * 撤销TikTok授权
   * @param accountId 账号ID
   * @returns 撤销结果
   */
  async revokeAuthorization(accountId: string): Promise<boolean> {
    try {
      const accessToken = await this.getUserAccessToken(accountId);
      if (!accessToken) {
        return true; // 已经没有授权了
      }

      // 撤销TikTok令牌
      const params = new URLSearchParams({
        access_token: accessToken,
        client_key: this.clientId,
        client_secret: this.clientSecret
      });

      await firstValueFrom(
        this.httpService.post(`${this.revokeUrl}`, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );

      // 删除Redis中的令牌
      await this.redisService.del(`tiktok:accessToken:${accountId}`);

      // 更新数据库记录状态
      await this.accountTokenModel.updateOne(
        { accountId: accountId, platform: TokenPlatform.TIKTOK },
        { status: TokenStatus.DISABLE, updateTime: new Date() }
      );

      await this.accountModel.updateOne(
        { uid: accountId, type: AccountType.TIKTOK },
        { status: AccountStatus.DISABLE, updateTime: new Date() }
      );

      return true;
    } catch (error) {
      this.logger.error('撤销TikTok授权失败:', error);
      return false;
    }
  }
}
