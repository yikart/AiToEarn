import { createHash, randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '@yikart/redis'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getCurrentTimestamp } from '../../../common'
import { config } from '../../../config'
import { AccountService } from '../../../core/account/account.service'
import { Account } from '../../../libs/database/schema/account.schema'
import {
  FacebookPageDetailRequest,
  FacebookPageDetailResponse,
} from '../../../libs/facebook/facebook.interfaces'
import {
  AccountStatus,
  AccountType,
  NewAccount,
} from '../../../transports/account/common'
import {
  META_TIME_CONSTANTS,
  metaOAuth2ConfigMap,
  MetaRedisKeys,
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
  private readonly accountService: AccountService
  private readonly logger = new Logger(MetaService.name)

  constructor(redisService: RedisService, accountService: AccountService) {
    this.redisService = redisService
    this.accountService = accountService
  }

  async generateAuthorizeURL(
    userId: string,
    platform: string,
    oAuth2Scopes?: string[],
    spaceId = '',
  ) {
    this.logger.log(
      `Generating authorize URL for userId: ${userId}, platform: ${platform}}`,
    )
    const scopes
      = oAuth2Scopes
        || config.oauth[platform].scopes
        || metaOAuth2ConfigMap[platform].defaultScopes
    const state = randomBytes(32).toString('hex')
    const scopeSeparator = metaOAuth2ConfigMap[platform].scopesSeparator
    const params = new URLSearchParams({
      client_id: config.oauth[platform].clientId,
      redirect_uri: config.oauth[platform].redirectUri,
      response_type: 'code',
      state,
    })
    if (scopes.length > 1) {
      params.append('scope', scopes.join(scopeSeparator))
    }
    else {
      params.append('scope', scopes[0])
    }
    if (config.oauth[platform].configId) {
      params.append('config_id', config.oauth[platform].configId)
    }
    const pkceEnabled = metaOAuth2ConfigMap[platform].pkce
    if (pkceEnabled) {
      params.append('code_challenge_method', 'S256')
      const codeVerifier = randomBytes(64).toString('hex')
      const codeChallenge = createHash('sha256')
        .update(codeVerifier)
        .digest('base64url')
      params.append('code_challenge', codeChallenge)
    }

    const authorizeURL = new URL(metaOAuth2ConfigMap[platform].authURL)
    authorizeURL.search = params.toString()
    this.logger.debug(`Generated meta auth URL: ${authorizeURL.toString()}`)

    const success = await this.redisService.setJson(
      MetaRedisKeys.getAuthTaskKey(state),
      {
        state,
        status: 0,
        userId,
        pkce: false,
        platform,
        spaceId,
      },
      META_TIME_CONSTANTS.AUTH_TASK_EXPIRE,
    )
    return success
      ? { url: authorizeURL.toString(), taskId: state, state }
      : null
  }

  async getOAuth2TaskInfo(state: string) {
    const result = await this.redisService.getJson<MetaOAuth2TaskStatus>(
      MetaRedisKeys.getAuthTaskKey(state),
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
    const redirectURI = config.oauth[platform].redirectUri
    const clientId = config.oauth[platform].clientId
    const clientSecret = config.oauth[platform].clientSecret
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
        = llAccessTokenReqParamsMap?.access_token || 'access_token'
      lParams[accessTokenKey] = response.data.access_token
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
      const url = `${metaOAuth2ConfigMap.facebook.apiBaseUrl}/${pageId}`
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
      if (error.response) {
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
    const key = MetaRedisKeys.getUserPageListKey('facebook', userId)
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
    const key = MetaRedisKeys.getUserPageListKey('facebook', userId)
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
      const pageCredentialKey = MetaRedisKeys.getUserPageAccessTokenKey(
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
      const newPageCredentialKey = MetaRedisKeys.getUserPageAccessTokenKey(
        'facebook',
        accountInfo.id,
      )
      await this.redisService.setJson(newPageCredentialKey, pageCredential)
      await this.redisService.del(pageCredentialKey)
      const previousFacebookCredentialKey = MetaRedisKeys.getAccessTokenKey(
        'facebook',
        userId,
      )
      const newFacebookCredentialKey = MetaRedisKeys.getAccessTokenKey(
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
      if (error.response) {
        this.logger.error(
          `Error fetching user account, status: ${error.response.status}, response: ${error.response.data}`,
        )
      }
      this.logger.error(
        `Failed to fetch user account: ${error.message}, stack: ${error.stack}`,
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
      MetaRedisKeys.getAuthTaskKey(state),
    )
    if (!authTaskInfo) {
      this.logger.error(`OAuth task not found for state: ${state}`)
      return {
        status: 0,
        message: '授权任务不存在或已过期',
      }
    }

    void this.redisService.expire(
      MetaRedisKeys.getAuthTaskKey(state),
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
      userProfile.groupId = authTaskInfo.spaceId

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
              'No Facebook pages found for the user. Please ensure you have at least one Facebook Page and the necessary permissions.',
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
              MetaRedisKeys.getUserPageAccessTokenKey(
                authTaskInfo.platform,
                pageAccount.id,
              ),
              {
                ...pageAccount,
                facebook_user_id: userProfile.id,
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
            MetaRedisKeys.getUserPageListKey(
              authTaskInfo.platform,
              authTaskInfo.userId,
            ),
            pages,
          )
        }
        const userCredential = {
          ...credential,
          user_id: userProfile.id || userProfile.sub,
        } as MetaUserOAuthCredential

        const tokenSaved = await this.saveOAuthCredential(
          authTaskInfo.userId,
          userCredential,
          authTaskInfo.platform,
        )

        if (!tokenSaved) {
          this.logger.error(
            `Failed to save access token for accountId: ${'accountInfo.id'}`,
          )
          return {
            status: 0,
            message: '保存访问令牌失败',
          }
        }
        const taskUpdated = await this.updateAuthTaskStatus(
          state,
          authTaskInfo,
          authTaskInfo.userId,
        )

        if (!taskUpdated) {
          this.logger.error(
            `Failed to update auth task status for state: ${state}, accountId: ${authTaskInfo.userId}`,
          )
          return {
            status: 0,
            message: '更新授权任务状态失败',
          }
        }
        return {
          status: 1,
          message: '授权成功',
          accountId: authTaskInfo.userId,
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
          `Failed to create account for userId: ${authTaskInfo.userId}, twitterId: ${userProfile.id}`,
        )
        return null
      }

      const userCredential = {
        ...credential,
        user_id: userProfile.id || userProfile.sub,
      } as MetaUserOAuthCredential

      const tokenSaved = await this.saveOAuthCredential(
        accountInfo.id,
        userCredential,
        authTaskInfo.platform,
      )

      if (!tokenSaved) {
        this.logger.error(
          `Failed to save access token for accountId: ${'accountInfo.id'}`,
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
      return accountInfo
    }
    catch (error) {
      if (error.response) {
        this.logger.error(
          `Error in OAuth2 callback: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        )
      }
      this.logger.error(
        `Error processing OAuth2 callback for state: ${state}, code: ${code}, error: ${error.message}`,
        error.stack,
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
      uid: userProfile.id || userProfile.sub,
      account: userProfile.username || userProfile.name,
      avatar:
        userProfile.profile_picture_url
        || userProfile.threads_profile_picture_url
        || userProfile.picture?.data?.url
        || userProfile.picture
        || '',
      nickname: userProfile.username || userProfile.name,
      lastStatsTime: new Date(),
      loginTime: new Date(),
      groupId: userProfile.groupId || '',
      status: AccountStatus.NORMAL,
    })

    const accountInfo = await this.accountService.createAccount(
      userId,
      {
        type: accountType,
        uid: userProfile.id || userProfile.sub,
      },
      newAccountData,
    )
    if (!accountInfo) {
      this.logger.error(
        `Failed to create account for userId: ${userId}, twitterId: ${userProfile.id}`,
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
    return await this.redisService.setJson(
      MetaRedisKeys.getAccessTokenKey(platform, accountId),
      tokenInfo,
    )
  }

  private async updateAuthTaskStatus(
    state: string,
    authTaskInfo: MetaOAuth2TaskInfo,
    accountId: string,
  ): Promise<boolean> {
    authTaskInfo.status = 1
    authTaskInfo.accountId = accountId

    return await this.redisService.setJson(
      MetaRedisKeys.getAuthTaskKey(state),
      authTaskInfo,
      META_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )
  }

  async getAccessTokenStatus(
    accountId: string,
    platform: string,
  ): Promise<number> {
    if (platform === 'facebook') {
      const pageCredential
        = await this.redisService.getJson<FacebookPageCredentials>(
          MetaRedisKeys.getUserPageAccessTokenKey('facebook', accountId),
        )
      if (!pageCredential) {
        return 0
      }
      return pageCredential.expires_in > getCurrentTimestamp() ? 1 : 0
    }
    const credential = await this.redisService.getJson<MetaUserOAuthCredential>(
      MetaRedisKeys.getAccessTokenKey(platform, accountId),
    )
    if (!credential) {
      return 0
    }
    return credential.expires_in > getCurrentTimestamp() ? 1 : 0
  }
}
