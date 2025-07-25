/*
 * @Author: nevin
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: nevin
 * @Description: TikTok业务服务
 */
import { randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, getCurrentTimestamp } from '@/common'
import { config } from '@/config'
import { AccountService } from '@/core/account/account.service'
import { FileService } from '@/core/file/file.service'
import { RedisService } from '@/libs'
import { TiktokPostMode } from '@/libs/tiktok/tiktok.enum'
import {
  TiktokCreatorInfo,
  TiktokOAuthResponse,
  TiktokPublishResponse,
  TiktokPublishStatusResponse,
  TiktokRevokeResponse,
  TikTokUserInfoResponse,
} from '@/libs/tiktok/tiktok.interfaces'
import { TiktokService as TiktokApiService } from '@/libs/tiktok/tiktok.service'
import { AccountType, NewAccount } from '@/transports/account/common'
import { TIKTOK_TIME_CONSTANTS, TiktokRedisKeys } from './constants'
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
}

@Injectable()
export class TiktokService {
  private readonly authCallbackHost: string
  private readonly natsPrefix: string
  private readonly defaultScopes: string[]
  private readonly logger = new Logger(TiktokService.name)

  constructor(
    private readonly redisService: RedisService,
    private readonly tiktokApiService: TiktokApiService,
    private readonly accountService: AccountService,
    private readonly fileService: FileService,
  ) {
    this.authCallbackHost = config.tiktok.redirectUri
    this.natsPrefix = config.nats.prefix
    this.defaultScopes = [
      'user.info.basic',
      'user.info.profile',
      'video.upload',
      'video.publish',
      // 'research.data.basic',
    ]
  }

  /**
   * 生成授权URL
   */
  async getAuthUrl(userId: string, scopes?: string[]) {
    const state = randomBytes(32).toString('hex')
    const requestedScopes = scopes || this.defaultScopes

    const authUrl = this.tiktokApiService.generateAuthUrl(requestedScopes, state)

    const success = await this.redisService.setKey<AuthTaskInfo>(
      TiktokRedisKeys.getAuthTaskKey(state),
      { state, status: 0, userId },
      TIKTOK_TIME_CONSTANTS.AUTH_TASK_EXPIRE,
    )

    return success ? { url: authUrl, taskId: state, state } : null
  }

  /**
   * 获取授权任务信息
   */
  async getAuthInfo(taskId: string) {
    return await this.redisService.get<AuthTaskInfo>(
      TiktokRedisKeys.getAuthTaskKey(taskId),
    )
  }

  /**
   * 创建账号并设置访问令牌
   */
  async createAccountAndSetAccessToken(
    taskId: string,
    authData: { code: string, state: string },
  ) {
    const { code } = authData

    const authTaskInfo = await this.redisService.get<AuthTaskInfo>(
      TiktokRedisKeys.getAuthTaskKey(taskId),
    )
    if (!authTaskInfo)
      return null

    // 延长授权任务时间
    void this.redisService.setPexire(
      TiktokRedisKeys.getAuthTaskKey(taskId),
      TIKTOK_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )

    // 获取访问令牌
    const accessTokenInfo = await this.tiktokApiService.getAccessToken(code)
    if (!accessTokenInfo)
      return null
    // 获取TikTok用户信息
    const userInfo = await this.fetchUserInfo(
      accessTokenInfo.access_token,
    )

    this.logger.debug(`TikTok user info: ${JSON.stringify(userInfo)}`)
    // 创建账号数据
    const newAccountData = new NewAccount({
      userId: authTaskInfo.userId,
      type: AccountType.TIKTOK,
      uid: accessTokenInfo.open_id,
      account: userInfo.data.user.username,
      avatar: userInfo.data.user.avatar_url,
      nickname: userInfo.data.user.display_name || userInfo.data.user.username,
    })

    const accountInfo = await this.accountService.createAccount(
      {
        userId: authTaskInfo.userId,
        type: AccountType.TIKTOK,
        uid: accessTokenInfo.open_id,
      },
      newAccountData,
    )

    if (!accountInfo)
      return null

    // 保存访问令牌
    const tokenSaved = await this.saveAccessToken(
      accountInfo.id,
      accessTokenInfo,
    )
    if (!tokenSaved)
      return null

    // 更新任务状态
    const taskUpdated = await this.updateAuthTaskStatus(
      taskId,
      authTaskInfo,
      accountInfo.id,
    )

    return taskUpdated ? accountInfo : null
  }

  /**
   * 获取有效的访问令牌
   */
  private async getValidAccessToken(accountId: string): Promise<string> {
    let tokenInfo = await this.redisService.get<TiktokOAuthResponse>(
      TiktokRedisKeys.getAccessTokenKey(accountId),
    )

    if (!tokenInfo) {
      throw new AppException(4001, '账号未授权')
    }

    // 检查是否需要刷新令牌
    const currentTime = getCurrentTimestamp()
    const tokenExpireTime = currentTime + tokenInfo.expires_in

    if (
      tokenExpireTime - currentTime
      < TIKTOK_TIME_CONSTANTS.TOKEN_REFRESH_THRESHOLD
    ) {
      const refreshedToken = await this.performTokenRefresh(
        accountId,
        tokenInfo.refresh_token,
      )
      if (refreshedToken) {
        tokenInfo = refreshedToken
      }
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

    const tokenSaved = await this.saveAccessToken(accountId, newTokenInfo)
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
    chunkSeq: number,
    fileSize: number,
    contentType: string,
  ): Promise<void> {
    await this.tiktokApiService.chunkedUploadVideoFile(
      uploadUrl,
      videoBuffer,
      chunkSeq,
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
   * 处理头像URL
   */
  private async processAvatarUrl(avatarUrl: string): Promise<string> {
    return await this.fileService.upFileByUrl(avatarUrl, {
      path: 'account/avatar',
      permanent: true,
    })
  }

  /**
   * 保存访问令牌
   */
  private async saveAccessToken(
    accountId: string,
    tokenInfo: TiktokOAuthResponse,
  ): Promise<boolean> {
    const expireTime
      = tokenInfo.expires_in
        - TIKTOK_TIME_CONSTANTS.TOKEN_EXPIRE_BUFFER
    return await this.redisService.setKey(
      TiktokRedisKeys.getAccessTokenKey(accountId),
      tokenInfo,
      expireTime,
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

    return await this.redisService.setKey(
      TiktokRedisKeys.getAuthTaskKey(taskId),
      authTaskInfo,
      TIKTOK_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )
  }
}
