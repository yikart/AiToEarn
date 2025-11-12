/* eslint-disable antfu/consistent-list-newline */
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountStatus, AccountType, NewAccount } from '@yikart/aitoearn-server-client'
import { RedisService } from '@yikart/redis'
import { Model } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentTimestamp } from '../../../common'
import { AccountService } from '../../../core/account/account.service'
import { BilibiliAuthInfo } from '../../../core/plat/bilibili/common'
import { AuthTaskInfo } from '../../../core/plat/common'
import { OAuth2Credential } from '../../../libs/database/schema/oauth2Credential.schema'
import { KwaiOAuthCredentialsResponse, KwaiVideoPubParams } from '../../../libs/kwai/kwaiApi.interfaces'
import { KwaiApiService } from '../../../libs/kwai/kwaiApi.service'
import { KWAI_TIME_CONSTANTS } from './constants'

@Injectable()
export class KwaiService {
  private readonly platform = AccountType.KWAI
  private readonly logger = new Logger(KwaiService.name)
  constructor(
    private readonly kwaiApiService: KwaiApiService,
    private readonly redisService: RedisService,
    private readonly accountService: AccountService,
    @InjectModel(OAuth2Credential.name)
    private OAuth2CredentialModel: Model<OAuth2Credential>,
  ) { }

  private async getOAuth2Credential(accountId: string): Promise<KwaiOAuthCredentialsResponse | null> {
    let credential = await this.redisService.getJson<KwaiOAuthCredentialsResponse>(
      `${this.platform.toLowerCase()}:accessToken:${accountId}`,
    )
    if (!credential) {
      const oauth2Credential = await this.OAuth2CredentialModel.findOne(
        {
          accountId,
          platform: this.platform,
        })
      if (!oauth2Credential) {
        return null
      }
      credential = {
        result: 0,
        access_token: oauth2Credential.accessToken,
        refresh_token: oauth2Credential.refreshToken,
        expires_in: oauth2Credential.accessTokenExpiresAt,
        refresh_token_expires_in: oauth2Credential.refreshTokenExpiresAt || 0,
        scopes: [],
        open_id: '',
      }
    }
    return credential
  }

  // 设置 AccessToken
  async setAccountTokenInfo(
    key: string,
    accountTokenInfo: KwaiOAuthCredentialsResponse,
  ) {
    const expiredAt = accountTokenInfo.refresh_token_expires_in
    accountTokenInfo.refresh_token_expires_in
      = getCurrentTimestamp() + accountTokenInfo.refresh_token_expires_in - KWAI_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    accountTokenInfo.expires_in
      = getCurrentTimestamp() + accountTokenInfo.expires_in - KWAI_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN

    return await this.redisService.setJson(key, accountTokenInfo, expiredAt)
  }

  /**
   * 获取AccessToken并且刷新Token
   * @param accountId
   */
  async getAccessTokenAndRefresh(accountId: string) {
    const accessTokenInfo = await this.getOAuth2Credential(accountId)
    if (!accessTokenInfo)
      return null

    // 判断 refresh_token 是否过期
    const isRefreshTokenExpired
      = getCurrentTimestamp() >= accessTokenInfo.refresh_token_expires_in
    if (isRefreshTokenExpired) {
      this.logger.warn(`Kwai account ${accountId} refresh_token is expired, expired at: ${accessTokenInfo.refresh_token_expires_in}`)
      return null
    }

    // 判断 access_token 是否过期
    const isAccessTokenExpired = getCurrentTimestamp() >= accessTokenInfo.expires_in
    if (!isAccessTokenExpired)
      return accessTokenInfo.access_token

    // 刷新 accountToken
    const newAccountToken = await this.kwaiApiService.refreshToken(
      accessTokenInfo.refresh_token,
    )
    if (!newAccountToken) {
      this.logger.warn(`Kwai account ${accountId} access_token refresh failed`)
      return null
    }

    const success = await this.saveOAuthCredential(accountId, newAccountToken)
    if (!success) {
      this.logger.error(`Kwai account ${accountId} access_token save to redis failed`)
      return null
    }
    return newAccountToken.access_token
  }

  private getAuthDataCacheKey(taskId: string) {
    return `channel:kwai:authTask:${taskId}`
  }

  /**
   * 创建用户授权任务
   * @returns
   * @param data
   * @param options
   */
  async createAuthTask(
    data: {
      userId: string
      type: 'h5' | 'pc'
      spaceId: string
    },
    options?: {
      transpond?: string
      accountAddPath?: string
    },
  ) {
    const taskId = uuidv4()
    const urlInfo = this.kwaiApiService.getAuthPage(taskId, data.type)
    const rRes = await this.redisService.setJson(
      this.getAuthDataCacheKey(taskId),
      {
        taskId,
        spaceId: data.spaceId,
        transpond: options?.transpond,
        accountAddPath: options?.accountAddPath,
        data: {
          state: '',
          userId: data.userId,
        },
        status: 0,
      },
      60 * 5,
    )

    return rRes
      ? {
          url: urlInfo,
          taskId,
        }
      : null
  }

