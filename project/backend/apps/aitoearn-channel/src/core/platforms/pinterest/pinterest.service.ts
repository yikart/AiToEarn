import * as fs from 'node:fs'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountStatus, AccountType, NewAccount } from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import axios from 'axios'
import FormData from 'form-data'
import * as _ from 'lodash'
import { Model } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentTimestamp } from '../../../common'
import { config } from '../../../config'
import { AccountService } from '../../../core/account/account.service'
import { WebhookDto } from '../../../core/platforms/pinterest/dto/pinterest.dto'
import { OAuth2Credential } from '../../../libs/database/schema/oauth2Credential.schema'
import {
  AuthInfo,
  CreateBoardBody,
  CreatePinBody,
  ILoginStatus,
} from '../../../libs/pinterest/common'
import { PinterestApiService } from '../../../libs/pinterest/pinterestApi.service'
import { PlatformBaseService } from '../base.service'
import { META_TIME_CONSTANTS } from '../meta/constants'
import { PlatformAuthExpiredException } from '../platform.exception'

@Injectable()
export class PinterestService extends PlatformBaseService {
  protected override readonly platform: string = AccountType.PINTEREST
  protected override readonly logger = new Logger(PinterestService.name)
  private readonly redirectURL = config.pinterest.authBackHost
  private readonly client_id = config.pinterest.id

  constructor(
    private readonly pinterestApiService: PinterestApiService,
    @Inject(RedisService)
    private readonly redisService: RedisService,
    private readonly accountService: AccountService,
    @InjectModel(OAuth2Credential.name)
    private readonly oAuth2CredentialModel: Model<OAuth2Credential>,
  ) {
    super()
  }

  private getAuthDataCacheKey(taskId: string) {
    return `channel:pinterest:authTask:${taskId}`
  }

  private getAccessTokenKey(id: string) {
    return `pinterest:accessToken:${id}`
  }

  private async saveOAuthCredential(accountId: string, tokenInfo: {
    access_token: string
    refresh_token?: string
    expires_in: number
    refresh_token_expires_in?: number
  }, rawPayload?: any): Promise<boolean> {
    const now = getCurrentTimestamp()
    const accessTokenExpiresAt = now + tokenInfo.expires_in - META_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    const refreshTokenExpiresAt = tokenInfo.refresh_token_expires_in
      ? now + tokenInfo.refresh_token_expires_in
      : undefined

    const cacheData: AuthInfo = {
      status: ILoginStatus.success,
      accountId,
      access_token: tokenInfo.access_token,
      expires_in: accessTokenExpiresAt,
      refresh_token_expires_in: refreshTokenExpiresAt,
    }
    const cached = await this.redisService.setJson(this.getAccessTokenKey(accountId), cacheData)

    const persistResult = await this.oAuth2CredentialModel.updateOne({
      accountId,
      platform: AccountType.PINTEREST,
    }, {
      accessToken: tokenInfo.access_token,
      refreshToken: tokenInfo.refresh_token || '',
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      raw: JSON.stringify(rawPayload ?? tokenInfo),
    }, { upsert: true })

    return cached && (persistResult.modifiedCount > 0 || persistResult.upsertedCount > 0)
  }

  private async getOAuth2Credential(accountId: string): Promise<AuthInfo | null> {
    let credential = await this.redisService.getJson<AuthInfo>(this.getAccessTokenKey(accountId))
    if (!credential) {
      const oauth2Credential = await this.oAuth2CredentialModel.findOne({
        accountId,
        platform: AccountType.PINTEREST,
      })
      if (!oauth2Credential) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      credential = {
        status: ILoginStatus.success,
        accountId,
        access_token: oauth2Credential.accessToken,
        expires_in: oauth2Credential.accessTokenExpiresAt,
        refresh_token_expires_in: oauth2Credential.refreshTokenExpiresAt,
      }
    }
    return credential
  }

