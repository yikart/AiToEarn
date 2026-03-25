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
import { BilibiliApiService } from '../../libs/bilibili/bilibili-api.service'
import {
  AccessToken,
  AddArchiveData,
  ArchiveStatus,
  VideoUTypes,
} from '../../libs/bilibili/common'
import { PlatformBaseService } from '../base.service'
import { ChannelAccountService } from '../channel-account.service'
import { AuthCallbackResult, AuthTaskInfo } from '../common'
import { PlatformAuthExpiredException } from '../platform.exception'
import { BilibiliAuthInfo } from './common'

@Injectable()
export class BilibiliService extends PlatformBaseService {
  protected override readonly platform: AccountType = AccountType.BILIBILI
  protected override readonly logger = new Logger(BilibiliService.name)
  constructor(
    private readonly redisService: RedisService,
    private readonly bilibiliApiService: BilibiliApiService,
    private readonly channelAccountService: ChannelAccountService,
  ) {
    super()
  }

  async getBilibiliConfig() {
    return config.channel.bilibili
  }

  /**
   * 创建用户授权任务
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
    if (!config.channel.bilibili.id && config.relay) {
      throw new RelayAuthException()
    }
    const taskId = uuidv4()
    const urlInfo = await this.getAuthUrl(taskId, data.type)
    const rRes = await this.redisService.setJson(
      ChannelRedisKeys.authTask('bilibili', taskId),
      {
        taskId,
        spaceId: data.spaceId,
        transpond: options?.transpond,
        accountAddPath: options?.accountAddPath,
        data: {
          state: urlInfo.state,
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
          url: urlInfo.url,
          taskId,
        }
      : null
  }

  /**
   * 获取用户的授权链接
   * @param taskId
   * @param type
   * @returns
   */
  async getAuthUrl(taskId: string, type: 'h5' | 'pc') {
    const gourl = `${config.channel.bilibili.authBackHost}/${taskId}`
    const urlInfo = this.bilibiliApiService.getAuthPage(gourl, type)
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
    }>(ChannelRedisKeys.authTask('bilibili', taskId))
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
      ChannelRedisKeys.accessToken('bilibili', accountId),
    )
    return data
  }

  /**
   * 获取请求头
   * @param accountId
   * @param data
   * @returns
   */
  async generateHeader(
    accountId: string,
    data: {
      body?: { [key: string]: any }
      isForm?: boolean
    },
  ) {
    const accessToken = await this.getAccountAccessToken(accountId)

    const headerData = {
      accessToken,
      ...data,
    }
    return this.bilibiliApiService.generateHeader(headerData)
  }

  /**
   * 获取用户信息
   * @param userId
   * @returns
   */
  async getAccountInfo(accessToken: string) {
    const bilibiliUserInfo
      = await this.bilibiliApiService.getAccountInfo(accessToken)
    if (!bilibiliUserInfo)
      return null
    return bilibiliUserInfo
  }

  private async saveOAuthCredential(
    accountId: string,
    accessTokenInfo: AccessToken,
  ) {
    this.logger.debug({
      path: `bilibili --- saveOAuthCredential --- 1`,
      data: accessTokenInfo,
    })
    const cached = await this.redisService.setJson(
      ChannelRedisKeys.accessToken('bilibili', accountId),
      accessTokenInfo,
    )
    this.logger.debug({
      path: `bilibili --- saveOAuthCredential --- 2`,
      data: cached,
    })
    const persistResult = await this.oauth2CredentialRepository.upsertOne(
      accountId,
      this.platform,
      {
        accessToken: accessTokenInfo.access_token,
        refreshToken: accessTokenInfo.refresh_token,
        accessTokenExpiresAt: accessTokenInfo.expires_in,
      },
    )
    this.logger.debug({
      path: `bilibili --- saveOAuthCredential --- 3`,
      data: persistResult,
    })
    const saved = cached && persistResult
    return saved
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
    const cacheKey = ChannelRedisKeys.authTask('bilibili', taskId)
    const { code, state } = data

    const taskInfo
      = await this.redisService.getJson<AuthTaskInfo<BilibiliAuthInfo>>(cacheKey)
    if (!taskInfo || taskInfo.status !== 0) {
      return {
        status: 0,
        message: '授权超时',
      }
    }

    if (taskInfo.data?.state !== state) {
      return {
        status: 0,
        message: '授权认证失败',
      }
    }

    // 延长授权时间
    void this.redisService.expire(cacheKey, 60 * 3)

    // 获取token，创建账号
    const accessTokenInfo = await this.bilibiliApiService.getAccessToken(code)
    if (!accessTokenInfo) {
      return {
        status: 0,
        message: '平台认证失效',
      }
    }

    // 获取B站用户信息
    const bilibiliUserInfo = await this.getAccountInfo(
      accessTokenInfo.access_token,
    )
    if (!bilibiliUserInfo) {
      return {
        status: 0,
        message: '获取用户信息失败，请稍后再试',
      }
    }

    // 创建本平台的平台账号
    const newData = new NewAccount({
      userId: taskInfo.data.userId,
      type: AccountType.BILIBILI,
      uid: bilibiliUserInfo.openid,
      account: bilibiliUserInfo.openid,
      avatar: bilibiliUserInfo.face,
      nickname: bilibiliUserInfo.name,
      groupId: taskInfo.spaceId,
      status: AccountStatus.NORMAL,
    })
    const accountInfo = await this.channelAccountService.createAccount(
      {
        type: AccountType.BILIBILI,
        uid: bilibiliUserInfo.openid,
      },
      newData,
    )
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
    taskInfo.data.accountId = accountInfo.id
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
      accountType: AccountType.BILIBILI,
      callbackUrl: taskInfo.callbackUrl,
      callbackMethod: taskInfo.callbackMethod,
      taskId,
    }
  }

  private async getOAuth2Credential(
    accountId: string,
  ): Promise<AccessToken | null> {
    let credential = await this.redisService.getJson<AccessToken>(
      ChannelRedisKeys.accessToken('bilibili', accountId),
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
      = await this.bilibiliApiService.refreshAccessToken(refreshToken)
    if (!accessTokenInfo)
      throw new PlatformAuthExpiredException(this.platform, accountId)

    const res = await this.saveOAuthCredential(accountId, accessTokenInfo)
    if (!res)
      throw new PlatformAuthExpiredException(this.platform, accountId)

    return accessTokenInfo.access_token
  }

  /**
   * 查询用户已授权权限列表
   * @returns
   */
  async getAccountScopes(accountId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    const res = await this.bilibiliApiService.getAccountScopes(accessToken)
    return res
  }

  /**
   * 视频初始化
   * @param accountId
   * @param fileName
   * @param utype // 1-单个小文件（不超过100M）。默认值为0
   * @returns
   */
  async videoInit(
    accountId: string,
    fileName: string,
    utype: VideoUTypes = 0,
  ): Promise<string> {
    const accessToken = await this.getAccountAccessToken(accountId)
    if (!accessToken)
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { accountId })
    return this.bilibiliApiService.videoInit(accessToken, fileName, utype)
  }

  /**
   * 文件分片上传
   * @param accountId 账户ID
   * @param fileBuffer
   * @param uploadToken
   * @param partNumber
   */
  async uploadVideoPart(
    accountId: string,
    fileBuffer: Buffer,
    uploadToken: string,
    partNumber: number,
  ) {
    const accessToken = await this.getAccountAccessToken(accountId)
    if (!accessToken)
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { accountId })

    return await this.bilibiliApiService.uploadVideoPart(
      accessToken,
      fileBuffer,
      uploadToken,
      partNumber,
    )
  }

  /**
   * 文件分片合片
   * @param accountId 账户ID
   * @param file base64 字符串
   */
  async videoComplete(accountId: string, uploadToken: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    if (!accessToken)
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { accountId })

    const res = await this.bilibiliApiService.videoComplete(
      accessToken,
      uploadToken,
    )

    return res
  }

  /**
   * 封面上传
   * @param accountId 账户ID
   * @param fileBase64 base64 字符串
   */
  async coverUpload(accountId: string, fileBase64: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    if (!accessToken)
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { accountId })

    const res = await this.bilibiliApiService.coverUpload(
      accessToken,
      fileBase64,
    )

    return res
  }

  /**
   * 小视频上传 100M以下
   * @param accountId 账户ID
   * @param file base64 字符串
   * @param uploadToken 上传标识
   */
  async uploadLitVideo(
    accountId: string,
    fileBase64: string,
    uploadToken: string,
  ) {
    const accessToken = await this.getAccountAccessToken(accountId)
    if (!accessToken)
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { accountId })

    const file = Buffer.from(fileBase64, 'base64')
    const res = await this.bilibiliApiService.uploadLitVideo(
      accessToken,
      file,
      uploadToken,
    )

    return res
  }

  /**
   * 视频稿件提交
   * @param accessToken
   * @param uploadToken
   * @param data
   * @returns
   */
  async archiveAddByUtoken(
    accountId: string,
    uploadToken: string,
    data: AddArchiveData,
  ): Promise<string> {
    const accessToken = await this.getAccountAccessToken(accountId)

    return this.bilibiliApiService.archiveAddByUtoken(
      accessToken,
      uploadToken,
      data,
    )
  }

  /**
   * 分区查询
   * @param accountId
   * @returns
   */
  async archiveTypeList(accountId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.bilibiliApiService.archiveTypeList(accessToken)
  }

  /**
   * 获取稿件列表
   * @param accountId
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
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.bilibiliApiService.getArchiveList(accessToken, params)
  }

  /**
   * 获取用户数据
   * @param accountId
   * @returns
   */
  async getUserStat(accountId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.bilibiliApiService.getUserStat(accessToken)
  }

  /**
   * 获取稿件数据
   * @param accountId
   * @param resourceId
   * @returns
   */
  async getArcStat(accountId: string, resourceId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.bilibiliApiService.getArcStat(accessToken, resourceId)
  }

  /**
   * 获取稿件增量数据数据
   * @param accountId
   * @returns
   */
  async getArcIncStat(accountId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.bilibiliApiService.getArcIncStat(accessToken)
  }

  /**
   * 删除稿件
   * @param accountId
   * @param postId
   * @returns
   */
  override async deletePost(accountId: string, postId: string): Promise<boolean> {
    const accessToken = await this.getAccountAccessToken(accountId)
    const res = await this.bilibiliApiService.deleteArchive(accessToken, postId)
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
    const videoId = this.parseBilibiliUrl(workLink)
    const resolvedDataId = videoId || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: resolvedDataId,
      uniqueId: `${accountType}_${resolvedDataId}`,
      type: PublishType.VIDEO,
      videoType: 'long',
    }
  }

  /**
   * 解析 Bilibili URL，提取视频 ID
   * 支持的 URL 格式：
   * - https://www.bilibili.com/video/BVID
   * - https://www.bilibili.com/video/avAID
   * - https://b23.tv/SHORT_CODE
   * - https://m.bilibili.com/video/BVID
   * @param workLink Bilibili 链接
   * @returns videoId 或 null
   */
  private parseBilibiliUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname.replace('www.', '')

    if (hostname === 'bilibili.com' || hostname === 'm.bilibili.com') {
      const pathname = url.pathname
      // https://www.bilibili.com/video/BV1xx411c7mD
      // https://www.bilibili.com/video/av170001
      const videoMatch = pathname.match(/\/video\/(BV\w+|av\d+)/)
      if (videoMatch) {
        return videoMatch[1]
      }
    }
    else if (hostname === 'b23.tv') {
      // 短链接，返回短码作为 ID
      return url.pathname.slice(1).split(/[?&#/]/)[0] || null
    }

    return null
  }
}
