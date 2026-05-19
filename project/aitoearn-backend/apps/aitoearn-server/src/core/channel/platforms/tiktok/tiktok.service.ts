import { randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AccountStatus, AccountType, NewAccount, PublishType } from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import { getCurrentTimestamp } from '../../../../common/utils/time.util'
import { config } from '../../../../config'
import { RelayAuthException } from '../../../relay/relay-auth.exception'
import { ChannelRedisKeys } from '../../channel.constants'
import { TiktokPostMode, TiktokPrivacyLevel, TiktokSourceType } from '../../libs/tiktok/tiktok.enum'
import {
  TiktokCreatorInfo,
  TikTokListVideosParams,
  TikTokListVideosResponse,
  TiktokOAuthResponse,
  TiktokPublishResponse,
  TiktokPublishStatusResponse,
  TiktokRevokeResponse,
  TikTokUserInfoResponse,
} from '../../libs/tiktok/tiktok.interfaces'
import { TiktokService as TiktokApiService } from '../../libs/tiktok/tiktok.service'
import { PlatformBaseService } from '../base.service'
import { ChannelAccountService } from '../channel-account.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { TIKTOK_DEFAULT_SCOPES, TIKTOK_TIME_CONSTANTS } from './constants'
import {
  PhotoSourceInfoDto,
  PostInfoDto,
  VideoFileUploadSourceDto,
  VideoPullUrlSourceDto,
} from './tiktok.dto'

export interface AuthTaskInfo {
  state: string
  userId?: string
  status: 0 | 1
  accountId?: string
  spaceId?: string
  // 通用 OAuth 回调
  callbackUrl?: string
  callbackMethod?: 'GET' | 'POST'
}

@Injectable()
export class TiktokService extends PlatformBaseService {
  protected override readonly platform: AccountType = AccountType.TIKTOK
  private readonly defaultScopes: string[]
  private readonly authStatisticsFields = 'follower_count,likes_count,video_count'
  protected override readonly logger = new Logger(TiktokService.name)

  constructor(
    private readonly redisService: RedisService,
    private readonly tiktokApiService: TiktokApiService,
    private readonly channelAccountService: ChannelAccountService,
  ) {
    super()
    this.defaultScopes = config.channel.tiktok.scopes.length > 0
      ? config.channel.tiktok.scopes
      : TIKTOK_DEFAULT_SCOPES
  }

  /**
   * 生成授权URL
   */
  async getAuthUrl(data: {
    userId?: string
    scopes?: string[]
    spaceId?: string
    callbackUrl?: string
    callbackMethod?: 'GET' | 'POST'
  }) {
    if (!config.channel.tiktok.clientId && config.relay) {
      throw new RelayAuthException()
    }

    const state = randomBytes(32).toString('hex')
    const requestedScopes = data.scopes || this.defaultScopes

    const authUrl = this.tiktokApiService.generateAuthUrl(requestedScopes, state)

    const authTaskInfo: AuthTaskInfo = {
      state,
      status: 0,
      userId: data.userId,
      spaceId: data.spaceId,
      callbackUrl: data.callbackUrl,
      callbackMethod: data.callbackMethod,
    }

    const success = await this.redisService.setJson(
      ChannelRedisKeys.authTask('tiktok', state),
      authTaskInfo,
      TIKTOK_TIME_CONSTANTS.AUTH_TASK_EXPIRE,
    )

    return success ? { url: authUrl, taskId: state, state } : null
  }

  private async saveOAuthCredential(accountId: string, accessTokenInfo: TiktokOAuthResponse) {
    const now = getCurrentTimestamp()
    const expiresIn = Number(accessTokenInfo.expires_in)
    const refreshExpiresIn = Number(accessTokenInfo.refresh_expires_in)

    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      this.logger.error({ path: 'saveOAuthCredential', message: `Invalid expires_in value: ${accessTokenInfo.expires_in}` })
      throw new Error(`Invalid expires_in value from TikTok API: ${accessTokenInfo.expires_in}`)
    }