  private async refreshOAuthCredential(refresh_token: string): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
    refresh_token_expires_in?: number
  } | null> {
    try {
      const refreshed = await this.pinterestApiService.refreshOAuthCredential(refresh_token)
      return refreshed
    }
    catch (error) {
      this.logger.error('----- pinterest Error refreshOAuthCredential: ----', (error as any)?.message)
      return null
    }
  }

  private async authorize(accountId: string): Promise<AuthInfo | null> {
    const credential = await this.getOAuth2Credential(accountId)
    const now = getCurrentTimestamp()
    if (credential.expires_in && now >= credential.expires_in) {
      // attempt refresh using DB-stored refresh token
      const dbRecord = await this.oAuth2CredentialModel.findOne({ accountId, platform: AccountType.PINTEREST })
      const refreshToken = dbRecord?.refreshToken
      if (!refreshToken || refreshToken.trim() === '') {
        this.logger.error(`No refresh token found for accountId: ${accountId}`)
        return null
      }
      const refreshed = await this.refreshOAuthCredential(refreshToken)
      if (!refreshed) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      const saved = await this.saveOAuthCredential(accountId, {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || refreshToken,
        expires_in: refreshed.expires_in,
        refresh_token_expires_in: refreshed.refresh_token_expires_in,
      }, refreshed)
      if (!saved) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      const updated = await this.getOAuth2Credential(accountId)
      return updated
    }
    return credential
  }

  /**
   * 创建board
   * @param body
   * @returns
   */
  async createBoard(body: CreateBoardBody) {
    this.logger.log(JSON.stringify(body))
    const accountId: string = _.get(body, 'accountId') || ''
    _.unset(body, 'accountId')
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    this.logger.log(JSON.stringify(body))
    return this.pinterestApiService.createBoard(body, accessToken)
  }

  /**
   * 获取board列表信息
   * @returns
   */
  async getBoardList(accountId: string) {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    return this.pinterestApiService.getBoards(accessToken)
  }

  /**
   * 获取board信息
   * @param id board id
   * @param accountId
   * @returns
   */
  async getBoardById(id: string, accountId: string) {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    return this.pinterestApiService.getBoardById(id, accessToken)
  }

  /**
   * 删除board信息
   * @param id board id
   * @param accountId
   * @returns
   */
  async delBoardById(id: string, accountId: string) {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    return this.pinterestApiService.deleteBoard(id, accessToken)
  }

  /**
   * 创建pin
   * @param body
   * @returns
   */
  async createPin(data: CreatePinBody) {
    const tokenInfo = await this.getUserStat(data.accountId)
    const accessToken = tokenInfo.access_token as string
    return await this.pinterestApiService.createPin(data, accessToken)
  }

  /**
   * 获取pin信息
   * @param id pin id
   * @param accountId
   * @returns
   */
  async getPinById(id: string, accountId: string) {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    return this.pinterestApiService.getPinById(id, accessToken)
  }

  /**
   * 获取pin列表信息
   * @param accountId 签名
   * @returns
   */
  async getPinList(accountId: string) {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    return this.pinterestApiService.getPins(accessToken)
  }

  /**
   * 删除pin
   * @param id pin id
   * @param accountId
   * @returns
   */
  override async deletePost(accountId: string, postId: string): Promise<boolean> {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    await this.pinterestApiService.deletePin(postId, accessToken)
    return true
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
      const result = await this.pinterestApiService.getOAuthCredential(code)
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
      const tokenSaved = await this.saveOAuthCredential(
        accountInfo.id,
        {
          access_token,
          refresh_token: (result as any)?.refresh_token,
          expires_in,
          refresh_token_expires_in,
        },
        result,
      )
      if (!tokenSaved) {
        this.logger.error(`Failed to save pinterest token for accountId: ${accountInfo.id}`)
        return {
          status: 0,
          message: '保存访问令牌失败',
        }
      }
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
    const credential = await this.authorize(accountId)
    if (!credential || !credential.access_token) {
      throw new AppException(ResponseCode.ChannelAuthorizationExpired)
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${credential.access_token}`,
    }
  }

  async uploadVideo(videoUrl: string, accountId: string) {
    // 获取视频的上传凭证
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
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
    const result: any = await this.pinterestApiService.getUploadHeaders(accessToken)
    const { upload_parameters: headers, upload_url, media_id } = result
    // 添加文件流
    _.mapKeys(headers, (v, k) => {
      formData.append(k, v)
    })
    formData.append('file', fs.createReadStream(path))
    await this.pinterestApiService.uploadMedia(upload_url, formData)
    fs.unlinkSync(path)
    return {
      data: { media_id },
      code: 0,
    }
  }

  async getUserStat(accountId: string) {
    const credential = await this.authorize(accountId)
    if (!credential || !credential.access_token) {
      throw new AppException(ResponseCode.ChannelAuthorizationExpired)
    }
    return credential
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
      throw new AppException(ResponseCode.ChannelAuthorizationExpired)
    }
  }

  async getAccessTokenStatus(accountId: string) {
    const tokenInfo = await this.getOAuth2Credential(accountId)
    if (_.isEmpty(tokenInfo) || !tokenInfo?.expires_in)
      return 0
    return tokenInfo.expires_in > getCurrentTimestamp() ? 1 : 0
  }
}
