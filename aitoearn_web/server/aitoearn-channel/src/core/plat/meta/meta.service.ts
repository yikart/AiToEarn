import { createHash, randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '@/config'
import { AccountService } from '@/core/account/account.service'
import { Account } from '@/libs/database/schema/account.schema'
import { FacebookPageDetailRequest, FacebookPageDetailResponse } from '@/libs/facebook/facebook.interfaces'
import { RedisService } from '@/libs/redis'
import { AccountType, NewAccount } from '@/transports/account/common'
import { META_TIME_CONSTANTS, metaOAuth2ConfigMap, MetaRedisKeys } from './constants'
import {
  FacebookAccountResponse,
  FacebookPage,
  FacebookPageCredentials,
  MetaOAuth2TaskInfo,
  MetaOAuth2TaskStatus,
  MetaOAuthLongLivedCredential,
  MetaOAuthShortLivedCredential,
  MetaUserOAuthCredential,
  SelectFacebookPagesResponse,
} from './meta.interfaces'

@Injectable()
export class MetaService {
  private prefix = 'meta'
  private readonly redisService: RedisService
  private readonly accountService: AccountService
  private readonly logger = new Logger(MetaService.name)

  constructor(
    redisService: RedisService,
    accountService: AccountService,
  ) {
    this.prefix = config.nats.prefix || 'meta'
    this.redisService = redisService
    this.accountService = accountService
  }

  async generateAuthorizeURL(
    userId: string,
    platform: string,
    oAuth2Scopes?: string[],
  ) {
    const scopes
      = oAuth2Scopes
        || metaOAuth2ConfigMap[platform].defaultScopes
        || []
    const state = randomBytes(32).toString('hex')
    const scopeSeparator
      = metaOAuth2ConfigMap[platform].scopesSeparator
    const params = new URLSearchParams({
      client_id: config.meta[platform].clientId,
      redirect_uri:
        config.meta[platform].redirectUri,
      response_type: 'code',
      scope: scopes.join(scopeSeparator),
      state,
    })
    if (config.meta[platform].configId) {
      params.append('config_id', config.meta[platform].configId)
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

    const authorizeURL = new URL(
      metaOAuth2ConfigMap[platform].authURL,
    )
    authorizeURL.search = params.toString()
    this.logger.debug(`Generated meta auth URL: ${authorizeURL.toString()}`)

    const success = await this.redisService.setKey<MetaOAuth2TaskInfo>(
      MetaRedisKeys.getAuthTaskKey(state),
      {
        state,
        status: 0,
        userId,
        pkce: false,
        platform,
      },
      META_TIME_CONSTANTS.AUTH_TASK_EXPIRE,
    )
    return success
      ? { url: authorizeURL.toString(), taskId: state, state }
      : null
  }

  async getOAuth2TaskInfo(state: string) {
    return await this.redisService.get<MetaOAuth2TaskStatus>(
      MetaRedisKeys.getAuthTaskKey(state),
    )
  }

  async getOAuthCredential(
    code: string,
    info: MetaOAuth2TaskInfo,
  ): Promise<MetaOAuthLongLivedCredential> {
    const platform = info.platform.toLowerCase()
    const pkceEnabled = metaOAuth2ConfigMap[platform].pkce
    const accessTokenURL
      = metaOAuth2ConfigMap[platform].accessTokenURL
    const longLivedAccessTokenURL
      = metaOAuth2ConfigMap[platform].longLivedAccessTokenURL || ''
    const redirectURI
      = config.meta[platform].redirectUri
    const clientId
      = config.meta[platform].clientId
    const clientSecret
      = config.meta[platform].clientSecret
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
    const response: AxiosResponse<MetaOAuthShortLivedCredential>
      = await axios.request(reqConfig)

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
    const llTokenResponse: AxiosResponse<MetaOAuthLongLivedCredential>
      = await axios.get(longLivedAccessTokenURL, {
        params: longLivedAccessTokenReqParams,
      })
    return llTokenResponse.data
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
      const response: AxiosResponse<FacebookPageDetailResponse> = await axios.get(
        url,
        config,
      )
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error fetching page details pageId: ${pageId}, req: ${JSON.stringify(query)}: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      throw new Error(`Error fetching page details, pageId: ${pageId}, req: ${JSON.stringify(query)}`, { cause: error })
    }
  }

  async getUserProfile(
    accessToken: string,
    platform: string,
  ): Promise<Record<string, any>> {
    const userProfileURL
      = metaOAuth2ConfigMap[platform].userProfileURL
    const url = new URL(userProfileURL)
    url.searchParams.set('access_token', accessToken)
    const response: AxiosResponse<Record<string, any>> = await axios.get(
      url.toString(),
    )
    return response.data
  }

  async getFacebookPageList(
    userId: string,
  ): Promise<FacebookPage[]> {
    const key = MetaRedisKeys.getUserPageListKey('facebook', userId)
    const pages = await this.redisService.get<FacebookPage[]>(key)
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
    const pages = await this.redisService.get<FacebookPage[]>(key)
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
        this.logger.warn(`Page ID ${pageId} not found in user's Facebook pages`)
        result.message = `Page ID ${pageId} not found in user's Facebook pages`
        return result
      }
      const pageCredentialKey = MetaRedisKeys.getUserPageAccessTokenKey(
        'facebook',
        pageId,
      )
      const pageCredential = await this.redisService.get<FacebookPageCredentials>(pageCredentialKey)
      if (!pageCredential) {
        result.message = `Page access token not found for userId: ${userId}, pageId: ${pageId}`
        return result
      }
      const accountInfo = await this.createAccount(
        userId,
        AccountType.FACEBOOK,
        { id: pageId, name: page.name, profile_picture_url: page.profile_picture_url },
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
      await this.redisService.renameKey(
        pageCredentialKey,
        newPageCredentialKey,
      )
      const previousFacebookCredentialKey = MetaRedisKeys.getAccessTokenKey('facebook', userId)
      const newFacebookCredentialKey = MetaRedisKeys.getAccessTokenKey('facebook', pageCredential.facebook_user_id)
      await this.redisService.renameKey(
        previousFacebookCredentialKey,
        newFacebookCredentialKey,
      )
      result.selectedPageIds.push(pageId)
    }
    result.success = true
    result.message = 'Selected Facebook pages successfully.'
    return result
  }

  async getFacebookAccount(
    accessToken: string,
    pageAccountURL: string,
  ) {
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
        this.logger.error(`Error fetching user account, status: ${error.response.status}, response: ${error.response.data}`)
      }
      this.logger.error(`Failed to fetch user account: ${error.message}, stack: ${error.stack}`)
      return []
    }
  }

  async postOAuth2Callback(
    state: string,
    authData: { code: string, state: string },
  ) {
    const { code } = authData

    const authTaskInfo = await this.redisService.get<MetaOAuth2TaskInfo>(
      MetaRedisKeys.getAuthTaskKey(state),
    )
    if (!authTaskInfo) {
      this.logger.error(`OAuth task not found for state: ${state}`)
      return null
    }

    void this.redisService.setPexire(
      MetaRedisKeys.getAuthTaskKey(state),
      META_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )

    // get access token
    const credential = await this.getOAuthCredential(code, authTaskInfo)
    if (!credential) {
      this.logger.error(`Failed to get access token for state: ${state}`)
      return null
    }

    // fetch user profile
    const userProfile = await this.getUserProfile(
      credential.access_token,
      authTaskInfo.platform,
    )

    //
    if (metaOAuth2ConfigMap[authTaskInfo.platform].pageAccountURL) {
      this.logger.log(
        `Fetching Facebook pages for userId: ${authTaskInfo.userId}, platform: ${authTaskInfo.platform}`,
      )
      const fbAccountInfo = await this.getFacebookAccount(
        credential.access_token,
        metaOAuth2ConfigMap[authTaskInfo.platform].pageAccountURL,
      )
      this.logger.log(
        `Fetched ${fbAccountInfo.length} pages for userId: ${authTaskInfo.userId}, platform: ${authTaskInfo.platform}`,
      )
      if (fbAccountInfo.length > 0) {
        const pages: FacebookPage[] = []
        for (const fbAccount of fbAccountInfo) {
          const pageDetail = await this.getPageDetails(fbAccount.id, fbAccount.access_token, {
            fields: 'picture',
          })
          await this.redisService.setKey(
            MetaRedisKeys.getUserPageAccessTokenKey(
              authTaskInfo.platform,
              fbAccount.id,
            ),
            { ...fbAccount, facebook_user_id: userProfile.id, expires_in: credential.expires_in } as FacebookPageCredentials,
          )
          pages.push({
            id: fbAccount.id,
            name: fbAccount.name,
            profile_picture_url: pageDetail?.picture?.data?.url,
          })
        }
        await this.redisService.setKey(
          MetaRedisKeys.getUserPageListKey(
            authTaskInfo.platform,
            authTaskInfo.userId,
          ),
          pages,
        )
      }
      const userCredential = {
        ...credential,
        user_id: userProfile.id,
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
        return null
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
        return null
      }
      return null;
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
      user_id: userProfile.id,
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

  private async createAccount(userId: string, accountType: AccountType, userProfile: Record<string, any>): Promise<Account | null> {
    const newAccountData = new NewAccount({
      userId,
      type: accountType,
      uid: userProfile.id,
      account: userProfile.username || userProfile.name,
      avatar:
        userProfile.profile_picture_url
        || userProfile.threads_profile_picture_url
        || userProfile.picture?.data?.url,
      nickname: userProfile.username || userProfile.name,
      lastStatsTime: new Date(),
      loginTime: new Date(),
    })

    const accountInfo = await this.accountService.createAccount(
      {
        userId,
        type: accountType,
        uid: userProfile.id,
      },
      newAccountData,
    )
    if (!accountInfo) {
      this.logger.error(
        `Failed to create account for userId: ${userId}, twitterId: ${userProfile.id}`,
      )
      return null
    }
    return accountInfo;
  }

  private async saveOAuthCredential(
    accountId: string,
    tokenInfo: MetaUserOAuthCredential,
    platform: string,
  ): Promise<boolean> {
    const expireTime
      = tokenInfo.expires_in - META_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    return await this.redisService.setKey(
      MetaRedisKeys.getAccessTokenKey(platform, accountId),
      tokenInfo,
      expireTime,
    )
  }

  private async updateAuthTaskStatus(
    state: string,
    authTaskInfo: MetaOAuth2TaskInfo,
    accountId: string,
  ): Promise<boolean> {
    authTaskInfo.status = 1
    authTaskInfo.accountId = accountId

    return await this.redisService.setKey(
      MetaRedisKeys.getAuthTaskKey(state),
      authTaskInfo,
      META_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )
  }
}
