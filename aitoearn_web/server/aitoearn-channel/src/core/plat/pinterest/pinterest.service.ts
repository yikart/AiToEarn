import { WebhookDto } from '@core/plat/pinterest/dto/pinterest.dto';
import { Injectable, Logger } from '@nestjs/common';
import _ from 'lodash';
import { AppException } from '@/common';
import { config } from '@/config';
import { RedisService } from '@/libs';
import {
  AuthInfo,
  CreateBoardBody,
  CreatePinBody,
  ILoginStatus,
} from '@/libs/pinterest/comment';
import { PinterestApiService } from '@/libs/pinterest/pinterestApi.service';

@Injectable()
export class PinterestService {
  private authBackHost = '';
  private pinterest_client_id = '';

  constructor(private readonly pinterestApiService: PinterestApiService, private readonly redisService: RedisService) {
    this.authBackHost = config.pinterest.authBackHost;
    this.pinterest_client_id = config.pinterest.id;
  }

  /**
   * 创建board
   * @param body
   * @returns
   */
  async createBoard(body: CreateBoardBody) {
    Logger.log(JSON.stringify(body))
    const userId: string = _.get(body, 'userId') || ''
    _.unset(body, 'userId')
    const headers = await this.getAccessToken(userId)
    Logger.log(JSON.stringify(body))
    return this.pinterestApiService.createBoard(body, headers);
  }

  /**
   * 获取board列表信息
   * @returns
   */
  async getBoardList(userId: string) {
    const headers = await this.getAccessToken(userId)
    Logger.log(JSON.stringify(headers))
    return this.pinterestApiService.getBoardList(headers);
  }

  /**
   * 获取board信息
   * @param id board id
   * @param userId
   * @returns
   */
  async getBoardById(id: string, userId: string) {
    const headers = await this.getAccessToken(userId)
    return this.pinterestApiService.getBoardById(id, headers);
  }

  /**
   * 删除board信息
   * @param id board id
   * @param userId
   * @returns
   */
  async delBoardById(id: string, userId: string) {
    const headers = await this.getAccessToken(userId)
    return this.pinterestApiService.delBoardById(id, headers);
  }

  /**
   * 创建pin
   * @param body
   * @returns
   */
  async createPin(body: CreatePinBody) {
    const userId: string = _.get(body, 'userId') || ''
    _.unset(body, 'userId')
    const headers = await this.getAccessToken(userId)
    if (_.isEmpty(headers))
      throw new AppException(100011, '授权已过期');
    return this.pinterestApiService.createPin(body, headers);
  }

  /**
   * 获取pin信息
   * @param id pin id
   * @param userId
   * @returns
   */
  async getPinById(id: string, userId: string) {
    const headers = await this.getAccessToken(userId)
    return this.pinterestApiService.getPinById(id, headers);
  }

  /**
   * 获取pin列表信息
   * @param userId 签名
   * @returns
   */
  async getPinList(userId: string) {
    const headers = await this.getAccessToken(userId)
    return this.pinterestApiService.getPinList(headers);
  }

  /**
   * 删除pin
   * @param id pin id
   * @param userId
   * @returns
   */
  async delPinById(id: string, userId: string) {
    const headers = await this.getAccessToken(userId)
    return this.pinterestApiService.delPinById(id, headers);
  }

  /**
   * 获取授权地址
   * @param userId userId
   * @returns
   */
  async getAuth(userId: string) {
    const result: any = await this.redisService.get<AuthInfo>(userId)
    if (!_.isEmpty(result) && _.has(result, 'status') && _.isEqual(result.status, ILoginStatus.success))
      return { userId, status: ILoginStatus.success }
    const path = `response_type=code&redirect_uri=${this.authBackHost}&client_id=${this.pinterest_client_id}&scope=boards:read,boards:write,pins:write,pins:read,catalogs:read,catalogs:write,pins:write_secret,pins:read_secret&state=${userId}`;
    const uri = `https://www.pinterest.com/oauth/?${path}`;
    const tokenInfo = { userId, status: ILoginStatus.wait }
    await this.redisService.setKey(
      userId,
      tokenInfo,
      30,
    )
    return { userId, status: ILoginStatus.wait, uri };
  }

  async authWebhook(data: WebhookDto) {
    const { code, state } = data
    const result = await this.pinterestApiService.authWebhook(code)
    const { access_token, expires_in } = result
    const tokenInfo = { userId: state, access_token, expires_in, status: ILoginStatus.success }
    await this.redisService.setKey(state, tokenInfo, 60)
    return { code: 200 }
  }

  /**
   * 获取授权地址
   * @param userId userId
   * @returns
   */
  async checkAuth(userId: string) {
    const tokenInfo: AuthInfo | null = await this.redisService.get<AuthInfo>(userId)
    if (_.isEmpty(tokenInfo))
      return { userId, status: ILoginStatus.expired }
    const { status } = tokenInfo
    return { userId, status }
  }

  async getAccessToken(userId: string) {
    Logger.log(userId)
  }
}
