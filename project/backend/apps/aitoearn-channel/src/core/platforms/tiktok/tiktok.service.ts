/* eslint-disable style/indent */
/*
 * @Author: nevin
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: nevin
 * @Description: TikTok业务服务
 */
import { randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountStatus, AccountType, NewAccount } from '@yikart/aitoearn-server-client'
import { RedisService } from '@yikart/redis'
import { Model } from 'mongoose'
import { getCurrentTimestamp } from '../../../common'
import { config } from '../../../config'
import { AccountService } from '../../../core/account/account.service'
import { OAuth2Credential } from '../../../libs/database/schema/oauth2Credential.schema'
import { TiktokPostMode, TiktokPrivacyLevel, TiktokSourceType } from '../../../libs/tiktok/tiktok.enum'
import {
  TiktokCreatorInfo,
  TikTokListVideosParams,
  TikTokListVideosResponse,
  TiktokOAuthResponse,
  TiktokPublishResponse,
  TiktokPublishStatusResponse,
  TiktokRevokeResponse,
  TikTokUserInfoResponse,
} from '../../../libs/tiktok/tiktok.interfaces'
import { TiktokService as TiktokApiService } from '../../../libs/tiktok/tiktok.service'
import { PlatformBaseService } from '../base.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { TIKTOK_DEFAULT_SCOPES, TIKTOK_TIME_CONSTANTS, TiktokRedisKeys } from './constants'
import {
  PhotoSourceInfoDto,
  PostInfoDto,
  VideoFileUploadSourceDto,
  VideoPullUrlSourceDto,
} from './dto/tiktok.dto'

export interface AuthTaskInfo {
  state: string
  userId: string
  status: 0 | 1
  accountId?: string
  spaceId?: string
}

@Injectable()
export class TiktokService extends PlatformBaseService {
  protected override readonly platform: string = AccountType.TIKTOK
  private readonly defaultScopes: string[]
  protected override readonly logger = new Logger(TiktokService.name)

  constructor(
    private readonly redisService: RedisService,
    private readonly tiktokApiService: TiktokApiService,
    private readonly accountService: AccountService,
    @InjectModel(OAuth2Credential.name)
    private OAuth2CredentialModel: Model<OAuth2Credential>,
  ) {
    super()
    this.defaultScopes = config.tiktok.scopes.length > 0
      ? config.tiktok.scopes
      : TIKTOK_DEFAULT_SCOPES
  }

  /**
   * 生成授权URL
   */
  async getAuthUrl(userId: string, scopes?: string[], spaceId = '') {
    const state = randomBytes(32).toString('hex')
    const requestedScopes = scopes || this.defaultScopes

    const authUrl = this.tiktokApiService.generateAuthUrl(requestedScopes, state)

    const success = await this.redisService.setJson(
      TiktokRedisKeys.getAuthTaskKey(state),
      { state, status: 0, userId, spaceId },
      TIKTOK_TIME_CONSTANTS.AUTH_TASK_EXPIRE,
    )

    return success ? { url: authUrl, taskId: state, state } : null
  }

  private async saveOAuthCredential(accountId: string, accessTokenInfo: TiktokOAuthResponse) {
    accessTokenInfo.expires_in = getCurrentTimestamp() + accessTokenInfo.expires_in - TIKTOK_TIME_CONSTANTS.TOKEN_EXPIRE_BUFFER
    accessTokenInfo.refresh_expires_in = getCurrentTimestamp() + accessTokenInfo.refresh_expires_in - TIKTOK_TIME_CONSTANTS.TOKEN_REFRESH_THRESHOLD
    const cached = await this.redisService.setJson(
      TiktokRedisKeys.getAccessTokenKey(accountId),
      accessTokenInfo,
    )
    const persistResult = await this.OAuth2CredentialModel.updateOne({
      accountId,
      platform: this.platform,
    }, {
      accessToken: accessTokenInfo.access_token,
      refreshToken: accessTokenInfo.refresh_token,
      accessTokenExpiresAt: accessTokenInfo.expires_in,
      refreshTokenExpiresAt: accessTokenInfo.refresh_expires_in,
    }, {
      upsert: true,
    })
    const saved = cached && (persistResult.modifiedCount > 0 || persistResult.upsertedCount > 0)
    return saved
  }

