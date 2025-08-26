import { AccountService } from '@core/account/account.service';
import { WebhookDto } from '@core/plat/pinterest/dto/pinterest.dto';
import { Injectable, Logger } from '@nestjs/common';
import { AccountType, NewAccount } from '@transports/account/common';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { AppException } from '@/common';
import { config } from '@/config';
import { RedisService } from '@/libs';
import {
  AuthInfo,
  CreateBoardBody,
  CreatePinBody,
  ILoginStatus,
} from '@/libs/pinterest/common';
import { PinterestApiService } from '@/libs/pinterest/pinterestApi.service';

@Injectable()
export class PinterestService {
  private authBackHost = '';
  private pinterest_client_id = '';
  private authorization = '';

  constructor(
    private readonly pinterestApiService: PinterestApiService,
    private readonly redisService: RedisService,
    private readonly accountService: AccountService,
  ) {
    this.authBackHost = config.pinterest.authBackHost;
    this.pinterest_client_id = config.pinterest.id;
    this.authorization = config.pinterest.test_authorization;
  }

  /**
   * 创建board
   * @param body
   * @returns
   */
  async createBoard(body: CreateBoardBody) {
    Logger.log(JSON.stringify(body))
    const accountId: string = _.get(body, 'accountId') || ''
    _.unset(body, 'accountId')
    const headers = await this.getAccessToken(accountId)
    Logger.log(JSON.stringify(body))
    return this.pinterestApiService.createBoard(body, headers);
  }

  /**
   * 获取board列表信息
   * @returns
   */
  async getBoardList(accountId: string) {
    const headers = await this.getAccessToken(accountId)
    Logger.log(JSON.stringify(headers))
    return this.pinterestApiService.getBoardList(headers);
  }

  /**
   * 获取board信息
   * @param id board id
   * @param accountId
   * @returns
   */
  async getBoardById(id: string, accountId: string) {
    const headers = await this.getAccessToken(accountId)
    return this.pinterestApiService.getBoardById(id, headers);
  }

  /**
   * 删除board信息
   * @param id board id
   * @param accountId
   * @returns
   */
  async delBoardById(id: string, accountId: string) {
    const headers = await this.getAccessToken(accountId)
    return this.pinterestApiService.delBoardById(id, headers);
  }

  /**
   * 创建pin
   * @param body
   * @returns
   */
  async createPin(body: CreatePinBody) {
    const accountId: string = _.get(body, 'accountId') || ''
    _.unset(body, 'accountId')
    const headers = await this.getAccessToken(accountId)
    if (_.isEmpty(headers))
      throw new AppException(100011, '授权已过期');
    return this.pinterestApiService.createPin(body, headers);
  }

  /**
   * 获取pin信息
   * @param id pin id
   * @param accountId
   * @returns
   */
  async getPinById(id: string, accountId: string) {
    const headers = await this.getAccessToken(accountId)
    return this.pinterestApiService.getPinById(id, headers);
  }

  /**
   * 获取pin列表信息
   * @param accountId 签名
   * @returns
   */
  async getPinList(accountId: string) {
    const headers = await this.getAccessToken(accountId)
    return this.pinterestApiService.getPinList(headers);
  }

  /**
   * 删除pin
   * @param id pin id
   * @param accountId
   * @returns
   */
  async delPinById(id: string, accountId: string) {
    const headers = await this.getAccessToken(accountId)
    return this.pinterestApiService.delPinById(id, headers);
  }

  /**
   * 获取授权地址
   * @param userId userId
   * @returns
   */
  async getAuth(userId: string) {
    const taskId = uuidv4().replace(/-/g, '')
    const redisKeyByTaskId = this.getAuthDataCacheKey(taskId)
    const scope = 'scope=boards:read,boards:write,pins:write,pins:read,catalogs:read,catalogs:write,pins:write_secret,pins:read_secret,user_accounts:read'
    const path = `response_type=code&redirect_uri=${this.authBackHost}&client_id=${this.pinterest_client_id}&${scope}&state=${taskId}`;
    const uri = `https://www.pinterest.com/oauth/?${path}`;
    const tokenInfo = { taskId, userId, status: ILoginStatus.wait }
    await this.redisService.setKey(
      redisKeyByTaskId,
      tokenInfo,
      60 * 5,
    )
    return { taskId, userId, status: ILoginStatus.wait, uri };
  }

  async authWebhook(data: WebhookDto) {
    const { code, state } = data
    try {
      const result = await this.pinterestApiService.authWebhook(code)
      const { access_token, expires_in } = result
      const userInfo = await this.pinterestApiService.getAccountInfo(access_token)
      // 获取到token后第一时间创建account信息
      const redisKeyByTaskId = this.getAuthDataCacheKey(state)
      const redisCache: any = await this.redisService.get<AuthInfo>(redisKeyByTaskId)
      const { userId } = redisCache
      // 创建本平台的平台账号
      // Todo: need confirm the reason for using userId.slice(0, -2)
      const uid = userInfo.id.slice(0, -2);
      Logger.log('redisCache-userId', userId, uid)
      const newData = new NewAccount({
        userId,
        type: AccountType.PINTEREST,
        uid,
        avatar: userInfo.profile_image,
        nickname: userInfo.username,
        account: uid,
      })
      Logger.log('NewAccount-data', JSON.stringify(newData))
      const accountInfo = await this.accountService.createAccount(
        {
          userId,
          type: AccountType.PINTEREST,
          uid: code,
        },
        newData,
      )
      if (!accountInfo) {
        return {
          status: 0,
          message: '添加账号失败',
        }
      }
      const expires = expires_in + 60 * 10
      const tokenInfo = { userInfo, result, taskId: state, access_token, code, accountId: accountInfo.id, expires_in, status: ILoginStatus.success }
      await this.redisService.setKey(
        this.getAccessTokenKey(accountInfo.id),
        tokenInfo,
        expires,
      )
      // 更新任务信息
      const authDataCache = { taskId: state, status: ILoginStatus.success }
      await this.redisService.setKey(redisKeyByTaskId, authDataCache, 5 * 60)
      return {
        status: 1,
        message: '授权成功',
        accountId: accountInfo.id,
      }
    }
    catch (error) {
      Logger.error('----- pinterest Error authWebhook: ----', error.message);
      return {
        status: 0,
        message: `获取授权失败: ${error.message}`,
      }
    }
  }

  private getAuthDataCacheKey(taskId: string) {
    return `channel:pinterest:authTask:${taskId}`
  }

  private getAccessTokenKey(id: string) {
    return `pinterest:accessToken:${id}`
  }

  /**
   * 查询授权状态
   * @param taskId taskId
   * @returns
   */
  async checkAuth(taskId: string) {
    const redisKeyByTaskId = this.getAuthDataCacheKey(taskId)
    const tokenInfo: AuthInfo | null = await this.redisService.get<AuthInfo>(redisKeyByTaskId)
    if (_.isEmpty(tokenInfo))
      return { taskId, status: ILoginStatus.expired }
    const { status } = tokenInfo
    return { taskId, status }
  }

  async getAccessToken(accountId: string) {
    Logger.log(accountId)
    const redisKey = this.getAccessTokenKey(accountId)
    const tokenInfo: AuthInfo | null = await this.redisService.get<AuthInfo>(redisKey)
    if (_.isEmpty(tokenInfo))
      throw new AppException(100011, '授权已过期');
    const { access_token } = tokenInfo
    if (_.isEmpty(access_token))
      throw new AppException(100011, '授权已过期');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    }
  }
}
