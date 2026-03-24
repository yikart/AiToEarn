import { Injectable, Logger } from '@nestjs/common'
import { AccountType, AppException, getErrorMessage, ResponseCode } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'
import { Auth, google } from 'googleapis'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../../../../config'
import { RelayAuthException } from '../../../relay/relay-auth.exception'
import { ChannelRedisKeys } from '../../channel.constants'
import { PlatformBaseService } from '../base.service'
import { ChannelAccountService } from '../channel-account.service'
import { AuthCallbackResult } from '../common'
import { GoogleBusinessCredential } from './google-business.dto'

interface AuthTaskInfo {
  state: string
  userId: string
  status: 0 | 1
  accountId?: string
  callbackUrl?: string
  callbackMethod?: 'GET' | 'POST'
}

interface GoogleAccountInfo {
  name: string
  accountName: string
  type: string
}

interface GoogleLocationInfo {
  name: string
  title: string
  storefrontAddress?: {
    formattedAddress?: string
  }
  profile?: {
    coverPhoto?: {
      url?: string
    }
  }
}

@Injectable()
export class GoogleBusinessService extends PlatformBaseService {
  protected override readonly platform: string = AccountType.GOOGLE_BUSINESS
  protected override readonly logger = new Logger(GoogleBusinessService.name)

  private readonly oauth2Client: Auth.OAuth2Client
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly redirectUri: string
  private readonly accountManagementUrl = 'https://mybusinessaccountmanagement.googleapis.com/v1'
  private readonly businessInfoUrl = 'https://mybusinessbusinessinformation.googleapis.com/v1'

