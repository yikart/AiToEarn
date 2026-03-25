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
  // QR Code 授权相关
  taskId?: string // 推广任务ID
  qrToken?: string // QR Code token
  // 通用 OAuth 回调
  callbackUrl?: string
  callbackMethod?: 'GET' | 'POST'
}

export interface NoUserAuthInfo {
  state: string
  url: string
}

@Injectable()
export class TiktokService extends PlatformBaseService {
  protected override readonly platform: AccountType = AccountType.TIKTOK
  private readonly defaultScopes: string[]
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
   * 生成不需用户授权URL
   */
  async getNoUserAuthUrl(promotionCode: string) {
    this.logger.debug({
      path: 'channel getNoUserAuthUrl --- 0',
      data: {
        promotionCode,
        promotionRedirectUri: config.channel.tiktok.promotionRedirectUri,
      },
    })
    const authUrl = this.tiktokApiService.generateAuthUrl(this.defaultScopes, promotionCode, config.channel.tiktok.promotionRedirectUri)

    return { url: authUrl, state: promotionCode }
  }

  /**
   * 处理授权重定向 - 创建账号并重定向到指定URL
   */
  async handleAuthRedirect(code: string, state: string): Promise<{ redirectUrl: string }> {
    this.logger.debug({
      path: 'handleAuthRedirect --- 0',
      data: {
        code,
        state,
      },
    })
    // 获取访问令牌 - 使用promotionRedirectUri，与授权URL生成时保持一致
    const accessTokenInfo = await this.tiktokApiService.getAccessToken(code, config.channel.tiktok.promotionRedirectUri)
    if (!accessTokenInfo) {
      throw new AppException(ResponseCode.ChannelAccessTokenFailed)
    }
    this.logger.debug({
      path: 'handleAuthRedirect --- 1',
      data: accessTokenInfo,
    })
    // 获取TikTok用户信息
    const userInfo = await this.fetchUserInfo(accessTokenInfo.access_token)
    this.logger.debug({
      path: 'handleAuthRedirect --- 2',
      data: userInfo,
    })

    // 检查账号是否已存在，如果存在则保留原有的 userId
    const existingAccount = await this.channelAccountService.getAccountByTypeAndUid(
      AccountType.TIKTOK,
      accessTokenInfo.open_id,
    )
    const userId = existingAccount?.userId || ''

    // 创建账号数据（无用户授权场景，如果账号不存在则 userId 为空）
    const newAccountData = new NewAccount({
      userId,
      type: AccountType.TIKTOK,
      uid: accessTokenInfo.open_id,
      account: userInfo.data.user.username,
      avatar: userInfo.data.user.avatar_url,
      nickname: userInfo.data.user.display_name || userInfo.data.user.username,
      status: AccountStatus.NORMAL,
    })

    const accountInfo = await this.channelAccountService.createAccount(
      {
        type: AccountType.TIKTOK,
        uid: accessTokenInfo.open_id,
      },
      newAccountData,
    )
    this.logger.debug({
      path: 'handleAuthRedirect --- 3',
      data: accountInfo,
    })

    if (!accountInfo) {
      throw new AppException(ResponseCode.AccountCreateFailed)
    }

    // 保存访问令牌
    try {
      await this.saveOAuthCredential(accountInfo.id, accessTokenInfo)
    }
    catch (error) {
      this.logger.debug({
        path: 'handleAuthRedirect --- 4',
        data: error,
      })
    }

    // 构建重定向URL
    const baseUrl = config.channel.tiktok.promotionBaseUrl
    const redirectUrl = `${baseUrl}?accountId=${accountInfo.id}&promotionCode=${state}`
    this.logger.debug({
      path: 'handleAuthRedirect --- 5',
      data: redirectUrl,
    })
    return { redirectUrl }
  }

  /**
   * 生成授权URL
   */
  async getAuthUrl(data: {
    userId?: string
    scopes?: string[]
    spaceId?: string
    taskId?: string
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
      taskId: data.taskId,
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

    await this.redisService.del(ChannelRedisKeys.accessToken('tiktok', accountId))

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
    await this.ensureLocalAccount(accountId)
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
    const videoId = this.parseTiktokUrl(workLink)
    const resolvedDataId = videoId || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: resolvedDataId,
      uniqueId: `${accountType}_${resolvedDataId}`,
      type: PublishType.VIDEO,
      videoType: 'short',
    }
  }