  private async getOAuth2Credential(accountId: string): Promise<TiktokOAuthResponse | null> {
    let credential = await this.redisService.getJson<TiktokOAuthResponse>(
      TiktokRedisKeys.getAccessTokenKey(accountId),
    )
    if (!credential) {
      const oauth2Credential = await this.OAuth2CredentialModel.findOne({
          accountId,
          platform: this.platform,
      })
      if (!oauth2Credential) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      credential = {
        access_token: oauth2Credential.accessToken,
        refresh_token: oauth2Credential.refreshToken,
        expires_in: oauth2Credential.accessTokenExpiresAt,
        refresh_expires_in: oauth2Credential.refreshTokenExpiresAt || 0,
        scope: '',
        token_type: '',
        open_id: '',
      }
    }
    return credential
  }

  /**
   * 获取授权任务信息
   */
  async getAuthInfo(taskId: string) {
    const result = await this.redisService.getJson<AuthTaskInfo>(
      TiktokRedisKeys.getAuthTaskKey(taskId),
    )
    if (!result) {
      this.logger.warn(`OAuth2 task not found for taskId: ${taskId}`)
      return {
        taskId,
        status: 0,
      }
    }
    return result
  }

  /**
   * 创建账号并设置访问令牌
   */
  async createAccountAndSetAccessToken(
    taskId: string,
    authData: { code: string, state: string },
  ) {
    const { code } = authData

    const authTaskInfo = await this.redisService.getJson<AuthTaskInfo>(
      TiktokRedisKeys.getAuthTaskKey(taskId),
    )
    if (!authTaskInfo) {
      return {
        status: 0,
        message: '授权任务不存在或已过期',
      }
    }

    // 延长授权任务时间
    void this.redisService.expire(
      TiktokRedisKeys.getAuthTaskKey(taskId),
      TIKTOK_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )

    // 获取访问令牌
    const accessTokenInfo = await this.tiktokApiService.getAccessToken(code)
    if (!accessTokenInfo) {
      return {
        status: 0,
        message: '获取访问令牌失败',
      }
    }
    this.logger.log(`获取访问令牌成功: ${JSON.stringify(accessTokenInfo)}`)
    // 获取TikTok用户信息
    const userInfo = await this.fetchUserInfo(
      accessTokenInfo.access_token,
    )

    this.logger.log(`TikTok user info: ${JSON.stringify(userInfo)}`)
    // 创建账号数据
    const newAccountData = new NewAccount({
      userId: authTaskInfo.userId,
      type: AccountType.TIKTOK,
      uid: accessTokenInfo.open_id,
      account: userInfo.data.user.username,
      avatar: userInfo.data.user.avatar_url,
      nickname: userInfo.data.user.display_name || userInfo.data.user.username,
      groupId: authTaskInfo.spaceId,
      status: AccountStatus.NORMAL,
    })

    const accountInfo = await this.accountService.createAccount(
      authTaskInfo.userId,
      {
        type: AccountType.TIKTOK,
        uid: accessTokenInfo.open_id,
      },
      newAccountData,
    )

    if (!accountInfo) {
      return {
        status: 0,
        message: '创建账号失败',
      }
    }

    // 保存访问令牌
    const tokenSaved = await this.saveOAuthCredential(
      accountInfo.id,
      accessTokenInfo,
    )
    if (!tokenSaved) {
      return {
        status: 0,
        message: '保存访问令牌失败',
      }
    }
    // 更新任务状态
    const taskUpdated = await this.updateAuthTaskStatus(
      taskId,
      authTaskInfo,
      accountInfo.id,
    )

    return taskUpdated
      ? {
          status: 1,
          message: '授权成功',
          accountId: accountInfo.id,
        }
      : {
          status: 0,
          message: '更新任务状态失败',
        }
  }