  constructor(
    private readonly redisService: RedisService,
    private readonly channelAccountService: ChannelAccountService,
  ) {
    super()
    this.clientId = config.channel.googleBusiness?.clientId || ''
    this.clientSecret = config.channel.googleBusiness?.clientSecret || ''
    this.redirectUri = config.channel.googleBusiness?.redirectUri || ''

    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    )
  }

  /**
   * 从 oauth2Credential 集合读取 Google Business 凭证
   */
  async getCredential(accountId: string): Promise<GoogleBusinessCredential | null> {
    const oauth2 = await this.oauth2CredentialRepository.getOne(accountId, AccountType.GOOGLE_BUSINESS)
    if (!oauth2?.raw)
      return null
    return JSON.parse(oauth2.raw) as GoogleBusinessCredential
  }

  /**
   * 保存 Google Business 凭证到 oauth2Credential 集合
   */
  private async saveCredential(accountId: string, credential: GoogleBusinessCredential): Promise<void> {
    await this.oauth2CredentialRepository.upsertOne(accountId, AccountType.GOOGLE_BUSINESS, {
      accessToken: credential.accessToken,
      refreshToken: credential.refreshToken,
      accessTokenExpiresAt: Math.floor(new Date(credential.expiresAt).getTime() / 1000),
      raw: JSON.stringify(credential),
    })
  }

  /**
   * 生成授权 URL
   */
  async getAuthUrl(
    userId: string,
    callbackUrl?: string,
    callbackMethod?: 'GET' | 'POST',
  ): Promise<{ url: string, state: string }> {
    if (!config.channel.googleBusiness?.clientId && config.relay) {
      throw new RelayAuthException()
    }
    const state = uuidv4()

    // 保存授权任务到 Redis
    await this.redisService.setJson<AuthTaskInfo>(
      ChannelRedisKeys.authTask('google_business', state),
      { state, userId, status: 0, callbackUrl, callbackMethod },
      60 * 10, // 10 分钟过期
    )

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/business.manage'],
      state,
      prompt: 'consent',
    })

    return { url, state }
  }

  /**
   * 处理 OAuth 回调
   */
  async handleCallback(
    code: string,
    state: string,
  ): Promise<AuthCallbackResult> {
    // 验证 state
    const authTask = await this.redisService.getJson<AuthTaskInfo>(
      ChannelRedisKeys.authTask('google_business', state),
    )

    if (!authTask || authTask.state !== state) {
      this.logger.error(`无效的授权状态: ${state}`)
      return { status: 0, message: '无效的授权状态' }
    }

    try {
      // 获取 tokens
      const { tokens } = await this.oauth2Client.getToken(code)

      if (!tokens.access_token || !tokens.refresh_token) {
        return { status: 0, message: '获取访问令牌失败' }
      }

      // 获取 Google 账户信息
      const accountInfo = await this.getGoogleAccountInfo(tokens.access_token)
      if (!accountInfo) {
        return { status: 0, message: '获取 Google 账户信息失败' }
      }

      // 获取店铺信息（单店模式取第一个）
      const location = await this.getFirstLocation(tokens.access_token, accountInfo.name)
      if (!location) {
        return { status: 0, message: '未找到关联的店铺，请先在 Google Business Profile 中创建店铺' }
      }

      // 构建凭证
      const credential: GoogleBusinessCredential = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + (tokens.expiry_date || 3600 * 1000)),
        accountId: accountInfo.name,
        accountName: accountInfo.accountName,
        locationId: location.name,
        locationName: location.title,
        locationAddress: location.storefrontAddress?.formattedAddress,
      }

      // 创建或更新账户
      const account = await this.channelAccountService.createAccount(
        { type: AccountType.GOOGLE_BUSINESS, uid: location.name },
        {
          userId: authTask.userId,
          type: AccountType.GOOGLE_BUSINESS,
          uid: location.name,
          nickname: location.title,
          avatar: location.profile?.coverPhoto?.url || '',
          status: AccountStatus.NORMAL,
        },
      )

      if (!account) {
        return { status: 0, message: '创建账号失败' }
      }

      // 保存凭证到 oauth2Credential 集合
      await this.saveCredential(account.id, credential)

      // 更新 Redis 状态
      await this.redisService.setJson<AuthTaskInfo>(
        ChannelRedisKeys.authTask('google_business', state),
        { ...authTask, status: 1, accountId: account.id },
        60 * 5,
      )

      // 清理授权任务
      await this.redisService.del(ChannelRedisKeys.authTask('google_business', state))

      return {
        status: 1,
        message: '授权成功',
        accountId: account.id,
        nickname: account.nickname,
        avatar: account.avatar,
        platformUid: account.uid,
        accountType: AccountType.GOOGLE_BUSINESS,
        callbackUrl: authTask.callbackUrl,
        callbackMethod: authTask.callbackMethod,
        taskId: state,
      }
    }
    catch (error) {
      this.logger.error('Google Business OAuth 回调处理失败', error)
      return { status: 0, message: `授权失败: ${getErrorMessage(error)}` }
    }
  }

  /**
   * 获取有效的 Access Token（自动刷新）
   */
  async getValidAccessToken(accountId: string): Promise<string> {
    await this.ensureLocalAccount(accountId)
    const credential = await this.getCredential(accountId)
    if (!credential) {
      throw new AppException(ResponseCode.ChannelRefreshTokenFailed)
    }

    const expiresAt = new Date(credential.expiresAt)

    // 提前 5 分钟刷新
    if (Date.now() >= expiresAt.getTime() - 5 * 60 * 1000) {
      return this.refreshAccessToken(accountId, credential)
    }

    return credential.accessToken
  }

  /**
   * 刷新 Access Token
   */
  private async refreshAccessToken(
    accountId: string,
    credential: GoogleBusinessCredential,
  ): Promise<string> {
    this.oauth2Client.setCredentials({
      refresh_token: credential.refreshToken,
    })

    const { credentials } = await this.oauth2Client.refreshAccessToken()

    if (!credentials.access_token) {
      throw new AppException(ResponseCode.ChannelRefreshTokenFailed)
    }

    // 更新凭证
    const newCredential: GoogleBusinessCredential = {
      ...credential,
      accessToken: credentials.access_token,
      expiresAt: new Date(credentials.expiry_date || Date.now() + 3600 * 1000),
    }

    await this.saveCredential(accountId, newCredential)

    return credentials.access_token
  }

  /**
   * 获取 Google 账户信息
   */
  private async getGoogleAccountInfo(accessToken: string): Promise<GoogleAccountInfo | null> {
    try {
      const response = await fetch(`${this.accountManagementUrl}/accounts`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        this.logger.error(`获取 Google 账户信息失败: ${response.status}`)
        return null
      }

      const data = await response.json() as any
      return data.accounts?.[0] || null
    }
    catch (error) {
      this.logger.error('获取 Google 账户信息异常', error)
      return null
    }
  }

  /**
   * 获取第一个店铺（单店模式）
   */
  private async getFirstLocation(
    accessToken: string,
    accountName: string,
  ): Promise<GoogleLocationInfo | null> {
    try {
      const response = await fetch(
        `${this.businessInfoUrl}/${accountName}/locations?readMask=name,title,storefrontAddress,profile`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )

      if (!response.ok) {
        this.logger.error(`获取店铺信息失败: ${response.status}`)
        return null
      }

      const data = await response.json() as any
      return data.locations?.[0] || null
    }
    catch (error) {
      this.logger.error('获取店铺信息异常', error)
      return null
    }
  }

  /**
   * 获取授权状态
   */
  async getAuthStatus(state: string): Promise<AuthTaskInfo | null> {
    return this.redisService.getJson<AuthTaskInfo>(ChannelRedisKeys.authTask('google_business', state))
  }

  /**
   * 获取 Access Token 状态
   */
  async getAccessTokenStatus(accountId: string): Promise<number> {
    await this.ensureLocalAccount(accountId)
    const credential = await this.getCredential(accountId)
    if (!credential || !credential.accessToken) {
      this.updateAccountStatus(accountId, 0)
      return 0
    }

    const expiresAt = new Date(credential.expiresAt)
    const status = expiresAt.getTime() > Date.now() ? 1 : 0
    this.updateAccountStatus(accountId, status)
    return status
  }

  /**
   * 获取作品链接信息（Google Business 帖子不支持通过链接获取）
   */
  async getWorkLinkInfo(
    _accountType: AccountType,
    _workLink: string,
    _dataId?: string,
    _accountId?: string,
  ): Promise<{
    dataId: string
    uniqueId: string
    type: string
    videoType?: 'short' | 'long'
  }> {
    throw new AppException(ResponseCode.PlatformNotSupported)
  }
}
