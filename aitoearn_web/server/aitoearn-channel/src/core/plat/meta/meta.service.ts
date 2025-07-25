import { createHash, randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '@/config'
import { AccountService } from '@/core/account/account.service'
import { RedisService } from '@/libs/redis'
import { AccountType, NewAccount } from '@/transports/account/common'
import { META_TIME_CONSTANTS, metaOAuth2ConfigMap, MetaRedisKeys } from './constants'
import {
  FacebookAccountResponse,
  FacebookPage,
  MetaOAuth2TaskInfo,
  MetaOAuth2TaskStatus,
  MetaOAuthLongLivedCredential,
  MetaOAuthShortLivedCredential,
  MetaUserOAuthCredential,
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
        || metaOAuth2ConfigMap.meta[platform].defaultScopes
        || []
    const state = randomBytes(32).toString('hex')
    const scopeSeparator
      = metaOAuth2ConfigMap.meta[platform].scopesSeparator
    const params = new URLSearchParams({
      client_id: metaOAuth2ConfigMap.meta[platform].clientId,
      redirect_uri:
        metaOAuth2ConfigMap.meta[platform].redirectUri,
      response_type: 'code',
      scope: scopes.join(scopeSeparator),
      state,
    })
    if (metaOAuth2ConfigMap.meta[platform].configId) {
      params.append('config_id', metaOAuth2ConfigMap.meta[platform].configId)
    }
    const pkceEnabled = metaOAuth2ConfigMap.meta[platform].pkce
    if (pkceEnabled) {
      params.append('code_challenge_method', 'S256')
      const codeVerifier = randomBytes(64).toString('hex')
      const codeChallenge = createHash('sha256')
        .update(codeVerifier)
        .digest('base64url')
      params.append('code_challenge', codeChallenge)
    }

    const authorizeURL = new URL(
      metaOAuth2ConfigMap.meta[platform].authURL,
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
    const pkceEnabled = metaOAuth2ConfigMap.meta[platform].pkce
    const accessTokenURL
      = metaOAuth2ConfigMap.meta[platform].accessTokenURL
    const longLivedAccessTokenURL
      = metaOAuth2ConfigMap.meta[platform].longLivedAccessTokenURL || ''
    const redirectURI
      = metaOAuth2ConfigMap.meta[platform].redirectUri
    const clientId
      = metaOAuth2ConfigMap.meta[platform].clientId
    const clientSecret
      = metaOAuth2ConfigMap.meta[platform].clientSecret
    const requestAccessTokenMethod
      = metaOAuth2ConfigMap.meta[platform].requestAccessTokenMethod

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
      = metaOAuth2ConfigMap.meta[platform].longLivedParamsMap
    const lParams: Record<string, string> = {
      client_id: clientId,
      client_secret: clientSecret,
    }
    const accessTokenKey
      = llAccessTokenReqParamsMap['access_token'] || 'access_token'
    lParams[accessTokenKey] = response.data.access_token
    lParams['grant_type']
      = metaOAuth2ConfigMap.meta[platform].longLivedGrantType

    const longLivedAccessTokenReqParams = new URLSearchParams(lParams)
    const llTokenResponse: AxiosResponse<MetaOAuthLongLivedCredential>
      = await axios.get(longLivedAccessTokenURL, {
        params: longLivedAccessTokenReqParams,
      })
    return llTokenResponse.data
  }

  async getUserProfile(
    accessToken: string,
    platform: string,
  ): Promise<Record<string, any>> {
    const userProfileURL
      = metaOAuth2ConfigMap.meta[platform].userProfileURL
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

    const newAccountData = new NewAccount({
      userId: authTaskInfo.userId,
      type: authTaskInfo.platform.toLowerCase() as AccountType,
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
        userId: authTaskInfo.userId,
        type: AccountType[authTaskInfo.platform.toUpperCase()],
        uid: userProfile.id,
      },
      newAccountData,
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
    if (metaOAuth2ConfigMap.meta[authTaskInfo.platform].pageAccountURL) {
      this.logger.log(
        `Fetching Facebook pages for userId: ${authTaskInfo.userId}, platform: ${authTaskInfo.platform}`,
      )
      const fbAccountInfo = await this.getFacebookAccount(
        credential.access_token,
        metaOAuth2ConfigMap.meta[authTaskInfo.platform].pageAccountURL,
      )
      this.logger.log(
        `Fetched ${fbAccountInfo.length} pages for userId: ${authTaskInfo.userId}, platform: ${authTaskInfo.platform}`,
      )
      if (fbAccountInfo.length > 0) {
        const pages: FacebookPage[] = []
        for (const account of fbAccountInfo) {
          await this.redisService.setKey(
            MetaRedisKeys.getUserPageAccessTokenKey(
              authTaskInfo.platform,
              accountInfo.id,
              account.id,
            ),
            account,
          )
          pages.push({
            id: account.id,
            name: account.name,
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
    }
    return accountInfo
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
