import { Injectable, Logger } from '@nestjs/common'
import {
  AccountStatus,
  AccountType,
  NewAccount,
  PublishType,
} from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentTimestamp } from '../../../../common/utils/time.util'
import { config } from '../../../../config'
import { RelayAuthException } from '../../../relay/relay-auth.exception'
import { ChannelRedisKeys } from '../../channel.constants'
import { DouyinAccessTokenInfo, DouyinClientTokenInfo, DouyinOpenTicketInfo, DouyinShareSchemaOptions } from '../../libs/douyin/common'
import { DouyinApiService } from '../../libs/douyin/douyin-api.service'
import { PlatformBaseService } from '../base.service'
import { ChannelAccountService } from '../channel-account.service'
import { AuthCallbackResult, AuthTaskInfo } from '../common'
import { PlatformAuthExpiredException } from '../platform.exception'
import { AccessToken, ArchiveStatus, DouyinAuthInfo } from './common'

@Injectable()
export class DouyinService extends PlatformBaseService {
  protected override readonly platform: AccountType = AccountType.Douyin
  protected override readonly logger = new Logger(DouyinService.name)
  constructor(
    private readonly redisService: RedisService,
    private readonly douyinApiService: DouyinApiService,
    private readonly channelAccountService: ChannelAccountService,
  ) {
    super()
  }

  async getDouyinConfig() {
    return config.channel.douyin
  }

  /**
   * 创建用户授权任务
   * @param data
   * @param options
   */
  async createAuthTask(
    data: {
      userId?: string
      spaceId?: string
      callbackUrl?: string
      callbackMethod?: 'GET' | 'POST'
    },
  ) {
    if (!config.channel.douyin.id && config.relay) {
      throw new RelayAuthException()
    }
    const taskId = uuidv4()
    const urlInfo = await this.getAuthUrl(taskId)
    const rRes = await this.redisService.setJson<AuthTaskInfo<DouyinAuthInfo>>(
      ChannelRedisKeys.authTask('douyin', taskId),
      {
        taskId,
        spaceId: data.spaceId,
        data: {
          state: taskId,
          userId: data.userId,
          accountId: '',
        },
        status: 0,
        callbackUrl: data.callbackUrl,
        callbackMethod: data.callbackMethod,
      },
      60 * 5,
    )

    return rRes
      ? {
          url: urlInfo.url,
          taskId,
        }
      : null
  }

  /**
   * 获取用户的授权链接
   * @param taskId
   * @returns
   */
  async getAuthUrl(taskId: string) {
    const gourl = `${config.channel.douyin.authBackHost}`
    const urlInfo = this.douyinApiService.getAuthPage(gourl, taskId)
    return urlInfo
  }

  /**
   * 获取用户的授权信息
   * @param taskId
   * @returns
   */
  async getAuthInfo(taskId: string) {
    const data = await this.redisService.getJson<{
      state: string
      status: number
      accountId?: string
    }>(ChannelRedisKeys.authTask('douyin', taskId))
    return data
  }

  async getAccessTokenStatus(accountId: string): Promise<number> {
    await this.ensureLocalAccount(accountId)
    const tokenInfo = await this.getOAuth2Credential(accountId)
    if (!tokenInfo) {
      this.updateAccountStatus(accountId, 0)
      return 0
    }
    const now = getCurrentTimestamp()
    const status = tokenInfo.expires_in > now ? 1 : 0
    this.updateAccountStatus(accountId, status)
    return status
  }

  /**
   * 获取用户的授权信息
   * @param accountId
   * @returns
   */
  async getAccountAuthInfo(accountId: string) {
    const data = await this.redisService.getJson<AccessToken>(
      ChannelRedisKeys.accessToken('douyin', accountId),
    )
    return data
  }

  /**
   * 获取用户信息
   * @param accessToken
   * @param openId
   * @returns
   */
  async getAccountInfo(accessToken: string, openId: string) {
    const douyinUserInfo
      = await this.douyinApiService.getAccountInfo(accessToken, openId)
    if (!douyinUserInfo)
      return null
    return douyinUserInfo
  }

  /**
   * 保存用户的授权信息
   * @param accountId
   * @param accessTokenInfo
   * @returns
   */
  private async saveOAuthCredential(
    accountId: string,
    accessTokenInfo: DouyinAccessTokenInfo,
  ) {
    const cached = await this.redisService.setJson(
      ChannelRedisKeys.accessToken('douyin', accountId),
      accessTokenInfo,
      accessTokenInfo.expires_in,
    )
    const persistResult = await this.oauth2CredentialRepository.upsertOne(
      accountId,
      this.platform,
      {
        accessToken: accessTokenInfo.access_token,
        refreshToken: accessTokenInfo.refresh_token,
        accessTokenExpiresAt: accessTokenInfo.expires_in,
      },
    )
    return cached && persistResult
  }

