import * as fs from 'node:fs'
import { Injectable, Logger } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import axios from 'axios'
import FormData from 'form-data'
import * as _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentTimestamp } from '../../../common'
import { config } from '../../../config'
import { AccountService } from '../../../core/account/account.service'
import { WebhookDto } from '../../../core/plat/pinterest/dto/pinterest.dto'
import {
  AuthInfo,
  CreateBoardBody,
  CreatePinBody,
  ILoginStatus,
} from '../../../libs/pinterest/common'
import { PinterestApiService } from '../../../libs/pinterest/pinterestApi.service'
import { AccountStatus, AccountType, NewAccount } from '../../../transports/account/common'

@Injectable()
export class PinterestService {
  private readonly logger = new Logger(PinterestService.name)
  private readonly redirectURL = config.pinterest.authBackHost
  private readonly client_id = config.pinterest.id

  constructor(
    private readonly pinterestApiService: PinterestApiService,
    private readonly redisService: RedisService,
    private readonly accountService: AccountService,
  ) {}

  /**
   * 创建board
   * @param body
   * @returns
   */
  async createBoard(body: CreateBoardBody) {
    this.logger.log(JSON.stringify(body))
    const accountId: string = _.get(body, 'accountId') || ''
    _.unset(body, 'accountId')
    const headers = await this.getAccessToken(accountId)
    this.logger.log(JSON.stringify(body))
    return this.pinterestApiService.createBoard(body, headers)
  }

  /**
   * 获取board列表信息
   * @returns
   */
  async getBoardList(accountId: string) {
    const headers = await this.getAccessToken(accountId)
    this.logger.log(JSON.stringify(headers))
    return this.pinterestApiService.getBoardList(headers)
  }

  /**
   * 获取board信息
   * @param id board id
   * @param accountId
   * @returns
   */
  async getBoardById(id: string, accountId: string) {
    const headers = await this.getAccessToken(accountId)
    return this.pinterestApiService.getBoardById(id, headers)
  }

  /**
   * 删除board信息
   * @param id board id
   * @param accountId
   * @returns
   */
  async delBoardById(id: string, accountId: string) {
    const headers = await this.getAccessToken(accountId)
    return this.pinterestApiService.delBoardById(id, headers)
  }

  /**
   * 创建pin
   * @param body
   * @returns
   */
  async createPin(body: CreatePinBody) {
    this.logger.log('--createPin--', JSON.stringify(body))
    const accountId: string = _.get(body, 'accountId') || ''
    _.unset(body, 'accountId')
    const headers = await this.getAccessToken(accountId)
    if (_.isEmpty(headers))
      throw new AppException(100011, 'The authorization has expired.')
    const data = await this.pinterestApiService.createPin(body, headers)
    return { code: 0, data }
  }

  /**
   * 获取pin信息
   * @param id pin id
   * @param accountId
   * @returns
   */
  async getPinById(id: string, accountId: string) {
    const headers = await this.getAccessToken(accountId)
    return this.pinterestApiService.getPinById(id, headers)
  }

  /**
   * 获取pin列表信息
   * @param accountId 签名
   * @returns
   */
  async getPinList(accountId: string) {
    const headers = await this.getAccessToken(accountId)
    return this.pinterestApiService.getPinList(headers)
  }

  /**
   * 删除pin
   * @param id pin id
   * @param accountId
   * @returns
   */
  async delPinById(id: string, accountId: string) {
    this.logger.log(`--delPinById--${id},  ${accountId}`)
    const headers = await this.getAccessToken(accountId)
    const data = await this.pinterestApiService.delPinById(id, headers)
    return { code: 0, data }
  }

  /**
   * 获取授权地址
   * @param userId userId
   * @returns
   */
  async getAuth(userId: string, spaceId = '') {
    const taskId = uuidv4().replace(/-/g, '')
    const redisKeyByTaskId = this.getAuthDataCacheKey(taskId)
    const scope
      = 'scope=boards:read,boards:write,pins:write,pins:read,catalogs:read,catalogs:write,pins:write_secret,pins:read_secret,user_accounts:read'
    const path = `response_type=code&redirect_uri=${this.redirectURL}&client_id=${this.client_id}&${scope}&state=${taskId}`
    const uri = `https://www.pinterest.com/oauth/?${path}`
    const tokenInfo = { taskId, userId, status: ILoginStatus.wait, spaceId }
    await this.redisService.setJson(redisKeyByTaskId, tokenInfo, 60 * 5)
    return { taskId, userId, status: ILoginStatus.wait, uri }
  }