  /**
   * 解析 TikTok URL，提取视频 ID
   * 支持的 URL 格式：
   * - https://www.tiktok.com/@username/video/VIDEO_ID
   * - https://www.tiktok.com/@username/photo/PHOTO_ID
   * - https://vm.tiktok.com/SHORT_CODE
   * - https://vt.tiktok.com/SHORT_CODE
   * @param workLink TikTok 链接
   * @returns videoId 或 null
   */
  private parseTiktokUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname.replace('www.', '')

    if (hostname === 'tiktok.com' || hostname === 'm.tiktok.com') {
      const pathname = url.pathname
      // https://www.tiktok.com/@username/video/VIDEO_ID
      const videoMatch = pathname.match(/\/video\/(\d+)/)
      if (videoMatch) {
        return videoMatch[1]
      }
      // https://www.tiktok.com/@username/photo/PHOTO_ID
      const photoMatch = pathname.match(/\/photo\/(\d+)/)
      if (photoMatch) {
        return photoMatch[1]
      }
    }
    else if (hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com') {
      // 短链接，返回短码作为 ID
      return url.pathname.slice(1).split(/[?&#/]/)[0] || null
    }

    return null
  }

  /**
   * 创建 QR Code 授权任务
   */
  async createQRCodeAuthTask(data: {
    taskId?: string
    userId?: string
    spaceId?: string
  }) {
    const state = randomBytes(32).toString('hex')
    const scopes = this.defaultScopes

    const qrCodeInfo = await this.tiktokApiService.getQRCode(scopes, state)
    if (!qrCodeInfo) {
      return null
    }

    const authTaskInfo: AuthTaskInfo = {
      state,
      status: 0,
      userId: data.userId,
      spaceId: data.spaceId,
      taskId: data.taskId,
      qrToken: qrCodeInfo.token,
    }

    const success = await this.redisService.setJson(
      ChannelRedisKeys.authTask('tiktok', state),
      authTaskInfo,
      TIKTOK_TIME_CONSTANTS.AUTH_TASK_EXPIRE,
    )

    return success
      ? {
          qrcodeUrl: qrCodeInfo.scan_qrcode_url,
          taskId: state,
          expiresIn: qrCodeInfo.expires_in,
        }
      : null
  }

  /**
   * 检查 QR Code 扫码状态并处理授权
   */
  async checkQRCodeAuthStatus(taskId: string) {
    const authTaskInfo = await this.redisService.getJson<AuthTaskInfo>(
      ChannelRedisKeys.authTask('tiktok', taskId),
    )
    if (!authTaskInfo || !authTaskInfo.qrToken) {
      return { status: 'expired' as const, message: '授权任务不存在或已过期' }
    }

    // 已完成授权
    if (authTaskInfo.status === 1) {
      return { status: 'confirmed' as const, accountId: authTaskInfo.accountId }
    }

    // 检查扫码状态
    const statusInfo = await this.tiktokApiService.checkQRCodeStatus(authTaskInfo.qrToken)

    if (statusInfo.status === 'confirmed' && statusInfo.code) {
      // 用户已确认授权，换取 token 并创建账号
      const result = await this.handleQRCodeAuthConfirmed(taskId, authTaskInfo, statusInfo.code)
      return result
    }

    return { status: statusInfo.status }
  }

  /**
   * 处理 QR Code 授权确认
   */
  private async handleQRCodeAuthConfirmed(
    taskId: string,
    authTaskInfo: AuthTaskInfo,
    code: string,
  ) {
    // 获取访问令牌
    const accessTokenInfo = await this.tiktokApiService.getAccessToken(code)
    if (!accessTokenInfo) {
      return { status: 'failed' as const, message: '获取访问令牌失败' }
    }

    // 获取用户信息
    const userInfo = await this.fetchUserInfo(accessTokenInfo.access_token)
    this.logger.log(`TikTok QR Code auth user info: ${JSON.stringify(userInfo)}`)

    // 创建账号
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
      { type: AccountType.TIKTOK, uid: accessTokenInfo.open_id },
      newAccountData,
    )

    if (!accountInfo) {
      return { status: 'failed' as const, message: '创建账号失败' }
    }

    // 保存令牌
    await this.saveOAuthCredential(accountInfo.id, accessTokenInfo)

    // 更新任务状态
    await this.updateAuthTaskStatus(taskId, authTaskInfo, accountInfo.id)

    return {
      status: 'confirmed' as const,
      accountId: accountInfo.id,
      taskId: authTaskInfo.taskId,
    }
  }
}