  async createAccountAndSetAccessToken(taskId: string, data: { code: string, state: string }) {
    const cacheKey = this.getAuthDataCacheKey(taskId)
    const { code } = data
    const taskInfo = await this.redisService.getJson<AuthTaskInfo<BilibiliAuthInfo>>(
      cacheKey,
    )
    if (!taskInfo || taskInfo.status !== 0 || !taskInfo.data)
      return { status: 0, message: '任务不存在或已完成' }

    // 延长授权时间
    void this.redisService.expire(cacheKey, 60 * 3)

    try {
      const account = await this.addKwaiAccount(code, taskInfo.data.userId, taskInfo.spaceId)
      if (account) {
        // 更新任务信息
        taskInfo.status = 1
        taskInfo.data['accountId'] = account.id
        await this.redisService.setJson(
          cacheKey,
          taskInfo,
          60 * 3,
        )
        return { status: 1, message: '添加账号成功', accountId: account.id }
      }
      else {
        return { status: 0, message: '添加账号失败' }
      }
    }
    catch (error) {
      this.logger.error('createAccountAndSetAccessToken error:', error)
      return { status: 0, message: `添加账号失败: ${error.message}` }
    }
  }

  async getAuthInfo(taskId: string) {
    return await this.redisService.getJson<{
      state: string
      status: number
      accountId?: string
    }>(this.getAuthDataCacheKey(taskId))
  }

  private async saveOAuthCredential(accountId: string, accessTokenInfo: KwaiOAuthCredentialsResponse) {
    accessTokenInfo.expires_in = accessTokenInfo.expires_in + getCurrentTimestamp() - KWAI_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    accessTokenInfo.refresh_token_expires_in = accessTokenInfo.refresh_token_expires_in + getCurrentTimestamp() - KWAI_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    const cached = await this.redisService.setJson(
      `${this.platform.toLowerCase()}:accessToken:${accountId}`,
      accessTokenInfo,
    )
    const persistResult = await this.OAuth2CredentialModel.updateOne({
      accountId,
      platform: this.platform,
    }, {
      accessToken: accessTokenInfo.access_token,
      refreshToken: accessTokenInfo.refresh_token,
      accessTokenExpiresAt: accessTokenInfo.expires_in,
      refreshTokenExpiresAt: accessTokenInfo.refresh_token_expires_in,
    }, {
      upsert: true,
    })
    const saved = cached && (persistResult.modifiedCount > 0 || persistResult.upsertedCount > 0)
    return saved
  }

  // 根据code添加快手账户
  async addKwaiAccount(code: string, userId: string, spaceId = '') {
    this.logger.log(code, userId)
    // 获取快手token
    const accountTokenInfo
      = await this.kwaiApiService.getLoginAccountToken(code)
    if (!accountTokenInfo)
      throw new Error('获取快手token失败')

    // 获取快手用户信息
    const kwaiUserInfo = await this.kwaiApiService.getAccountInfo(accountTokenInfo.access_token)
    if (!kwaiUserInfo)
      throw new Error('快手用户信息获取失败')

    // 创建本平台的平台账号
    const newData = new NewAccount({
      userId,
      type: AccountType.KWAI,
      uid: accountTokenInfo.open_id,
      account: accountTokenInfo.open_id,
      avatar: kwaiUserInfo.bigHead,
      nickname: kwaiUserInfo.name,
      status: AccountStatus.NORMAL,
      groupId: spaceId,
    })

    const accountInfo = await this.accountService.createAccount(
      userId,
      {
        type: AccountType.KWAI,
        uid: accountTokenInfo.open_id,
      },
      newData,
    )
    if (!accountInfo)
      throw new Error('添加账号失败')

    const res = await this.saveOAuthCredential(accountInfo.id, accountTokenInfo)

    if (!res)
      throw new Error('设置redis失败')

    return accountInfo
  }

  // 视频发布
  async publishVideo(accountId: string, pubParams: KwaiVideoPubParams) {
    const accountToken = await this.getAccessTokenAndRefresh(accountId)
    if (accountToken === null) {
      this.logger.warn(`Kwai account ${accountId} access_token is expired or invalid`)
      throw new Error('kwai account access_token is expired or invalid')
    }
    return await this.kwaiApiService.publishVideo(accountToken, pubParams)
  }

  // 获取用户公开信息
  async getAuthorInfo(accountId: string) {
    const accountToken = await this.getAccessTokenAndRefresh(accountId)
    if (accountToken === null) {
      this.logger.warn(`Kwai account ${accountId} access_token is expired or invalid`)
      throw new Error('kwai account access_token is expired or invalid')
    }
    return await this.kwaiApiService.getAccountInfo(accountToken)
  }

  // 获取视频列表
  async fetchVideoList(accountId: string, cursor?: string, count?: number) {
    const accountToken = await this.getAccessTokenAndRefresh(accountId)
    if (accountToken === null) {
      this.logger.warn(`Kwai account ${accountId} access_token is expired or invalid`)
      throw new Error('kwai account access_token is expired or invalid')
    }
    return await this.kwaiApiService.fetchVideoList(accountToken, cursor, count)
  }

  async getAccessTokenStatus(accountId: string) {
    const tokenInfo = await this.getOAuth2Credential(accountId)
    if (!tokenInfo)
      return 0
    return tokenInfo.refresh_token_expires_in > getCurrentTimestamp() ? 1 : 0
  }

  async deleteVideo(accountId: string, videoId: string) {
    const accountToken = await this.getAccessTokenAndRefresh(accountId)
    if (accountToken === null) {
      this.logger.warn(`Kwai account ${accountId} access_token is expired or invalid`)
      throw new Error('kwai account access_token is expired or invalid')
    }
    return await this.kwaiApiService.deleteVideo(accountToken, videoId)
  }
}