    accessTokenInfo.expires_in = now + expiresIn - TIKTOK_TIME_CONSTANTS.TOKEN_EXPIRE_BUFFER
    accessTokenInfo.refresh_expires_in = Number.isFinite(refreshExpiresIn) && refreshExpiresIn > 0
      ? now + refreshExpiresIn - TIKTOK_TIME_CONSTANTS.TOKEN_REFRESH_THRESHOLD
      : 0

    const cached = await this.redisService.setJson(
      ChannelRedisKeys.accessToken('tiktok', accountId),
      accessTokenInfo,
    )
    const persistResult = await this.oauth2CredentialRepository.upsertOne(
      accountId,
      this.platform,
      {
        accessToken: accessTokenInfo.access_token,
        refreshToken: accessTokenInfo.refresh_token,
        accessTokenExpiresAt: accessTokenInfo.expires_in,
        refreshTokenExpiresAt: accessTokenInfo.refresh_expires_in,
      },
    )
    return cached && persistResult
  }

  private async getOAuth2Credential(accountId: string): Promise<TiktokOAuthResponse | null> {
    let credential = await this.redisService.getJson<TiktokOAuthResponse>(
      ChannelRedisKeys.accessToken('tiktok', accountId),
    )
    if (!credential) {
      const oauth2Credential = await this.oauth2CredentialRepository.getOne(
        accountId,
        this.platform,
      )
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
      ChannelRedisKeys.authTask('tiktok', taskId),
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
      ChannelRedisKeys.authTask('tiktok', taskId),
    )
    if (!authTaskInfo) {
      return {
        status: 0,
        message: '授权任务不存在或已过期',
      }
    }

    // 延长授权任务时间
    void this.redisService.expire(
      ChannelRedisKeys.authTask('tiktok', taskId),
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
      userId: authTaskInfo.userId || '',
      type: AccountType.TIKTOK,
      uid: accessTokenInfo.open_id,
      account: userInfo.data.user.username,
      avatar: userInfo.data.user.avatar_url,
      nickname: userInfo.data.user.display_name || userInfo.data.user.username,
      groupId: authTaskInfo.spaceId,
      status: AccountStatus.NORMAL,
    })

    const accountInfo = await this.channelAccountService.createAccount(
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
    await this.syncAuthorizedAccountStatistics(accountInfo.id, accessTokenInfo.access_token)
    const taskUpdated = await this.updateAuthTaskStatus(
      taskId,
      authTaskInfo,
      accountInfo.id,
    )

    if (!taskUpdated) {
      return {
        status: 0,
        message: '更新任务状态失败',
      }
    }

    return {
      status: 1,
      message: '授权成功',
      accountId: accountInfo.id,
      callbackUrl: authTaskInfo.callbackUrl,
      callbackMethod: authTaskInfo.callbackMethod,
      taskId,
      nickname: userInfo.data.user.display_name || userInfo.data.user.username,
      avatar: userInfo.data.user.avatar_url,
      platformUid: accessTokenInfo.open_id,
      accountType: AccountType.TIKTOK,
    }
  }

  /**
   * 获取有效的访问令牌
   */
  private async getValidAccessToken(accountId: string): Promise<string> {
    await this.ensureLocalAccount(accountId)
    let tokenInfo = await this.getOAuth2Credential(accountId)
    if (!tokenInfo) {
      throw new PlatformAuthExpiredException(this.platform, accountId)
    }
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
    userId: string,
    accountId: string,
    refreshToken: string,
  ): Promise<TiktokOAuthResponse | null> {
    await this.getLocalAccount(userId, accountId)
    return this.refreshAccessTokenByAccountId(accountId, refreshToken)
  }

  async refreshAccessTokenByAccountId(
    accountId: string,
    refreshToken: string,
  ): Promise<TiktokOAuthResponse | null> {
    return this.performTokenRefresh(accountId, refreshToken)
  }

  /**
   * 撤销访问令牌
   */
  async revokeAccessToken(userId: string, accountId: string): Promise<TiktokRevokeResponse> {
    await this.getLocalAccount(userId, accountId)
    return this.revokeAccessTokenByAccountId(accountId)
  }

  async revokeAccessTokenByAccountId(accountId: string): Promise<TiktokRevokeResponse> {
    const accessToken = await this.getValidAccessToken(accountId)
    const result = await this.tiktokApiService.revokeAccessToken(accessToken)

    await this.redisService.del(ChannelRedisKeys.accessToken('tiktok', accountId))

    return result
  }

  /**
   * 获取创作者信息
   */
  async getCreatorInfo(userId: string, accountId: string): Promise<TiktokCreatorInfo> {
    await this.getLocalAccount(userId, accountId)
    return this.getCreatorInfoByAccountId(accountId)
  }

  async getCreatorInfoByAccountId(accountId: string): Promise<TiktokCreatorInfo> {
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
    userId: string,
    accountId: string,
    postInfo: PostInfoDto,
    sourceInfo: VideoFileUploadSourceDto | VideoPullUrlSourceDto,
  ): Promise<TiktokPublishResponse> {
    await this.getLocalAccount(userId, accountId)
    return this.initVideoPublishByAccountId(accountId, postInfo, sourceInfo)
  }

  async initVideoPublishByAccountId(
    accountId: string,
    postInfo: PostInfoDto,
    sourceInfo: VideoFileUploadSourceDto | VideoPullUrlSourceDto,
  ): Promise<TiktokPublishResponse> {
    this.logger.log({
      path: 'tiktok.initVideoPublish.request',
      data: {
        accountId,
        privacyLevel: postInfo.privacy_level,
        hasTitle: !!postInfo.title,
        source: sourceInfo.source,
        hasVideoUrl: 'video_url' in sourceInfo,
      },
    })
    const accessToken = await this.getValidAccessToken(accountId)
    const result = await this.tiktokApiService.initVideoPublish(accessToken, {
      post_info: postInfo,
      source_info: sourceInfo,
    })
    this.logger.log({
      path: 'tiktok.initVideoPublish.response',
      data: {
        accountId,
        publishId: result.publish_id,
        hasUploadUrl: !!result.upload_url,
      },
    })
    return result
  }

  /**
   * 初始化照片发布
   */
  async initPhotoPublish(
    userId: string,
    accountId: string,
    postMode: TiktokPostMode,
    postInfo: PostInfoDto,
    sourceInfo: PhotoSourceInfoDto,
  ): Promise<TiktokPublishResponse> {
    await this.getLocalAccount(userId, accountId)
    return this.initPhotoPublishByAccountId(accountId, postMode, postInfo, sourceInfo)
  }

  async initPhotoPublishByAccountId(
    accountId: string,
    postMode: TiktokPostMode,
    postInfo: PostInfoDto,
    sourceInfo: PhotoSourceInfoDto,
  ): Promise<TiktokPublishResponse> {
    this.logger.log({
      path: 'tiktok.initPhotoPublish.request',
      data: {
        accountId,
        postMode,
        privacyLevel: postInfo.privacy_level,
        hasTitle: !!postInfo.title,
        photoCount: sourceInfo.photo_images.length,
        photoCoverIndex: sourceInfo.photo_cover_index,
        firstPhotoUrl: sourceInfo.photo_images[0],
      },
    })
    const accessToken = await this.getValidAccessToken(accountId)
    const result = await this.tiktokApiService.initPhotoPublish(accessToken, {
      media_type: 'PHOTO',
      post_mode: postMode,
      post_info: postInfo,
      source_info: sourceInfo,
    })
    this.logger.log({
      path: 'tiktok.initPhotoPublish.response',
      data: {
        accountId,
        publishId: result.publish_id,
      },
    })
    return result
  }

  /**
   * 查询发布状态
   */
  async getPublishStatus(
    userId: string,
    accountId: string,
    publishId: string,
  ): Promise<TiktokPublishStatusResponse> {
    await this.getLocalAccount(userId, accountId)
    return this.getPublishStatusByAccountId(accountId, publishId)
  }

  async getPublishStatusByAccountId(
    accountId: string,
    publishId: string,
  ): Promise<TiktokPublishStatusResponse> {
    this.logger.log({
      path: 'tiktok.getPublishStatus.request',
      data: {
        accountId,
        publishId,
      },
    })
    const accessToken = await this.getValidAccessToken(accountId)
    const result = await this.tiktokApiService.getPublishStatus(accessToken, publishId)
    this.logger.log({
      path: 'tiktok.getPublishStatus.response',
      data: {
        accountId,
        publishId,
        result,
      },
    })
    return result
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

  private async syncAuthorizedAccountStatistics(accountId: string, accessToken: string) {
    await this.syncAccountStatisticsOnAuth(accountId, async () => {
      const info = await this.tiktokApiService.getUserInfo(accessToken, this.authStatisticsFields)
      const user = info.data.user
      return {
        fansCount: user.follower_count,
        likeCount: user.like_count,
        workCount: user.video_count,
      }
    })
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
      ChannelRedisKeys.accessToken('tiktok', accountId),
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
      ChannelRedisKeys.authTask('tiktok', taskId),
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
    await this.getLocalAccountById(accountId)
    const tokenInfo = await this.getOAuth2Credential(accountId)
    if (!tokenInfo) {
      this.updateAccountStatus(accountId, 0)
      return 0
    }
    const status = tokenInfo.refresh_expires_in > getCurrentTimestamp() ? 1 : 0
    this.updateAccountStatus(accountId, status)
    return status
  }

  /**
   * 获取作品信息
   * @param accountType
   * @param workLink
   * @param dataId
   * @returns
   */
  async getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string): Promise<{
    dataId: string
    uniqueId: string
    type: PublishType
    videoType?: 'short' | 'long'
  }> {
    const resolvedWorkLink = await this.normalizeTiktokWorkLink(workLink)
    const resolvedWork = this.parseTiktokUrl(resolvedWorkLink)
    const resolvedDataId = resolvedWork?.id || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: resolvedDataId,
      uniqueId: `${accountType}_${resolvedDataId}`,
      type: resolvedWork?.type === 'photo' ? PublishType.ARTICLE : PublishType.VIDEO,
      videoType: resolvedWork?.type === 'photo' ? undefined : 'short',
    }
  }

  private async normalizeTiktokWorkLink(workLink: string): Promise<string> {
    try {
      const url = new URL(workLink)
      const hostname = url.hostname.replace('www.', '')
      if (hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com') {
        return await this.resolveRedirectUrl(workLink)
      }
    }
    catch {
      return workLink
    }

    return workLink
  }

  /**
   * 解析 TikTok URL，提取视频 ID
   * 支持的 URL 格式：
   * - https://www.tiktok.com/@username/video/VIDEO_ID
   * - https://www.tiktok.com/@username/photo/PHOTO_ID
   * - https://vm.tiktok.com/SHORT_CODE
   * - https://vt.tiktok.com/SHORT_CODE
   * @param workLink TikTok 链接
   * @returns 作品 ID 与类型，或 null
   */
  private parseTiktokUrl(workLink: string): { id: string, type: 'video' | 'photo' | 'short' } | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname.replace('www.', '')

    if (hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com') {
      return null
    }

    if (hostname === 'tiktok.com' || hostname === 'm.tiktok.com') {
      const pathname = url.pathname
      // https://www.tiktok.com/@username/video/VIDEO_ID
      const videoMatch = pathname.match(/\/video\/(\d+)/)
      if (videoMatch) {
        return { id: videoMatch[1], type: 'video' }
      }
      // https://www.tiktok.com/@username/photo/PHOTO_ID
      const photoMatch = pathname.match(/\/photo\/(\d+)/)
      if (photoMatch) {
        return { id: photoMatch[1], type: 'photo' }
      }
    }
    else if (hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com') {
      // 短链接，返回短码作为 ID
      const shortId = url.pathname.slice(1).split(/[?&#/]/)[0] || null
      return shortId ? { id: shortId, type: 'short' } : null
    }

    return null
  }
}