  async authWebhook(data: WebhookDto) {
    const { code, state } = data
    try {
      const result = await this.pinterestApiService.authWebhook(code)
      const { access_token, expires_in, refresh_token_expires_in } = result
      const userInfo
        = await this.pinterestApiService.getAccountInfo(access_token)
      // 获取到token后第一时间创建account信息
      const redisKeyByTaskId = this.getAuthDataCacheKey(state)
      const redisCache: any
        = await this.redisService.getJson<AuthInfo>(redisKeyByTaskId)
      const { userId } = redisCache
      // 创建本平台的平台账号
      const newData = new NewAccount({
        userId,
        type: AccountType.PINTEREST,
        uid: userInfo.id,
        avatar: userInfo.profile_image,
        nickname: userInfo.username,
        account: userInfo.id,
        groupId: redisCache.spaceId,
        status: AccountStatus.NORMAL,
      })
      this.logger.log('NewAccount-data', JSON.stringify(newData))
      const accountInfo = await this.accountService.createAccount(
        userId,
        {
          type: AccountType.PINTEREST,
          uid: userInfo.id,
        },
        newData,
      )
      if (!accountInfo) {
        return {
          status: 0,
          message: '添加账号失败',
        }
      }
      const accessTokenExpiresIn = expires_in - 60 * 10 + getCurrentTimestamp()
      const refreshTokenExpiresIn = refresh_token_expires_in + getCurrentTimestamp()
      const tokenInfo = {
        userInfo,
        result,
        taskId: state,
        access_token,
        code,
        accountId: accountInfo.id,
        expires_in: accessTokenExpiresIn,
        refresh_token_expires_in: refreshTokenExpiresIn,
        status: ILoginStatus.success,
        userId,
      }
      await this.redisService.setJson(
        this.getAccessTokenKey(accountInfo.id),
        tokenInfo,
      )
      // 更新任务信息
      const authDataCache = { taskId: state, status: ILoginStatus.success }
      await this.redisService.setJson(redisKeyByTaskId, authDataCache, 5 * 60)
      return {
        status: 1,
        message: '授权成功',
        accountId: accountInfo.id,
      }
    }
    catch (error) {
      this.logger.error('----- pinterest Error authWebhook: ----', error.message)
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
    const tokenInfo: AuthInfo | null
      = await this.redisService.getJson<AuthInfo>(redisKeyByTaskId)
    if (_.isEmpty(tokenInfo))
      return { taskId, status: ILoginStatus.expired }
    const { status } = tokenInfo
    return { taskId, status }
  }

  async getAccessToken(accountId: string) {
    this.logger.log(accountId)
    const redisKey = this.getAccessTokenKey(accountId)
    const tokenInfo: AuthInfo | null
      = await this.redisService.getJson<AuthInfo>(redisKey)
    this.logger.log(accountId, '授权信息', JSON.stringify(tokenInfo))
    if (_.isEmpty(tokenInfo))
      throw new AppException(100011, 'The authorization has expired.')
    const { access_token, expires_in, refresh_token_expires_in } = tokenInfo
    if (_.isEmpty(access_token) && _.isEmpty(refresh_token_expires_in))
      throw new AppException(100011, 'The authorization has expired.')
    if (refresh_token_expires_in && refresh_token_expires_in < getCurrentTimestamp())
      throw new AppException(100011, 'The authorization has expired.')
    if (expires_in && expires_in < getCurrentTimestamp()) {
      throw new AppException(100011, 'The authorization has expired.')
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    }
  }

  async uploadVideo(videoUrl: string, accountId: string) {
    // 获取视频的上传凭证
    const token = await this.getAccessToken(accountId)
    // 获取视频文件
    const remoteResponse = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'stream',
    })
    const path: any = videoUrl.split('/').pop()
    remoteResponse.data.pipe(fs.createWriteStream(path))
    // 创建文件视频流
    const formData = new FormData()
    const result: any = await this.pinterestApiService.getUploadHeaders(token)
    const { upload_parameters: headers, upload_url, media_id } = result
    // 添加文件流
    _.mapKeys(headers, (v, k) => {
      formData.append(k, v)
    })
    formData.append('file', fs.createReadStream(path))
    await this.pinterestApiService.uploadVideo(upload_url, formData)
    fs.unlinkSync(path)
    return {
      data: { media_id },
      code: 0,
    }
  }

  async getUserStat(accountId: string) {
    this.logger.log(accountId)
    const redisKey = this.getAccessTokenKey(accountId)
    const tokenInfo: AuthInfo | null
      = await this.redisService.getJson<AuthInfo>(redisKey)
    this.logger.log(accountId, '授权信息', JSON.stringify(tokenInfo))
    if (_.isEmpty(tokenInfo))
      throw new AppException(100011, 'The authorization has expired.')
    const { access_token } = tokenInfo
    if (_.isEmpty(access_token))
      throw new AppException(100011, 'The authorization has expired.')
    return tokenInfo
  }

  /**
   * 获取当前授权账号的用户信息
   * 复用 getUserStat 校验与获取 token，避免重复代码
   */
  async getUserInfo(accountId: string) {
    try {
      const tokenInfo = await this.getUserStat(accountId)
      const { access_token } = tokenInfo as any
      const userInfo = await this.pinterestApiService.getAccountInfo(access_token)
      return userInfo
    }
    catch (error) {
      this.logger.error('----- pinterest Error getUserInfo: ----', (error as any)?.message)
      throw new AppException(100011, 'The authorization has expired.')
    }
  }

  async getAccessTokenStatus(accountId: string) {
    const redisKey = this.getAccessTokenKey(accountId)
    const tokenInfo: AuthInfo | null
      = await this.redisService.getJson<AuthInfo>(redisKey)
    if (_.isEmpty(tokenInfo))
      return 0
    if (!tokenInfo.expires_in)
      return 0
    return tokenInfo.expires_in > getCurrentTimestamp() ? 1 : 0
  }
}