  /**
   * 创建账号+设置授权Token
   * @param taskId
   * @param data
   * @returns
   */
  async createAccountAndSetAccessToken(
    taskId: string,
    data: { code: string, state: string },
  ): Promise<AuthCallbackResult> {
    const cacheKey = ChannelRedisKeys.authTask('douyin', taskId)
    const { code, state } = data

    const taskInfo
      = await this.redisService.getJson<AuthTaskInfo<DouyinAuthInfo>>(cacheKey)
    if (!taskInfo || taskInfo.status !== 0) {
      return {
        status: 0,
        message: '授权超时',
      }
    }

    if (taskId !== state) {
      return {
        status: 0,
        message: '授权认证失败',
      }
    }

    // 延长授权时间
    void this.redisService.expire(cacheKey, 60 * 3)

    // 获取token，创建账号
    const accessTokenInfo = await this.douyinApiService.getAccessToken(code)
    if (!accessTokenInfo) {
      return {
        status: 0,
        message: '平台认证失效',
      }
    }

    // 获取抖音用户信息
    const douyinUserInfo = await this.getAccountInfo(
      accessTokenInfo.access_token,
      accessTokenInfo.open_id,
    )
    this.logger.log({
      path: 'douyin createAccountAndSetAccessToken getAccountInfo',
      data: douyinUserInfo,
    })
    if (!douyinUserInfo) {
      return {
        status: 0,
        message: '获取用户信息失败，请稍后再试',
      }
    }

    // 创建本平台的平台账号
    const newData = new NewAccount({
      userId: taskInfo.data!.userId || '',
      type: AccountType.Douyin,
      uid: douyinUserInfo.open_id,
      account: douyinUserInfo.open_id,
      avatar: douyinUserInfo.avatar,
      nickname: douyinUserInfo.nickname,
      groupId: taskInfo.spaceId,
      status: AccountStatus.NORMAL,
    })
    this.logger.log({
      path: 'douyin createAccountAndSetAccessToken createAccount newData',
      data: newData,
    })
    const accountInfo = await this.channelAccountService.createAccount(
      {
        type: AccountType.Douyin,
        uid: douyinUserInfo.open_id,
      },
      newData,
    )
    this.logger.log({
      path: 'douyin createAccountAndSetAccessToken createAccount accountInfo',
      data: accountInfo,
    })
    if (!accountInfo) {
      return {
        status: 0,
        message: '创建频道账号失败',
      }
    }

    let res = await this.saveOAuthCredential(accountInfo.id, accessTokenInfo)

    if (!res) {
      return {
        status: 0,
        message: '设置授权Token失败，请稍后再试',
      }
    }

    // 更新任务信息
    taskInfo.status = 1
    taskInfo.data!.accountId = accountInfo.id
    res = await this.redisService.setJson(
      cacheKey,
      taskInfo,
      60 * 3,
    )

    if (!res) {
      return {
        status: 0,
        message: '设置授权Token失败，请稍后再试',
      }
    }

    return {
      status: 1,
      accountId: accountInfo.id,
      nickname: accountInfo.nickname,
      avatar: accountInfo.avatar,
      platformUid: accountInfo.uid,
      accountType: AccountType.Douyin,
      callbackUrl: taskInfo.callbackUrl,
      callbackMethod: taskInfo.callbackMethod,
      taskId,
    }
  }

  private async getOAuth2Credential(
    accountId: string,
  ): Promise<AccessToken | null> {
    let credential = await this.redisService.getJson<AccessToken>(
      ChannelRedisKeys.accessToken('douyin', accountId),
    )
    if (!credential) {
      const oauth2Credential = await this.oauth2CredentialRepository.getOne(
        accountId,
        this.platform,
      )
      if (!oauth2Credential) {
        return null
      }
      credential = {
        access_token: oauth2Credential.accessToken,
        refresh_token: oauth2Credential.refreshToken,
        expires_in: oauth2Credential.accessTokenExpiresAt,
        scopes: [],
      }
    }
    return credential
  }

  /**
   * 获取用户的授权Token
   * @param accountId
   * @returns
   */
  async getAccountAccessToken(accountId: string): Promise<string> {
    await this.ensureLocalAccount(accountId)
    const credential = await this.getOAuth2Credential(accountId)
    if (!credential || !credential.access_token) {
      throw new PlatformAuthExpiredException(this.platform, accountId)
    }

    // 剩余时间
    const overTime = credential.expires_in - getCurrentTimestamp()

    if (overTime > 60 * 10)
      return credential.access_token

    return await this.refreshAccessToken(accountId, credential.refresh_token)
  }

  /**
   * 刷新AccessToken
   * @param accountId
   * @param refreshToken
   * @returns
   */
  private async refreshAccessToken(
    accountId: string,
    refreshToken: string,
  ): Promise<string> {
    const accessTokenInfo
      = await this.douyinApiService.refreshAccessToken(refreshToken)
    if (!accessTokenInfo)
      throw new PlatformAuthExpiredException(this.platform, accountId)

    const res = await this.saveOAuthCredential(accountId, accessTokenInfo)
    if (!res)
      throw new PlatformAuthExpiredException(this.platform, accountId)

    return accessTokenInfo.access_token
  }

