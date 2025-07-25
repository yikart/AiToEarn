import { Injectable, Logger } from '@nestjs/common'
import { getCurrentTimestamp } from '@/common'
import { config } from '@/config'
import { RedisService } from '@/libs'
import { ThreadsAccountInsightsRequest, ThreadsAccountInsightsResponse, ThreadsContainerRequest, ThreadsPostResponse } from '@/libs/threads/threads.interfaces'
import { ThreadsService as ThreadsAPIService } from '@/libs/threads/threads.service'
import { META_TIME_CONSTANTS, MetaRedisKeys } from './constants'
import { MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class ThreadsService {
  private prefix = ''
  private readonly redisService: RedisService
  private readonly threadsAPIService: ThreadsAPIService
  private readonly logger = new Logger(ThreadsService.name)

  constructor(
    redisService: RedisService,
    threadsAPIService: ThreadsAPIService,
  ) {
    this.prefix = config.nats.prefix
    this.redisService = redisService
    this.threadsAPIService = threadsAPIService
  }

  private async authorize(
    accountId: string,
  ): Promise<MetaUserOAuthCredential | null> {
    const credential = await this.redisService.get<MetaUserOAuthCredential>(
      MetaRedisKeys.getAccessTokenKey('threads', accountId),
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
      = await this.threadsAPIService.refreshOAuthCredential(refresh_token)
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

  async createItemContainer(
    accountId: string,
    req: ThreadsContainerRequest,
  ): Promise<ThreadsPostResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.threadsAPIService.createItemContainer(
      credential.user_id,
      credential.access_token,
      req,
    )
  }

  async publishPost(
    accountId: string,
    igContainerId: string,
  ): Promise<ThreadsPostResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.threadsAPIService.publishPost(
      credential.user_id,
      credential.access_token,
      igContainerId,
    )
  }

  async getObjectInfo(accountId: string, objectId: string, pageId: string, fields?: string): Promise<any> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId} ${pageId}`)
      return null
    }
    return await this.threadsAPIService.getObjectInfo(credential.access_token, objectId, fields)
  }

  async getAccountInsights(
    accountId: string,
    query: ThreadsAccountInsightsRequest,
  ): Promise<ThreadsAccountInsightsResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.threadsAPIService.getAccountInsights(
      credential.user_id,
      credential.access_token,
      query,
    )
  }
}
