import { createHash, randomBytes } from 'node:crypto'
import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  AccountStatus,
  AccountType,
  NewAccount,
} from '@yikart/aitoearn-server-client'
import { Account, OAuth2CredentialRepository } from '@yikart/channel-db'
import { AppException, getErrorMessage, getErrorStack, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios'
import { getCurrentTimestamp } from '../../../../common/utils/time.util'
import { config } from '../../../../config'
import { RelayAuthException } from '../../../relay/relay-auth.exception'
import { ChannelRedisKeys } from '../../channel.constants'
import {
  FacebookPageDetailRequest,
  FacebookPageDetailResponse,
} from '../../libs/facebook/facebook.interfaces'
import { ChannelAccountService } from '../channel-account.service'
import {
  META_TIME_CONSTANTS,
  metaOAuth2ConfigMap,
} from './constants'
import {
  FacebookAccountResponse,
  FacebookPage,
  FacebookPageCredentials,
  MetaOAuth2TaskInfo,
  MetaOAuth2TaskStatus,
  MetaUserOAuthCredential,
  OAuth2Credential,
  SelectFacebookPagesResponse,
} from './meta.interfaces'

@Injectable()
export class MetaService {
  private prefix = 'meta'
  private readonly redisService: RedisService
  private readonly channelAccountService: ChannelAccountService
  private readonly logger = new Logger(MetaService.name)

  @Inject(OAuth2CredentialRepository)
  protected readonly oauth2CredentialRepository: OAuth2CredentialRepository

  constructor(
    redisService: RedisService,
    channelAccountService: ChannelAccountService,
  ) {
    this.redisService = redisService
    this.channelAccountService = channelAccountService
  }

  async generateAuthorizeURL(
    userId: string,
    platform: string,
    oAuth2Scopes?: string[],
    spaceId = '',
    callbackUrl?: string,
    callbackMethod?: 'GET' | 'POST',
  ) {
    this.logger.log(
      `Generating authorize URL for userId: ${userId}, platform: ${platform}}`,
    )
    const oauthConfig = config.channel.oauth[platform as keyof typeof config.channel.oauth]
    if (!oauthConfig.clientId && config.relay) {
      throw new RelayAuthException()
    }
    const scopes
      = oAuth2Scopes
        || oauthConfig.scopes
        || metaOAuth2ConfigMap[platform].defaultScopes
    const state = randomBytes(32).toString('hex')
    const scopeSeparator = metaOAuth2ConfigMap[platform].scopesSeparator
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      response_type: 'code',
      state,
    })
    if (scopes.length > 1) {
      params.append('scope', scopes.join(scopeSeparator))
    }
    else {
      params.append('scope', scopes[0])
    }
    if (oauthConfig.configId) {
      params.append('config_id', oauthConfig.configId)
    }
    const pkceEnabled = metaOAuth2ConfigMap[platform].pkce
    let codeVerifier = ''
    let codeChallenge = ''
    if (pkceEnabled) {
      params.append('code_challenge_method', 'S256')
      codeVerifier = randomBytes(64).toString('hex')
      codeChallenge = createHash('sha256')
        .update(codeVerifier)
        .digest('base64url')
      params.append('code_challenge', codeChallenge)
    }

    const authorizeURL = new URL(metaOAuth2ConfigMap[platform].authURL)
    authorizeURL.search = params.toString()
    this.logger.debug(`Generated meta auth URL: ${authorizeURL.toString()}`)

    const success = await this.redisService.setJson(
      ChannelRedisKeys.authTask('meta', state),
      {
        state,
        status: 0,
        userId,
        pkce: pkceEnabled,
        codeVerifier,
        platform,
        spaceId,
        callbackUrl,
        callbackMethod,
      },
      META_TIME_CONSTANTS.AUTH_TASK_EXPIRE,
    )
    return success
      ? { url: authorizeURL.toString(), taskId: state, state }
      : null
  }

  /**
   * 生成不需用户授权URL（Instagram）
   */
  async getNoUserAuthUrl(materialGroupId: string) {
    const platform = 'instagram'
    const oauthConfig = config.channel.oauth[platform]
    const scopes = oauthConfig.scopes || metaOAuth2ConfigMap[platform].defaultScopes
    const scopeSeparator = metaOAuth2ConfigMap[platform].scopesSeparator

    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.promotionRedirectUri,
      response_type: 'code',
      state: materialGroupId,
    })

    if (scopes.length > 1) {
      params.append('scope', scopes.join(scopeSeparator))
    }
    else {
      params.append('scope', scopes[0])
    }

    const authorizeURL = new URL(metaOAuth2ConfigMap[platform].authURL)
    authorizeURL.search = params.toString()

    this.logger.debug(`Generated Instagram no-user auth URL: ${authorizeURL.toString()}`)

    return { url: authorizeURL.toString(), state: materialGroupId }
  }

  /**
   * 处理Instagram授权重定向 - 创建账号并重定向到指定URL
   */
  async handleAuthRedirect(code: string, state: string): Promise<{ redirectUrl: string }> {
    const platform = 'instagram'
    this.logger.log({
      path: 'meta handleAuthRedirect --- 0 start',
      data: { code: `${code.substring(0, 20)}...`, state },
    })

    // 获取访问令牌 - 使用promotionRedirectUri
    let credential: OAuth2Credential | null = null
    try {
      credential = await this.getOAuthCredentialForRedirect(code, platform)
    }
    catch (error) {
      this.logger.error({
        path: 'meta handleAuthRedirect --- error getting credential',
        error: (error as Error).message,
        stack: (error as Error).stack,
      })
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { step: 'getOAuthCredential', error: (error as Error).message })
    }

    if (!credential) {
      this.logger.error({
        path: 'meta handleAuthRedirect --- credential is null',
      })
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { step: 'getOAuthCredential', error: 'credential is null' })
    }

    this.logger.log({
      path: 'meta handleAuthRedirect --- 1 got credential',
      data: { hasAccessToken: !!credential.access_token },
    })

    // 获取用户信息
    let userProfile: any = null
    try {
      userProfile = await this.getUserProfile(credential.access_token, platform)
    }
    catch (error) {
      this.logger.error({
        path: 'meta handleAuthRedirect --- error getting user profile',
        error: (error as Error).message,
        stack: (error as Error).stack,
      })
      throw new AppException(ResponseCode.ChannelAccountInfoFailed, { step: 'getUserProfile', error: (error as Error).message })
    }

    if (!userProfile) {
      this.logger.error({
        path: 'meta handleAuthRedirect --- userProfile is null',
      })
      throw new AppException(ResponseCode.ChannelAccountInfoFailed, { step: 'getUserProfile', error: 'userProfile is null' })
    }

    this.logger.log({
      path: 'meta handleAuthRedirect --- 2 got userProfile',
      data: { id: userProfile.id, username: userProfile.username },
    })

    // 创建账号数据（无用户授权场景，userId为空）
    const accountType = platform as AccountType
    const newAccountData = new NewAccount({
      userId: '',
      type: accountType,
      uid: userProfile.id || userProfile.sub,
      account: userProfile.username || userProfile.name,
      avatar: userProfile.profile_picture_url || '',
      nickname: userProfile.username || userProfile.name,
      lastStatsTime: new Date(),
      loginTime: new Date(),
      status: AccountStatus.NORMAL,
    })

    let accountInfo: any = null
    try {
      accountInfo = await this.channelAccountService.createAccount(
        {
          type: accountType,
          uid: userProfile.id || userProfile.sub,
        },
        newAccountData,
      )
    }
    catch (error) {
      this.logger.error({
        path: 'meta handleAuthRedirect --- error creating account',
        error: (error as Error).message,
        stack: (error as Error).stack,
      })
      throw new AppException(ResponseCode.AccountCreateFailed, { step: 'createAccount', error: (error as Error).message })
    }

    this.logger.log({
      path: 'meta handleAuthRedirect --- 3 created account',
      data: { accountId: accountInfo?.id },
    })

    if (!accountInfo) {
      this.logger.error({
        path: 'meta handleAuthRedirect --- accountInfo is null',
      })
      throw new AppException(ResponseCode.AccountCreateFailed, { step: 'createAccount', error: 'accountInfo is null' })
    }

    // 保存访问令牌
    try {
      const userCredential = {
        ...credential,
        user_id: userProfile.id || userProfile.sub,
      } as MetaUserOAuthCredential

      await this.saveOAuthCredential(accountInfo.id, userCredential, platform)
    }
    catch (error) {
      this.logger.error({
        path: 'meta handleAuthRedirect --- error saving credential',
        error: (error as Error).message,
        stack: (error as Error).stack,
      })
      // 不抛出异常，继续执行
    }

    // 构建重定向URL
    const baseUrl = config.channel.oauth[platform as keyof typeof config.channel.oauth].promotionBaseUrl
    const redirectUrl = `${baseUrl}?accountId=${accountInfo.id}&materialGroupId=${state}&platform=${platform}`

    this.logger.log({
      path: 'meta handleAuthRedirect --- 4 success',
      data: { redirectUrl },
    })

    return { redirectUrl }
  }

  private async getOAuthCredentialForRedirect(
    code: string,
    platform: string,
  ): Promise<OAuth2Credential | null> {
    const accessTokenURL = metaOAuth2ConfigMap[platform].accessTokenURL
    const longLivedAccessTokenURL = metaOAuth2ConfigMap[platform].longLivedAccessTokenURL || ''
    const oauthPlatformConfig = config.channel.oauth[platform as keyof typeof config.channel.oauth]
    const redirectURI = oauthPlatformConfig.promotionRedirectUri
    const clientId = oauthPlatformConfig.clientId
    const clientSecret = oauthPlatformConfig.clientSecret
    const requestAccessTokenMethod = metaOAuth2ConfigMap[platform].requestAccessTokenMethod

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectURI,
    })

    this.logger.log(`Requesting access token with params: ${params.toString()}`)

    const reqConfig: AxiosRequestConfig = {
      method: requestAccessTokenMethod,
      url: accessTokenURL,
    }

    if (requestAccessTokenMethod === 'POST') {
      reqConfig.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
      reqConfig.data = params.toString()
    }
    else {
      reqConfig.params = params
    }

    try {
      const response: AxiosResponse<OAuth2Credential> = await axios.request(reqConfig)
      this.logger.log(`Access token response: ${JSON.stringify(response.data)}`)

      if (longLivedAccessTokenURL) {
        const llAccessTokenReqParamsMap = metaOAuth2ConfigMap[platform].longLivedParamsMap
        const lParams: Record<string, string> = {
          client_id: clientId,
          client_secret: clientSecret,
        }
        const accessTokenKey = llAccessTokenReqParamsMap?.['access_token'] || 'access_token'
        lParams[accessTokenKey] = response.data.access_token
        lParams['grant_type'] = metaOAuth2ConfigMap[platform].longLivedGrantType || 'ig_exchange_token'

        const longLivedAccessTokenReqParams = new URLSearchParams(lParams)
        const llTokenResponse: AxiosResponse<OAuth2Credential> = await axios.get(
          longLivedAccessTokenURL,
          { params: longLivedAccessTokenReqParams },
        )
        const credential = llTokenResponse.data
        if (!credential.expires_in) {
          credential.expires_in = META_TIME_CONSTANTS.FACEBOOK_LONG_LIVED_TOKEN_DEFAULT_EXPIRE
        }
        return credential
      }

      return response.data
    }
    catch (error) {
      if (isAxiosError(error) && error.response) {
        this.logger.error(
          `Error getting access token: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        )
      }
      this.logger.error(`Failed to get access token: ${getErrorMessage(error)}`)
      return null
    }
  }

  async getOAuth2TaskInfo(state: string) {
    const result = await this.redisService.getJson<MetaOAuth2TaskStatus>(
      ChannelRedisKeys.authTask('meta', state),
    )
    if (!result) {
      this.logger.warn(`OAuth2 task not found for state: ${state}`)
      return {
        state,
        status: 0,
      }
    }
    return result
  }

  async getOAuthCredential(
    code: string,
    info: MetaOAuth2TaskInfo,
  ): Promise<OAuth2Credential> {
    const platform = info.platform.toLowerCase()
    const pkceEnabled = metaOAuth2ConfigMap[platform].pkce
    const accessTokenURL = metaOAuth2ConfigMap[platform].accessTokenURL
    const longLivedAccessTokenURL
      = metaOAuth2ConfigMap[platform].longLivedAccessTokenURL || ''
    const oauthPlatformConfig = config.channel.oauth[platform as keyof typeof config.channel.oauth]
    const redirectURI = oauthPlatformConfig.redirectUri
    const clientId = oauthPlatformConfig.clientId
    const clientSecret = oauthPlatformConfig.clientSecret
    const requestAccessTokenMethod
      = metaOAuth2ConfigMap[platform].requestAccessTokenMethod

    const params = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectURI,
    })
    if (pkceEnabled) {
      params.append('code_verifier', info.codeVerifier || '')
    }
    else {
      params.append('client_secret', clientSecret)
    }
    this.logger.log(
      `Requesting access token with params: ${params.toString()}`,
    )
    const reqConfig: AxiosRequestConfig = {
      method: requestAccessTokenMethod,
      url: accessTokenURL,
    }

    if (requestAccessTokenMethod === 'POST') {
      reqConfig.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
      reqConfig.data = params.toString()
    }
    else {
      reqConfig.params = params
    }
    this.logger.log(
      `Requesting access token with config: ${JSON.stringify(reqConfig)}`,
    )
    const response: AxiosResponse<OAuth2Credential>
      = await axios.request(reqConfig)

    this.logger.log(`Access token response: ${JSON.stringify(response.data)}`)
    if (longLivedAccessTokenURL) {
      const llAccessTokenReqParamsMap
        = metaOAuth2ConfigMap[platform].longLivedParamsMap
      const lParams: Record<string, string> = {
        client_id: clientId,
        client_secret: clientSecret,
      }
      const accessTokenKey
        = llAccessTokenReqParamsMap?.['access_token'] || 'access_token'
      lParams[accessTokenKey] = response.data['access_token']
      lParams['grant_type']
        = metaOAuth2ConfigMap[platform].longLivedGrantType || 'fb_exchange_token'

      const longLivedAccessTokenReqParams = new URLSearchParams(lParams)
      const llTokenResponse: AxiosResponse<OAuth2Credential> = await axios.get(
        longLivedAccessTokenURL,
        {
          params: longLivedAccessTokenReqParams,
        },
      )
      const credential = llTokenResponse.data
      if (!credential.expires_in) {
        credential.expires_in
          = META_TIME_CONSTANTS.FACEBOOK_LONG_LIVED_TOKEN_DEFAULT_EXPIRE
      }
      return credential
    }
    else {
      return response.data
    }
  }

  async getPageDetails(
    pageId: string,
    pageAccessToken: string,
    query: FacebookPageDetailRequest,
  ): Promise<FacebookPageDetailResponse> {
    try {
      const url = `${metaOAuth2ConfigMap['facebook'].apiBaseUrl}/${pageId}`
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
        },
        params: query,
      }
      const response: AxiosResponse<FacebookPageDetailResponse>
        = await axios.get(url, config)
      return response.data
    }
    catch (error) {
      if (isAxiosError(error) && error.response) {
        this.logger.error(
          `Error fetching page details pageId: ${pageId}, req: ${JSON.stringify(query)}: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        )
      }
      throw new Error(
        `Error fetching page details, pageId: ${pageId}, req: ${JSON.stringify(query)}`,
      )
    }
  }

  async getUserProfile(
    accessToken: string,
    platform: string,
  ): Promise<Record<string, any>> {
    const userProfileURL = metaOAuth2ConfigMap[platform].userProfileURL
    const url = new URL(userProfileURL)
    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    const response: AxiosResponse<Record<string, any>> = await axios.get(
      url.toString(),
      config,
    )
    return response.data
  }

  async getFacebookPageList(userId: string): Promise<FacebookPage[]> {
    const key = ChannelRedisKeys.userPageList('facebook', userId)
    const pages = await this.redisService.getJson<FacebookPage[]>(key)
    if (pages) {
      return pages
    }
    return []
  }

  async selectFacebookPages(
    userId: string,
    pageIds: string[],
  ): Promise<SelectFacebookPagesResponse> {
    const result: SelectFacebookPagesResponse = {
      success: false,
      message: '',
      selectedPageIds: [],
    }
    const key = ChannelRedisKeys.userPageList('facebook', userId)
    const pages = await this.redisService.getJson<FacebookPage[]>(key)
    if (!pages || pages.length === 0) {
      this.logger.warn(`No Facebook pages found for userId: ${userId}`)
      result.message = 'No Facebook pages found for the user.'
      return result
    }
    const pageMap = new Map<string, FacebookPage>()
    for (const page of pages) {
      pageMap.set(page.id, page)
    }

    for (const pageId of pageIds) {
      const page = pageMap.get(pageId)
      if (!page) {
        this.logger.warn(
          `Page ID ${pageId} not found in user's Facebook pages`,
        )
        result.message = `Page ID ${pageId} not found in user's Facebook pages`
        return result
      }
      const pageCredentialKey = ChannelRedisKeys.pageAccessToken(
        'facebook',
        pageId,
      )
      const pageCredential
        = await this.redisService.getJson<FacebookPageCredentials>(
          pageCredentialKey,
        )
      if (!pageCredential) {
        result.message = `Page access token not found for userId: ${userId}, pageId: ${pageId}`
        return result
      }
      const accountInfo = await this.createAccount(
        userId,
        AccountType.FACEBOOK,
        {
          id: pageId,
          groupId: pageCredential.spaceId,
          name: page.name,
          profile_picture_url: page.profile_picture_url,
        },
      )

      if (!accountInfo) {
        this.logger.error(
          `Failed to create account for userId: ${userId}, pageId: ${pageId}`,
        )
        result.message = `Failed to create account for userId: ${userId}, pageId: ${pageId}`
        return result
      }
      const newPageCredentialKey = ChannelRedisKeys.pageAccessToken(
        'facebook',
        accountInfo.id,
      )
      await this.redisService.setJson(newPageCredentialKey, pageCredential)
      await this.redisService.del(pageCredentialKey)
      await this.oauth2CredentialRepository.upsertOne(
        accountInfo.id,
        AccountType.FACEBOOK,
        {
          accessToken: pageCredential.access_token,
          refreshToken: '',
          accessTokenExpiresAt: pageCredential.expires_in,
          raw: JSON.stringify(pageCredential),
        },
      )
      const previousFacebookCredentialKey = ChannelRedisKeys.accessToken(
        'facebook',
        userId,
      )
      const newFacebookCredentialKey = ChannelRedisKeys.accessToken(
        'facebook',
        pageCredential.facebook_user_id,
      )
      const facebookCredential
        = await this.redisService.getJson<MetaUserOAuthCredential>(
          previousFacebookCredentialKey,
        )
      if (facebookCredential) {
        await this.redisService.setJson(
          newFacebookCredentialKey,
          facebookCredential,
        )
        await this.redisService.del(previousFacebookCredentialKey)
      }
      else {
        this.logger.warn(
          `No Facebook user credential found for userId: ${userId} when selecting pageId: ${pageId}`,
        )
        throw new Error(
          `No Facebook user credential found for userId: ${userId} when selecting pageId: ${pageId}`,
        )
      }
      result.selectedPageIds.push(pageId)
    }
    result.success = true
    result.message = 'Selected Facebook pages successfully.'
    return result
  }

  async getFacebookAccount(accessToken: string, pageAccountURL: string) {
    try {
      const response: AxiosResponse<FacebookAccountResponse> = await axios.get(
        pageAccountURL,
        {
          params: {
            access_token: accessToken,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      const data = response.data.data || []
      return data
    }
    catch (error) {
      if (isAxiosError(error) && error.response) {
        this.logger.error(
          `Error fetching user account, status: ${error.response.status}, response: ${error.response.data}`,
        )
      }
      this.logger.error(
        `Failed to fetch user account: ${getErrorMessage(error)}, stack: ${getErrorStack(error) ?? 'N/A'}`,
      )
      return []
    }
  }

  async postOAuth2Callback(
    state: string,
    authData: { code: string, state: string },
  ) {
    const { code } = authData

    const authTaskInfo = await this.redisService.getJson<MetaOAuth2TaskInfo>(
      ChannelRedisKeys.authTask('meta', state),
    )
    if (!authTaskInfo) {
      this.logger.error(`OAuth task not found for state: ${state}`)
      return {
        status: 0,
        message: '授权任务不存在或已过期',
      }
    }

    void this.redisService.expire(
      ChannelRedisKeys.authTask('meta', state),
      META_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )

    try {
      // get access token
      const credential = await this.getOAuthCredential(code, authTaskInfo)
      if (!credential) {
        this.logger.error(`Failed to get access token for state: ${state}`)
        return {
          status: 0,
          message: '获取访问令牌失败',
        }
      }
      this.logger.log(
        `Access token retrieved for userId: ${authTaskInfo.userId}, platform: ${authTaskInfo.platform}, credential: ${JSON.stringify(credential)}`,
      )

      // fetch user profile
      const userProfile = await this.getUserProfile(
        credential.access_token,
        authTaskInfo.platform,
      )
      if (!userProfile) {
        this.logger.error(`Failed to fetch user profile for platform: ${authTaskInfo.platform}`)
        return {
          status: 0,
          message: '获取用户信息失败 (Failed to fetch user profile)',
        }
      }
      userProfile['groupId'] = authTaskInfo.spaceId

      if (metaOAuth2ConfigMap[authTaskInfo.platform].pageAccountURL) {
        this.logger.log(
          `Fetching Facebook pages for userId: ${authTaskInfo.userId}, platform: ${authTaskInfo.platform}`,
        )
        const pageAccounts = await this.getFacebookAccount(
          credential.access_token,
          metaOAuth2ConfigMap[authTaskInfo.platform].pageAccountURL,
        )
        this.logger.log(
          `Fetched ${pageAccounts.length} pages for userId: ${authTaskInfo.userId}, platform: ${authTaskInfo.platform}`,
        )
        if (pageAccounts.length === 0) {
          return {
            status: 0,
            message:
              '未找到相关的 Facebook 公共主页。请确保您的账户下至少有一个公共主页，并且已授予必要的权限。 (No Facebook pages found. Please ensure you have at least one Page and granted permissions.)',
          }
        }
        if (pageAccounts.length > 0) {
          const pages: FacebookPage[] = []
          for (const pageAccount of pageAccounts) {
            const pageDetail = await this.getPageDetails(
              pageAccount.id,
              pageAccount.access_token,
              {
                fields: 'picture',
              },
            )
            const expiredTime
              = getCurrentTimestamp()
                + credential.expires_in
                - META_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
            await this.redisService.setJson(
              ChannelRedisKeys.pageAccessToken(
                authTaskInfo.platform,
                pageAccount.id,
              ),
              {
                ...pageAccount,
                facebook_user_id: userProfile['id'],
                expires_in: expiredTime,
                spaceId: authTaskInfo.spaceId,
              } as FacebookPageCredentials,
            )
            pages.push({
              id: pageAccount.id,
              name: pageAccount.name,
              profile_picture_url: pageDetail?.picture?.data?.url,
            })
          }
          await this.redisService.setJson(
            ChannelRedisKeys.userPageList(
              authTaskInfo.platform,
              authTaskInfo.userId,
            ),
            pages,
          )
        }
      }

      const accountType = authTaskInfo.platform.toLowerCase() as AccountType
      const accountInfo = await this.createAccount(
        authTaskInfo.userId,
        accountType,
        userProfile,
      )
      if (!accountInfo) {
        this.logger.error(
          `Failed to create account for userId: ${authTaskInfo.userId}, twitterId: ${userProfile['id']}`,
        )
        return null
      }
      this.logger.log(
        `Account created for userId: ${authTaskInfo.userId}, twitterId: ${userProfile['id']}`,
      )

      const userCredential = {
        ...credential,
        user_id: userProfile['id'] || userProfile['sub'],
      } as MetaUserOAuthCredential

      const tokenSaved = await this.saveOAuthCredential(
        accountInfo.id,
        userCredential,
        authTaskInfo.platform,
      )

      if (!tokenSaved) {
        this.logger.error(
          `Failed to save access token for accountId: ${accountInfo.id}`,
        )
        return null
      }
      const taskUpdated = await this.updateAuthTaskStatus(
        state,
        authTaskInfo,
        accountInfo.id,
      )

      if (!taskUpdated) {
        this.logger.error(
          `Failed to update auth task status for state: ${state}, accountId: ${accountInfo.id}`,
        )
        return null
      }
      return {
        status: 1,
        accountId: accountInfo.id,
        nickname: accountInfo.nickname,
        avatar: accountInfo.avatar,
        platformUid: accountInfo.uid,
        accountType: accountInfo.type,
        callbackUrl: authTaskInfo?.callbackUrl,
        callbackMethod: authTaskInfo.callbackMethod,
        taskId: state,
      }
    }
    catch (error) {
      if (isAxiosError(error) && error.response) {
        this.logger.error(
          `Error in OAuth2 callback: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        )
      }
      this.logger.error(
        `Error processing OAuth2 callback for state: ${state}, code: ${code}, error: ${getErrorMessage(error)}`,
        getErrorStack(error),
      )
      return null
    }
  }

  private async createAccount(
    userId: string,
    accountType: AccountType,
    userProfile: Record<string, any>,
  ): Promise<Account | null> {
    this.logger.log(
      `Creating account for userId: ${userId}, platform: ${accountType}, userProfile: ${JSON.stringify(userProfile)}`,
    )
    const newAccountData = new NewAccount({
      userId,
      type: accountType,
      uid: userProfile['id'] || userProfile['sub'],
      account: userProfile['username'] || userProfile['name'],
      avatar:
        userProfile['profile_picture_url']
        || userProfile['threads_profile_picture_url']
        || userProfile['picture']?.data?.url
        || userProfile['picture']
        || '',
      nickname: userProfile['username'] || userProfile['name'],
      lastStatsTime: new Date(),
      loginTime: new Date(),
      groupId: userProfile['groupId'] || '',
      status: AccountStatus.NORMAL,
    })

    const accountInfo = await this.channelAccountService.createAccount(
      {
        type: accountType,
        uid: userProfile['id'] || userProfile['sub'],
      },
      newAccountData,
    )
    if (!accountInfo) {
      this.logger.error(
        `Failed to create account for userId: ${userId}, twitterId: ${userProfile['id']}`,
      )
      return null
    }
    return accountInfo
  }

  private async saveOAuthCredential(
    accountId: string,
    tokenInfo: MetaUserOAuthCredential,
    platform: string,
  ): Promise<boolean> {
    const now = getCurrentTimestamp()
    const expireTime
      = now + tokenInfo.expires_in - META_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    tokenInfo.expires_in = expireTime
    const cached = await this.redisService.setJson(
      ChannelRedisKeys.accessToken(platform, accountId),
      tokenInfo,
    )
    const persistResult = await this.oauth2CredentialRepository.upsertOne(
      accountId,
      platform as AccountType,
      {
        accessToken: tokenInfo.access_token,
        refreshToken: tokenInfo.refresh_token,
        accessTokenExpiresAt: tokenInfo.expires_in,
        refreshTokenExpiresAt: tokenInfo.refresh_token_expires_in
          ? Number(tokenInfo.refresh_token_expires_in)
          : undefined,
        raw: JSON.stringify(tokenInfo),
      },
    )
    const saved = cached && persistResult
    return saved
  }

  private async updateAuthTaskStatus(
    state: string,
    authTaskInfo: MetaOAuth2TaskInfo,
    accountId: string,
  ): Promise<boolean> {
    authTaskInfo.status = 1
    authTaskInfo.accountId = accountId

    return await this.redisService.setJson(
      ChannelRedisKeys.authTask('meta', state),
      authTaskInfo,
      META_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )
  }

  private async getOAuth2Credential(platform: string, accountId: string): Promise<MetaUserOAuthCredential | null> {
    let key = ChannelRedisKeys.accessToken(platform, accountId)
    if (platform === 'facebook') {
      key = ChannelRedisKeys.pageAccessToken('facebook', accountId)
    }
    let credential = await this.redisService.getJson<MetaUserOAuthCredential>(key)
    if (!credential) {
      const oauth2Credential = await this.oauth2CredentialRepository.getOne(
        accountId,
        platform as AccountType,
      )
      if (!oauth2Credential) {
        return null
      }
      credential = JSON.parse(oauth2Credential.raw || '') as MetaUserOAuthCredential
    }
    return credential
  }

  async getAccessTokenStatus(
    accountId: string,
    platform: string,
  ): Promise<number> {
    const credential = await this.getOAuth2Credential(platform, accountId)
    if (!credential) {
      return 0
    }
    return credential.expires_in > getCurrentTimestamp() ? 1 : 0
  }
}