  /**
   * 获取发布的ClientToken
   */
  private async getClientToken(): Promise<string> {
    // 先从缓存中获取
    let clientTokenInfo = await this.redisService.getJson<DouyinClientTokenInfo>(
      `plat:${this.platform.toLowerCase()}:clientToken`,
    )
    if (!clientTokenInfo) {
      clientTokenInfo = await this.douyinApiService.getClientToken()
      await this.redisService.setJson(
        `plat:${this.platform.toLowerCase()}:clientToken`,
        clientTokenInfo,
        clientTokenInfo.expires_in,
      )
    }
    return clientTokenInfo.access_token
  }

  /**
   * 获取发布的ClientToken
   * @returns
   */
  async getOpenTicket(): Promise<string> {
    const clientToken = await this.getClientToken()
    let ticketInfo = await this.redisService.getJson<DouyinOpenTicketInfo>(
      `plat:${this.platform.toLowerCase()}:openTicket:${clientToken}`,
    )
    if (!ticketInfo) {
      ticketInfo = await this.douyinApiService.getOpenTicket(clientToken)
      await this.redisService.setJson(
        `plat:${this.platform.toLowerCase()}:openTicket:${clientToken}`,
        ticketInfo,
        ticketInfo.expires_in,
      )
    }
    return ticketInfo.ticket
  }

  /**
   * 获取分享ID
   * @param accountId 账户ID
   * @returns
   */
  async getShareid() {
    const clientToken = await this.getClientToken()
    return await this.douyinApiService.getShareid(clientToken)
  }

  /**
   * 生成分享 Schema 短链接
   * @param videoPath 视频路径
   * @param options 分享选项
   * @returns 短链接 URL
   */
  async generateShareSchema(options: DouyinShareSchemaOptions) {
    const ticket = await this.getOpenTicket()
    const schemaUrl = await this.douyinApiService.generateShareSchema(ticket, options)
    return schemaUrl
  }

  /**
   * 获取分区列表
   * 抖音平台没有分区概念，返回空数组保持接口兼容
   */
  async getArchiveTypeList(_accountId: string) {
    return []
  }

  /**
   * 获取稿件列表
   * @param accountId 账户ID
   * @returns
   */
  async getArchiveList(
    accountId: string,
    params: {
      ps: number
      pn: number
      status?: ArchiveStatus
    },
  ) {
    this.logger.log('getArchiveList', accountId, params)
    return []
  }

  /**
   * 获取用户数据
   * @param accountId 账户ID
   * @returns
   */
  async getUserStat(accountId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.douyinApiService.getUserStat(accessToken)
  }

  /**
   * 获取稿件数据
   * @param accountId 账户ID
   * @param resourceId 稿件ID
   * @returns
   */
  async getArcStat(accountId: string, resourceId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.douyinApiService.getArcStat(accessToken, resourceId)
  }

  /**
   * 获取稿件增量数据数据
   * @param accountId 账户ID
   * @returns
   */
  async getArcIncStat(accountId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.douyinApiService.getArcIncStat(accessToken)
  }

  /**
   * 删除稿件
   * @param accountId
   * @param postId
   * @returns
   */
  override async deletePost(accountId: string, postId: string): Promise<boolean> {
    const accessToken = await this.getAccountAccessToken(accountId)
    const res = await this.douyinApiService.deleteArchive(accessToken, postId)
    return res.code === 0
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
    const videoId = this.parseDouyinUrl(workLink)
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
   * 解析抖音 URL，提取视频 ID
   * 支持的 URL 格式：
   * - https://www.douyin.com/video/VIDEO_ID
   * - https://www.douyin.com/note/NOTE_ID
   * - https://v.douyin.com/SHORT_CODE
   * - https://www.iesdouyin.com/share/video/VIDEO_ID
   * - https://www.douyin.com/user/self?modal_id=VIDEO_ID
   * @param workLink 抖音链接
   * @returns videoId 或 null
   */
  private parseDouyinUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname.replace('www.', '')

    if (hostname === 'douyin.com') {
      const pathname = url.pathname
      // https://www.douyin.com/video/VIDEO_ID
      if (pathname.startsWith('/video/')) {
        return pathname.split('/video/')[1]?.split(/[?&#/]/)[0] || null
      }
      // https://www.douyin.com/note/NOTE_ID
      if (pathname.startsWith('/note/')) {
        return pathname.split('/note/')[1]?.split(/[?&#/]/)[0] || null
      }
      // https://www.douyin.com/user/self?modal_id=VIDEO_ID
      const modalId = url.searchParams.get('modal_id')
      if (modalId) {
        return modalId
      }
    }
    else if (hostname === 'v.douyin.com') {
      // 短链接，返回短码作为 ID
      return url.pathname.slice(1).split(/[?&#/]/)[0] || null
    }
    else if (hostname === 'iesdouyin.com') {
      // https://www.iesdouyin.com/share/video/VIDEO_ID
      const videoMatch = url.pathname.match(/\/video\/(\d+)/)
      if (videoMatch) {
        return videoMatch[1]
      }
    }

    return null
  }
}
