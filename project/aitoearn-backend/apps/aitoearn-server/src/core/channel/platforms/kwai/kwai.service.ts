import { Injectable, Logger } from '@nestjs/common'
import { AccountStatus, AccountType, NewAccount, PublishType } from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentTimestamp } from '../../../../common/utils/time.util'
import { config } from '../../../../config'
import { RelayAuthException } from '../../../relay/relay-auth.exception'
import { ChannelRedisKeys } from '../../channel.constants'
import { KwaiOAuthCredentialsResponse } from '../../libs/kwai/kwai.interfaces'
import { KwaiApiService } from '../../libs/kwai/kwai.service'
import { BilibiliAuthInfo } from '../../platforms/bilibili/common'
import { AuthTaskInfo } from '../../platforms/common'
import { PlatformBaseService } from '../base.service'
import { ChannelAccountService } from '../channel-account.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { KWAI_TIME_CONSTANTS } from './constants'

@Injectable()
export class KwaiService extends PlatformBaseService {
  protected override readonly platform: AccountType = AccountType.KWAI
  protected override readonly logger = new Logger(KwaiService.name)
  constructor(
    private readonly kwaiApiService: KwaiApiService,
    private readonly redisService: RedisService,
    private readonly channelAccountService: ChannelAccountService,
  ) {
    super()
  }

