import { Injectable, Logger } from '@nestjs/common'
import { getCurrentTimestamp } from '@/common'
import { config } from '@/config'
import { RedisService } from '@/libs'
import { ChunkedMediaUploadRequest, CreateMediaContainerRequest, CreateMediaContainerResponse, InstagramInsightsRequest, InstagramInsightsResponse, InstagramUserInfoRequest, InstagramUserInfoResponse } from '@/libs/instagram/instagram.interfaces'
import { InstagramService as InstagramAPIService } from '@/libs/instagram/instagram.service'
import { META_TIME_CONSTANTS, MetaRedisKeys } from './constants'
import { MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class InstagramService {
  private prefix = ''
  private readonly redisService: RedisService
  private readonly instagramAPIService: InstagramAPIService
  private readonly logger = new Logger(InstagramService.name)

  constructor(
    redisService: RedisService,
    facebookAPIService: InstagramAPIService,
  ) {
    this.prefix = config.nats.prefix
    this.redisService = redisService
    this.instagramAPIService = facebookAPIService
  }

  private async authorize(
    accountId: string,
  ): Promise<MetaUserOAuthCredential | null> {
    const credential = await this.redisService.get<MetaUserOAuthCredential>(
      MetaRedisKeys.getAccessTokenKey('instagram', accountId),
    )
    if (!credential) {
      this.logger.warn(`No access token found for accountId: ${accountId}`)
      return null
    }
    const now = getCurrentTimestamp()
    const tokenExpiredAt = now + credential.expires_in
    const requestTime
      = tokenExpiredAt - META_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    if (requestTime <= now) {
      this.logger.debug(
        `Access token for accountId: ${accountId} is expired, refreshing...`,
      )
      const refreshedToken = await this.refreshOAuthCredential(
        credential.access_token,
      )
      if (!refreshedToken) {
        this.logger.error(
          `Failed to refresh access token for accountId: ${accountId}`,
        )
        return null
      }
      credential.access_token = refreshedToken.access_token
      credential.expires_in = refreshedToken.expires_in
      const saved = await this.saveOAuthCredential(accountId, credential, 'facebook')
      if (!saved) {
        this.logger.error(
          `Failed to save refreshed access token for accountId: ${accountId}`,
        )
        return null
      }
      return credential
    }
    return credential
  }

  private async refreshOAuthCredential(refresh_token: string) {
    const credential
      = await this.instagramAPIService.refreshOAuthCredential(refresh_token)
    if (!credential) {
      this.logger.error(`Failed to refresh access token`)
      return null
    }
    return credential
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

  async createMediaContainer(
    accountId: string,
    req: CreateMediaContainerRequest,
  ): Promise<CreateMediaContainerResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.instagramAPIService.createMediaContainer(
      credential.user_id,
      credential.access_token,
      req,
    )
  }

  async chunkedMediaUploadRequest(
    accountId: string,
    req: ChunkedMediaUploadRequest,
  ): Promise<CreateMediaContainerResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.instagramAPIService.chunkedMediaUploadRequest(
      credential.access_token,
      req,
    )
  }

  async publishMediaContainer(
    accountId: string,
    igContainerId: string,
  ): Promise<CreateMediaContainerResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.instagramAPIService.publishMediaContainer(
      credential.user_id,
      credential.access_token,
      igContainerId,
    )
  }

  async getObjectInfo(accountId: string, objectId: string, pageId: string, fields?: string): Promise<any> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}, ${pageId}`)
      return null
    }
    return await this.instagramAPIService.getObjectInfo(credential.access_token, objectId, fields)
  }

  async getInsights(
    accountId: string,
    accessToken: string,
    query: InstagramInsightsRequest,
    requestURL?: string,
  ): Promise<InstagramInsightsResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.instagramAPIService.getInsights(
      accessToken,
      credential.user_id,
      query,
      requestURL,
    )
  }

  async getUserInfo(
    accountId: string,
    query: InstagramUserInfoRequest,
  ): Promise<InstagramUserInfoResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.instagramAPIService.getUserInfo(
      credential.user_id,
      credential.access_token,
      query,
    )
  }
}
