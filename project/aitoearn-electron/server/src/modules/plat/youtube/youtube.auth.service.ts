/*
 * @Author: nevin
 * @Date: 2025-05-27 14:48:12
 * @LastEditTime: 2025-05-27 14:48:12
 * @LastEditors: nevin
 * @Description: YouTube授权服务
 */
import { Injectable, Inject, forwardRef  } from '@nestjs/common';
import { GoogleService } from '../google/google.service';
import { google } from 'googleapis';
import { AccessToken } from './comment';
import { getRandomString } from 'src/util';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/db/schema/user.schema';
import { Account, AccountType, AccountStatus } from 'src/db/schema/account.schema';
import { AccountToken, TokenPlatform, TokenStatus } from 'src/db/schema/accountToken.schema';
import { RedisService } from 'src/lib/redis/redis.service';
import { AuthService } from 'src/auth/auth.service';
import { getCurrentTimestamp } from 'src/util/time.util';
import { YouTubeAuthTokens } from './dto/youtube.dto'
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { IdService } from 'src/db/id.service';
import { AccountService } from 'src/modules/account/account.service';


@Injectable()
export class YouTubeAuthService {

  private webClientSecret: string;
  private webClientId: string;
  private webRenderBaseUrl: string;

  constructor(
    private configService: ConfigService,
    private readonly idService: IdService,

    @Inject(forwardRef(() => GoogleService))
    private readonly googleService: GoogleService,
    private readonly redisService: RedisService,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Account.name)
    private accountModel: Model<Account>,
    private readonly AuthService: AuthService,
    @InjectModel(AccountToken.name)
    private AccountTokenModel: Model<AccountToken>,
    private readonly accountService: AccountService,
  ) {
    this.initGoogleSecrets();
  }

  private async initGoogleSecrets() {
    this.webClientSecret = this.configService.get<string>("GOOGLE_CONFIG.WEB_CLIENT_SECRET");
    this.webClientId = this.configService.get<string>("GOOGLE_CONFIG.WEB_CLIENT_ID");
    this.webRenderBaseUrl = this.configService.get<string>("GOOGLE_CONFIG.WEB_RENDER_URL");
  }

  private async getId() {
    return this.idService.createId('accountId', 100000000, 1);
  }

  /**
   * 初始化YouTube API客户端
   * @param accessToken 访问令牌
   * @returns YouTube API客户端
   */
  initializeYouTubeClient(accessToken: string): any {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.youtube({ version: 'v3', auth });
  }

  /**
   * 获取YouTube授权URL
   * @param mail 用户邮箱
   * @returns 授权URL
   */
  async getAuthorizationUrl(mail: string, userId: string): Promise<object> {
    try {
      const state = getRandomString(8);
      this.redisService.setKey(`youtube:state:${userId}:${state}`, { mail }, 60 * 10);

      // 指定YouTube特定的scope
      const youtubeScopes = [
        "https://www.googleapis.com/auth/youtube.force-ssl",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/userinfo.profile"
      ];

      const stateData = {
        originalState: state, // 保留原始state值
        userId: userId,    // 添加token
        email: mail
      };

      // 将状态数据转换为JSON字符串并编码
      const encodedState = encodeURIComponent(JSON.stringify(stateData));

      const params = new URLSearchParams({
        scope: youtubeScopes.join(" "),
        access_type: "offline",
        include_granted_scopes: "true",
        response_type: "code",
        state: encodedState,
        redirect_uri: `${this.webRenderBaseUrl}/api/plat/youtube/auth/callback`,
        client_id: this.webClientId,
        prompt: "consent",  // 强制要求用户确认授权，以便我们能够获取refresh_token
        // login_hint: userId,
      });

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.search = params.toString();

      return {url: authUrl.toString()};
    } catch (error) {
      console.error('Error generating auth URL:', error);
      throw new Error('无法生成授权URL');
    }
  }

  /**
   * 获取用户的YouTube访问令牌
   * @param accountId 账号ID
   * @returns 访问令牌
   */
  async getUserAccessToken(accountId: string): Promise<string> {
    console.log("accountId:--", accountId);
    const accountTokenInfo = await this.AccountTokenModel.findOne({accountId: accountId});

    // if (!res) return '';

    // // 剩余时间
    // const overTime = res.expires_in;

    // if (overTime < 60 * 60 && overTime > 0) {
    //   // 刷新token
    //   this.refreshAccessToken(userId, res.refresh_token);
// }
    // const accountTokenInfo = await this.AccountTokenModel.findOne({accountId: accountId});
    await this.refreshAccessToken(accountTokenInfo.userId, accountTokenInfo.accountId, accountTokenInfo.refreshToken);

    const res: AccessToken = await this.redisService.get(
      `youtube:accessToken:${accountId}`,
    );
    return res.access_token;
  }

  /**
   * 刷新用户的YouTube访问令牌
   * @param accountId 账号ID
   * @returns 新的系统令牌
   */
  async refreshAccessToken(userId: string, accountId: string, refreshToken: string): Promise<object> {
    try {
    const userInfo = await this.userModel.findOne({_id: userId});
      // if(!refreshToken) {

      //   console.log("=============userInfo====================");
      //   console.log(userInfo)
      //   refreshToken = userInfo?.googleAccount?.refreshToken ?? ''
      // }

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
        `youtube:accessToken:${accountId}`,
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

      const returnRes = {url: systemToken};
      return returnRes;
      // 返回新的 access token 和其他信息
      // return response.data;  // 包含新的 access_token、expires_in、token_type 等信息
    } catch (err) {
      console.log('Error while refreshing access token', err);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * 验证并保存授权码
   * @param code 授权码
   * @param state 状态码
   * @returns 系统令牌
   */
  async handleAuthorizationCode(code: string, state: string, userId: string) {
    try {
      // 获取state关联的邮箱信息
      const stateInfo = await this.redisService.get(`youtube:state:${userId}:${state}`);
      if (!stateInfo || !stateInfo.mail) {
        throw new Error('无效的状态码');
      }

      // 使用授权码获取访问令牌和刷新令牌
      const params = new URLSearchParams({
        code: code,
        redirect_uri: `${this.webRenderBaseUrl}/api/plat/youtube/auth/callback`,
        client_id: this.webClientId,
        grant_type: "authorization_code",
        client_secret: this.webClientSecret,
      });

      const response = await axios.post('https://oauth2.googleapis.com/token', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, refresh_token, expires_in, id_token } = response.data;

      // 验证ID令牌以获取用户信息
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token });

      const ticket = await oauth2Client.verifyIdToken({
        idToken: id_token,
        audience: this.webClientId
      });

      const payload = ticket.getPayload();
      const googleId = payload.sub;
      const email = payload.email;

      // 获取YouTube频道信息，用于更新账号数据库
      await this.updateYouTubeAccountInfo(userId, email, googleId, access_token, refresh_token, expires_in);

      // 缓存令牌
      await this.redisService.setKey(
        `youtube:accessToken:${googleId}`,
        {
          access_token,
          refresh_token,
          expiresAt: getCurrentTimestamp() + expires_in
        },
        expires_in
      );

      // 查询AccountToken数据库里是否存在令牌，如果存在，且上面获得refresh_token 存在，且不为空或null，则更新
      // 如果不存在，则创建
      let accountToken = await this.AccountTokenModel.findOne({
        platform: AccountType.YOUTUBE,
        accountId: googleId
      });

      if (accountToken) {
        // 更新现有令牌
        if (refresh_token && refresh_token.trim() !== '') {
          accountToken.refreshToken = refresh_token;
        }

        accountToken.expiresAt = new Date((getCurrentTimestamp() + expires_in) * 1000);
        accountToken.updateTime = new Date();
        await accountToken.save();
      } else {
        // 创建新的令牌记录
        accountToken = await this.AccountTokenModel.create({
          userId,
          platform: AccountType.YOUTUBE,
          accountId: googleId,
          refreshToken: refresh_token,
          status: TokenStatus.USABLE,
          createTime: new Date(),
          updateTime: new Date(),
          expiresAt: new Date((getCurrentTimestamp() + expires_in) * 1000)
        });
      }

      // // 返回系统令牌
      // return this.AuthService.generateToken(TokenInfo);
      const existingAccount = await this.accountModel.findOne({
        type: AccountType.YOUTUBE,
        googleId: googleId
      });

      const results = {
        data:
        {
          accountInfo: existingAccount,
          userInfo: {
            "userId": userId,
            "uid": googleId
          }
      },
      msg:"success", code: 0

      };
      console.log("最终返回", results);

      return results;

    } catch (error) {
      console.error('处理授权码失败:', error);
      throw new Error('授权失败');
    }
  }

  /**
   * 获取YouTube频道信息并更新账号数据库
   * @param userId 用户ID
   * @param googleId Google ID
   * @param accessToken 访问令牌
   * @param refreshToken 刷新令牌
   */
  private async updateYouTubeAccountInfo(
    userId: string,
    email: string,
    googleId: string,
    accessToken: string,
    refreshToken: string,
    expires_in: number
  ): Promise<void> {
    try {
      // 初始化YouTube客户端
      const youtube = this.initializeYouTubeClient(accessToken);

      const channelInfo = {
        // id: await this.getId(),
        userId: userId,
        type: AccountType.YOUTUBE,
        uid: googleId,
        googleId: googleId,
        account: "accountUrl",
        nickname: "",
        avatar: "",
        fansCount: 0,
        workCount: 0,
        likeCount: 0,  // YouTube API不直接提供此信息
        readCount: 0,
        collectCount: 0,  // YouTube API不直接提供此信息
        forwardCount: 0,  // YouTube API不直接提供此信息
        commentCount: 0,  // YouTube API不直接提供此信息
        // loginTime: new Date(),
        updateTime: new Date(),
        status: AccountStatus.USABLE,
        loginCookie: "1111", // YouTube不使用cookie认证
        token: "111", // 存储访问令牌
        // groupId: defaultGrpoupId, // 默认分组，可以根据需要调整
        // income: 0
      };

      let hasChannel = false;
      // 获取当前用户的YouTube频道信息
      const response = await youtube.channels.list({
        part: 'snippet,statistics',
        mine: true
      });

      if (!response.data.items || response.data.items.length === 0) {

        console.error("获取YouTube频道信息失败");
        hasChannel = false;
        // 如果没有频道或获取频道信息失败，则从Google用户信息获取
        if (!hasChannel) {
          console.log("无法获取YouTube频道信息，将从Google用户信息获取");
          try {
            const responseGoogle = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            const userInfoData = responseGoogle.data;

            // 使用Google用户信息更新账号数据
            channelInfo.account = userInfoData.email || googleId;
            channelInfo.nickname = userInfoData.name || '';
            channelInfo.avatar = userInfoData.picture || '';

            console.log("成功获取Google用户信息:", userInfoData);
          } catch (error) {
            console.error("获取Google用户信息失败:", error);
            // 使用基本信息，确保至少有账号名称
            channelInfo.account = googleId;
            channelInfo.nickname = "YouTube User";
          }
        }

      } else {
        hasChannel = true;
        const channel = response.data.items[0];
        // 使用频道信息更新账号数据
        channelInfo.account = channel.snippet.customUrl || channel.id;
        channelInfo.nickname = channel.snippet.title;
        channelInfo.avatar = channel.snippet.thumbnails.default.url;
        channelInfo.fansCount = parseInt(channel.statistics.subscriberCount) || 0;
        channelInfo.workCount = parseInt(channel.statistics.videoCount) || 0;
        channelInfo.readCount = parseInt(channel.statistics.viewCount) || 0;

        console.log("成功获取YouTube频道信息:", channel.snippet.title);
      }

      console.log(channelInfo);

      // 创建或更新账号
      // const account = await this.accountModel.findOneAndUpdate(
      //   { googleId: googleId, type: AccountType.YOUTUBE },
      //   channelInfo,
      //   { upsert: true, new: true }
      // );
      const account = await this.accountService.addOrUpdateAccount(channelInfo);

      console.log("成功创建或更新YouTube账号:", account);


      // 检查是否存在账号Token
      const existingToken = await this.AccountTokenModel.findOne({
        accountId: googleId,
        platform: TokenPlatform.YOUTUBE
      });

      if (existingToken) {
        // 更新现有Token
        await this.AccountTokenModel.findOneAndUpdate(
          { accountId: googleId, platform: TokenPlatform.YOUTUBE },
          { refreshToken: refreshToken, updateTime: new Date() },
        );
        console.log("成功更新YouTube账号Token");
      } else {
        // 创建新Token
        await this.AccountTokenModel.create({
          accountId: googleId,
          platform: TokenPlatform.YOUTUBE,
          refreshToken: refreshToken,
          expiresAt: new Date((getCurrentTimestamp() + expires_in) * 1000),
          status: TokenStatus.USABLE,
          createTime: new Date(),
          updateTime: new Date(),
        });
        console.log("成功创建YouTube账号Token");
      }


      // // 检查账号是否存在
      // const existingAccount = await this.accountModel.findOne({
      //   type: AccountType.YOUTUBE,
      //   googleId: googleId
      // });

      // if (existingAccount) {
      //   // 更新现有账号，保留原有的createTime
      //   channelInfo.status = existingAccount.status;
      //   channelInfo.groupId = existingAccount.groupId;
      //   channelInfo.income = existingAccount.income;

      //   // 更新账号信息
      //   await this.accountModel.findOneAndUpdate(
      //     { googleId: googleId, type: AccountType.YOUTUBE },
      //     channelInfo,
      //     { new: true }
      //   );

      //   console.log("成功更新YouTube账号信息");

      //   // 更新refresh_token
      //   await this.AccountTokenModel.findOneAndUpdate(
      //     { accountId: googleId, platform: TokenPlatform.YOUTUBE },
      //     { refreshToken: refreshToken, updateTime: new Date() },
      //   );
      //   console.log("平台：", TokenPlatform.YOUTUBE);

        // const updateInfo = {
        //   nickname: channel.snippet.title,
        //   avatar: channel.snippet.thumbnails.default.url,
        //   fansCount: channel.statistics.subscriberCount || 0,
        //   workCount: channel.statistics.videoCount || 0,
        //   // likeCount: 0,  // YouTube API不直接提供此信息
        //   readCount: channel.statistics.viewCount || 0,
        //   // collectCount: 0,  // YouTube API不直接提供此信息
        //   // forwardCount: 0,  // YouTube API不直接提供此信息
        //   // commentCount: 0,  // YouTube API不直接提供此信息
        //   // loginTime: new Date(),
        //   updateTime: new Date(),
        //   status: AccountStatus.USABLE,
        //   // loginCookie: '', // YouTube不使用cookie认证
        //   // token: "", // 存储访问令牌
        //   // groupId: 1, // 默认分组，可以根据需要调整
        //   // income: 0
        // }

        // await this.accountModel.updateOne(
        //   { _id: existingAccount._id },
        //   { $set: updateInfo }
        // );
        // console.log(`已更新YouTube账号: ${updateInfo.nickname}`);


      // } else {
      //   // 获取当前最大ID
      //   const maxIdAccount = await this.accountModel.findOne({}, { id: 1 }).sort({ id: -1 });
      //   const nextId = maxIdAccount ? maxIdAccount.id + 1 : 1;

      //   // 创建新账号
      //   await this.accountModel.create({
      //     ...channelInfo,
      //     id: nextId
      //   });
      //   console.log(`已创建新YouTube账号: ${channelInfo.nickname} (${channelInfo.uid})`);

      //   // 创建refresh_token和access_token
      //   const accountTokenInfo = {
      //     userId: userId,
      //     platform: TokenPlatform.YOUTUBE,
      //     refreshToken: refreshToken,
      //     accountId: googleId,
      //     status: TokenStatus.USABLE,
      //     createTime: new Date(),
      //     updateTime: new Date(),
      //     expiresAt: new Date((getCurrentTimestamp() + expires_in) * 1000)
      //   }
      //   await this.AccountTokenModel.create({
      //     ...accountTokenInfo
      //   });
      //   console.log(`已创建新YouTube账号Token: ${accountTokenInfo.accountId} (${accountTokenInfo.userId})`);

      // }
    } catch (error) {
      console.error('更新YouTube账号信息失败:', error);
      // 不抛出异常，避免影响授权流程
    }
  }

  /**
   * 获取初始化后的YouTube API客户端
   * @param accountId 账号id
   * @returns 初始化后的YouTube API客户端
   */
  async getYouTubeClient(accountId: string): Promise<any> {
    const accessToken = await this.getUserAccessToken(accountId);
    if (!accessToken) {
      throw new Error('No access token available, user needs to authorize');
    }

    return this.initializeYouTubeClient(accessToken);
  }

  /**
   * 检查用户是否已授权YouTube
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
   * 撤销YouTube授权
   * @param accountId 账号ID
   * @returns 撤销结果
   */
  async revokeAuthorization(accountId: string): Promise<boolean> {
    try {
      const accessToken = await this.getUserAccessToken(accountId);
      if (!accessToken) {
        return true; // 已经没有授权了
      }

      // 撤销令牌
      await this.googleService.getClient().revokeToken(accessToken);

      // 删除缓存的令牌
      await this.redisService.del(`youtube:accessToken:${accountId}`);

      // 更新用户信息，移除授权信息
      await this.AccountTokenModel.updateOne(
        { accountId: accountId },
        { $unset: { 'refreshToken': 1, 'expiresAt': 1 } }
      );

      return true;
    } catch (error) {
      console.error('Error revoking authorization:', error);
      return false;
    }
  }

  /**
   * 保存用户YouTube授权信息
   * @param userId 用户ID
   * @param tokens 授权令牌
   */
  async saveUserTokens(userId: string, tokens: YouTubeAuthTokens): Promise<void> {
    try {
      // 更新用户信息
      await this.userModel.updateOne(
        { _id: userId },
        {
          $set: {
            'googleAccount.accessToken': tokens.accessToken,
            'googleAccount.refreshToken': tokens.refreshToken,
            'googleAccount.expiresAt': tokens.expiresAt || (getCurrentTimestamp() + 3600)
          }
        }
      );

      // 缓存访问令牌
      const expiresIn = tokens.expiresAt ? tokens.expiresAt - getCurrentTimestamp() : 3600;
      await this.redisService.setKey(
        `google:accessToken:${userId}`,
        { access_token: tokens.accessToken, refresh_token: tokens.refreshToken },
        expiresIn > 0 ? expiresIn : 3600
      );
    } catch (error) {
      console.error('Error saving user tokens:', error);
      throw new Error('Failed to save user tokens');
    }
  }
}