  /**
   * 获取有效的访问令牌
   */
  private async getValidAccessToken(accountId: string): Promise<string> {
    let tokenInfo = await this.getOAuth2Credential(accountId)
    // 检查是否需要刷新令牌
    const currentTime = getCurrentTimestamp()
    if (
      currentTime >= tokenInfo.expires_in
    ) {
      const refreshedToken = await this.performTokenRefresh(
        accountId,
        tokenInfo.refresh_token,
      )
      if (!refreshedToken) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      tokenInfo = refreshedToken
    }
    return tokenInfo.access_token
  }

  /**
   * 执行令牌刷新
   */
  private async performTokenRefresh(
    accountId: string,
    refreshToken: string,
  ): Promise<TiktokOAuthResponse | null> {
    const newTokenInfo
      = await this.tiktokApiService.refreshAccessToken(refreshToken)
    if (!newTokenInfo)
      return null

    const tokenSaved = await this.saveOAuthCredential(accountId, newTokenInfo)
    return tokenSaved ? newTokenInfo : null
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(
    accountId: string,
    refreshToken: string,
  ): Promise<TiktokOAuthResponse | null> {
    return this.performTokenRefresh(accountId, refreshToken)
  }

  /**
   * 撤销访问令牌
   */
  async revokeAccessToken(accountId: string): Promise<TiktokRevokeResponse> {
    const accessToken = await this.getValidAccessToken(accountId)
    const result = await this.tiktokApiService.revokeAccessToken(accessToken)

    await this.redisService.del(TiktokRedisKeys.getAccessTokenKey(accountId))

    return result
  }

  /**
   * 获取创作者信息
   */
  async getCreatorInfo(accountId: string): Promise<TiktokCreatorInfo> {
    const accessToken = await this.getValidAccessToken(accountId)
    return await this.tiktokApiService.getCreatorInfo(accessToken)
  }

  async getUserInfo(accountId: string, fields?: string): Promise<TikTokUserInfoResponse> {
    const accessToken = await this.getValidAccessToken(accountId)
    return await this.tiktokApiService.getUserInfo(accessToken, fields)
  }

  /**
   * 初始化视频发布
   */
  async initVideoPublish(
    accountId: string,
    postInfo: PostInfoDto,
    sourceInfo: VideoFileUploadSourceDto | VideoPullUrlSourceDto,
  ): Promise<TiktokPublishResponse> {
    const accessToken = await this.getValidAccessToken(accountId)
    return await this.tiktokApiService.initVideoPublish(accessToken, {
      post_info: postInfo,
      source_info: sourceInfo,
    })
  }

  /**
   * 初始化照片发布
   */
  async initPhotoPublish(
    accountId: string,
    postMode: TiktokPostMode,
    postInfo: PostInfoDto,
    sourceInfo: PhotoSourceInfoDto,
  ): Promise<TiktokPublishResponse> {
    const accessToken = await this.getValidAccessToken(accountId)
    return await this.tiktokApiService.initPhotoPublish(accessToken, {
      media_type: 'PHOTO',
      post_mode: postMode,
      post_info: postInfo,
      source_info: sourceInfo,
    })
  }

  /**
   * 查询发布状态
   */
  async getPublishStatus(
    accountId: string,
    publishId: string,
  ): Promise<TiktokPublishStatusResponse> {
    const accessToken = await this.getValidAccessToken(accountId)
    return await this.tiktokApiService.getPublishStatus(accessToken, publishId)
  }

  /**
   * 上传视频文件
   */
  async uploadVideoFile(
    uploadUrl: string,
    videoBase64: string,
    contentType?: string,
  ): Promise<void> {
    const videoBuffer = Buffer.from(videoBase64, 'base64')
    await this.tiktokApiService.uploadVideoFile(
      uploadUrl,
      videoBuffer,
      contentType,
    )
  }

  async chunkedUploadVideoFile(
    uploadUrl: string,
    videoBuffer: Buffer,
    range: [number, number],
    fileSize: number,
    contentType: string,
  ): Promise<void> {
    await this.tiktokApiService.chunkedUploadVideoFile(
      uploadUrl,
      videoBuffer,
      range,
      fileSize,
      contentType,
    )
  }

  private async fetchUserInfo(
    accessToken: string,
  ): Promise<TikTokUserInfoResponse> {
    return await this.tiktokApiService.getUserInfo(accessToken)
  }

  /**
   * 通过令牌获取创作者信息
   */
  private async fetchCreatorInfo(
    accessToken: string,
  ): Promise<TiktokCreatorInfo> {
    return await this.tiktokApiService.getCreatorInfo(accessToken)
  }

  /**
   * 保存访问令牌
   */
  private async saveAccessToken(
    accountId: string,
    tokenInfo: TiktokOAuthResponse,
  ): Promise<boolean> {
    const now = getCurrentTimestamp()
    tokenInfo.expires_in = now + tokenInfo.expires_in - TIKTOK_TIME_CONSTANTS.TOKEN_EXPIRE_BUFFER
    tokenInfo.refresh_expires_in = now + tokenInfo.refresh_expires_in - TIKTOK_TIME_CONSTANTS.TOKEN_REFRESH_THRESHOLD
    return await this.redisService.setJson(
      TiktokRedisKeys.getAccessTokenKey(accountId),
      tokenInfo,
    )
  }

  /**
   * 更新授权任务状态
   */
  private async updateAuthTaskStatus(
    taskId: string,
    authTaskInfo: AuthTaskInfo,
    accountId: string,
  ): Promise<boolean> {
    authTaskInfo.status = 1
    authTaskInfo.accountId = accountId

    return await this.redisService.setJson(
      TiktokRedisKeys.getAuthTaskKey(taskId),
      authTaskInfo,
      TIKTOK_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )
  }

  async publishVideoViaURL(
    accountId: string,
    videoUrl: string,
  ): Promise<string> {
    this.logger.log(`开始发布视频，accountId: ${accountId}, videoUrl: ${videoUrl}`)
    const accessToken = await this.getValidAccessToken(accountId)
    const privacyLevel = TiktokPrivacyLevel.SELF_ONLY
    const postInfo: PostInfoDto = {
      title: 'PULL FROM URL #NFG',
      privacy_level: privacyLevel,
      brand_content_toggle: false,
      brand_organic_toggle: false,
    }

    const sourceInfo: VideoPullUrlSourceDto = {
      source: TiktokSourceType.PULL_FROM_URL,
      video_url: videoUrl,
    }

    const publishRes = await this.tiktokApiService.initVideoPublish(
      accessToken,
      {
        post_info: postInfo,
        source_info: sourceInfo,
      },
    )
    this.logger.log(`视频发布结果: ${JSON.stringify(publishRes)}`)
    if (!publishRes || !publishRes.publish_id) {
      throw new Error('publish video failed')
    }
    return publishRes.publish_id
  }

  async getUserVideos(
    accountId: string,
    fields: string,
    cursor?: number,
    max_count?: number,
  ): Promise<TikTokListVideosResponse> {
    const accessToken = await this.getValidAccessToken(accountId)
    const params: TikTokListVideosParams = {
      fields,
    }
    if (cursor)
      params.cursor = cursor
    if (max_count)
      params.max_count = max_count
    return await this.tiktokApiService.getUserVideos(accessToken, params)
  }

  async getAccessTokenStatus(accountId: string): Promise<number> {
    const tokenInfo = await this.getOAuth2Credential(accountId)
    if (!tokenInfo) {
      return 0
    }
    return tokenInfo.refresh_expires_in > getCurrentTimestamp() ? 1 : 0
  }
}