  private async getOAuth2Credential(accountId: string): Promise<KwaiOAuthCredentialsResponse | null> {
    let credential = await this.redisService.getJson<KwaiOAuthCredentialsResponse>(
      ChannelRedisKeys.accessToken('kwai', accountId),
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
    await this.ensureLocalAccount(accountId)
    const accessTokenInfo = await this.getOAuth2Credential(accountId)
    if (!accessTokenInfo) {
      throw new PlatformAuthExpiredException(this.platform, accountId)
    }
    // 判断 refresh_token 是否过期
    const isRefreshTokenExpired
      = getCurrentTimestamp() >= accessTokenInfo.refresh_token_expires_in
    if (isRefreshTokenExpired) {
      throw new PlatformAuthExpiredException(this.platform, accountId)
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
      throw new PlatformAuthExpiredException(this.platform, accountId)
    }

    const success = await this.saveOAuthCredential(accountId, newAccountToken)
    if (!success) {
      this.logger.error(`Kwai account ${accountId} access_token save to redis failed`)
      return null
    }
    return newAccountToken.access_token
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
      callbackUrl?: string
      callbackMethod?: 'GET' | 'POST'
    },
    options?: {
      transpond?: string
      accountAddPath?: string
    },
  ) {
    if (!config.channel.kwai.id && config.relay) {
      throw new RelayAuthException()
    }
    const taskId = uuidv4()
    const urlInfo = this.kwaiApiService.getAuthPage(taskId, data.type)
    const rRes = await this.redisService.setJson(
      ChannelRedisKeys.authTask('kwai', taskId),
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
        callbackUrl: data.callbackUrl,
        callbackMethod: data.callbackMethod,
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
    const cacheKey = ChannelRedisKeys.authTask('kwai', taskId)
    const { code } = data
    const taskInfo = await this.redisService.getJson<AuthTaskInfo<BilibiliAuthInfo>>(
      cacheKey,
    )
    if (!taskInfo || taskInfo.status !== 0 || !taskInfo.data) {
      return { status: 0, message: '任务不存在或已完成' }
    }

    void this.redisService.expire(cacheKey, 60 * 3)

    try {
      const account = await this.addKwaiAccount(code, taskInfo.data.userId, taskInfo.spaceId)
      this.logger.log({
        path: 'debug----addKwaiAccount',
        account,
      })
      if (account) {
        taskInfo.status = 1
        taskInfo.data.accountId = account.id
        await this.redisService.setJson(
          cacheKey,
          taskInfo,
          60 * 3,
        )
        return {
          status: 1,
          message: '添加账号成功',
          accountId: account.id,
          nickname: account.nickname,
          avatar: account.avatar,
          platformUid: account.uid,
          accountType: AccountType.KWAI,
          callbackUrl: taskInfo.callbackUrl,
          callbackMethod: taskInfo.callbackMethod,
          taskId,
        }
      }
      else {
        return { status: 0, message: '添加账号失败' }
      }
    }
    catch (error) {
      this.logger.error('createAccountAndSetAccessToken error:', error)
      return { status: 0, message: `添加账号失败: ${(error as Error).message}` }
    }
  }

  async getAuthInfo(taskId: string) {
    const taskInfo = await this.redisService.getJson<{
      state: string
      status: number
      accountId?: string
    }>(ChannelRedisKeys.authTask('kwai', taskId))
    this.logger.log({
      path: 'debug----getAuthInfo',
      taskInfo,
    })
    return taskInfo
  }

  private async saveOAuthCredential(accountId: string, accessTokenInfo: KwaiOAuthCredentialsResponse) {
    accessTokenInfo.expires_in = accessTokenInfo.expires_in + getCurrentTimestamp() - KWAI_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    accessTokenInfo.refresh_token_expires_in = accessTokenInfo.refresh_token_expires_in + getCurrentTimestamp() - KWAI_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    const cached = await this.redisService.setJson(
      ChannelRedisKeys.accessToken('kwai', accountId),
      accessTokenInfo,
    )
    const persistResult = await this.oauth2CredentialRepository.upsertOne(
      accountId,
      this.platform,
      {
        accessToken: accessTokenInfo.access_token,
        refreshToken: accessTokenInfo.refresh_token,
        accessTokenExpiresAt: accessTokenInfo.expires_in,
        refreshTokenExpiresAt: accessTokenInfo.refresh_token_expires_in,
      },
    )
    const saved = cached && persistResult
    return saved
  }

  // 根据code添加快手账户
  async addKwaiAccount(code: string, userId: string, spaceId = '') {
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

    const accountInfo = await this.channelAccountService.createAccount(
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

  async initVideoUpload(accountId: string) {
    const accountToken = await this.getAccessTokenAndRefresh(accountId)
    if (accountToken === null) {
      this.logger.warn(`Kwai account ${accountId} access_token is expired or invalid`)
      throw new Error('kwai account access_token is expired or invalid')
    }
    return await this.kwaiApiService.startUpload(accountToken)
  }

  async chunkedUploadVideo(
    upload_token: string,
    fragment_id: number,
    endpoint: string,
    video: Buffer,
  ) {
    return await this.kwaiApiService.fragmentUploadVideo(
      upload_token,
      fragment_id,
      endpoint,
      video,
    )
  }

  async finalizeVideoUpload(
    upload_token: string,
    total_parts: number,
    endpoint: string,
  ) {
    return await this.kwaiApiService.completeFragmentUpload(
      upload_token,
      total_parts,
      endpoint,
    )
  }

  // 视频发布
  async publishVideo(accountId: string, caption: string, thumbnail: Blob, uploadToken: string) {
    const accountToken = await this.getAccessTokenAndRefresh(accountId)
    if (accountToken === null) {
      this.logger.warn(`Kwai account ${accountId} access_token is expired or invalid`)
      throw new Error('kwai account access_token is expired or invalid')
    }
    return await this.kwaiApiService.publishVideo(accountToken, caption, thumbnail, uploadToken)
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
    await this.ensureLocalAccount(accountId)
    const tokenInfo = await this.getOAuth2Credential(accountId)
    if (!tokenInfo) {
      this.updateAccountStatus(accountId, 0)
      return 0
    }
    const status = tokenInfo.refresh_token_expires_in > getCurrentTimestamp() ? 1 : 0
    this.updateAccountStatus(accountId, status)
    return status
  }

  override async deletePost(accountId: string, postId: string): Promise<boolean> {
    const accountToken = await this.getAccessTokenAndRefresh(accountId)
    if (accountToken === null) {
      this.logger.warn(`Kwai account ${accountId} access_token is expired or invalid`)
      throw new Error('kwai account access_token is expired or invalid')
    }
    const res = await this.kwaiApiService.deleteVideo(accountToken, postId)
    return res === 1
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
    const videoId = this.parseKwaiUrl(workLink)
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
   * 解析快手 URL，提取视频 ID
   * 支持的 URL 格式：
   * - https://www.kuaishou.com/short-video/VIDEO_ID
   * - https://www.kuaishou.com/video/VIDEO_ID
   * - https://v.kuaishou.com/SHORT_CODE
   * - https://c.kuaishou.com/fw/photo/VIDEO_ID
   * @param workLink 快手链接
   * @returns videoId 或 null
   */
  private parseKwaiUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname.replace('www.', '')

    if (hostname === 'kuaishou.com') {
      const pathname = url.pathname
      // https://www.kuaishou.com/short-video/VIDEO_ID
      if (pathname.startsWith('/short-video/')) {
        return pathname.split('/short-video/')[1]?.split(/[?&#/]/)[0] || null
      }
      // https://www.kuaishou.com/video/VIDEO_ID
      if (pathname.startsWith('/video/')) {
        return pathname.split('/video/')[1]?.split(/[?&#/]/)[0] || null
      }
    }
    else if (hostname === 'v.kuaishou.com') {
      // 短链接，返回短码作为 ID
      return url.pathname.slice(1).split(/[?&#/]/)[0] || null
    }
    else if (hostname === 'c.kuaishou.com') {
      // https://c.kuaishou.com/fw/photo/VIDEO_ID
      const photoMatch = url.pathname.match(/\/photo\/(\w+)/)
      if (photoMatch) {
        return photoMatch[1]
      }
    }

    return null
  }
}
