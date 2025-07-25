import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosResponse } from 'axios'
import { getCurrentTimestamp } from '@/common'
import { config } from '@/config'
import { RedisService } from '@/libs'
import { ChunkedFileUploadRequest, ChunkedFileUploadResponse, FacebookInitialUploadRequest, FacebookInitialUploadResponse, FacebookInsightsRequest, FacebookInsightsResponse, FacebookPageDetailRequest, FacebookPageDetailResponse, FacebookPublishedPostRequest, FacebookPublishedPostResponse, finalizeUploadRequest, finalizeUploadResponse, PublishMediaPostResponse, PublishUploadedVideoPostRequest, publishUploadedVideoPostResponse, UploadPhotoResponse } from '@/libs/facebook/facebook.interfaces'
import { FacebookService as FacebookAPIService } from '@/libs/facebook/facebook.service'
import { META_TIME_CONSTANTS, metaOAuth2ConfigMap, MetaRedisKeys } from './constants'
import { FacebookAccountResponse, FacebookPageInfo, MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class FacebookService {
  private prefix = ''
  private readonly redisService: RedisService
  private readonly facebookAPIService: FacebookAPIService
  private readonly logger = new Logger(FacebookService.name)

  constructor(
    redisService: RedisService,
    facebookAPIService: FacebookAPIService,
  ) {
    this.prefix = config.nats.prefix
    this.redisService = redisService
    this.facebookAPIService = facebookAPIService
  }

  private async authorize(
    accountId: string,
  ): Promise<MetaUserOAuthCredential | null> {
    const credential = await this.redisService.get<MetaUserOAuthCredential>(
      MetaRedisKeys.getAccessTokenKey('facebook', accountId),
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

  async getUserAccount(
    accessToken: string,
  ) {
    const accountURL = metaOAuth2ConfigMap.facebook.pageAccountURL || 'https://graph.facebook.com/v23.0/me/accounts'
    const response: AxiosResponse<FacebookAccountResponse> = await axios.get(
      accountURL,
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

  private async authorizePage(
    accountId: string,
    pageId: string,
  ): Promise<FacebookPageInfo | null> {
    const credential = await this.redisService.get<FacebookPageInfo>(
      MetaRedisKeys.getUserPageAccessTokenKey('facebook', accountId, pageId),
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
      const userCredential = await this.authorize(accountId)
      if (!userCredential) {
        this.logger.error(
          `Failed to refresh access token for accountId: ${accountId}`,
        )
        return null
      }
      const fbAccountInfo = await this.getUserAccount(
        credential.access_token,
      )
      let pageAccountInfo: FacebookPageInfo | null = null;
      if (fbAccountInfo.length > 0) {
        for (const account of fbAccountInfo) {
          account.expires_in = 86400;
          if (account.id === pageId) {
            pageAccountInfo = account
          }
          await this.redisService.setKey(
            MetaRedisKeys.getUserPageAccessTokenKey(
              'facebook',
              credential.id,
              account.id,
            ),
            account,
          )
        }
        await this.redisService.setKey(
          MetaRedisKeys.getUserPageListKey(
            'facebook',
            credential.id,
          ),
          JSON.stringify(fbAccountInfo),
        )
      }
      return pageAccountInfo;
    }
    return credential;
  }

  private async refreshOAuthCredential(refresh_token: string) {
    const credential
      = await this.facebookAPIService.refreshOAuthCredential(refresh_token)
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

  async initVideoUpload(
    accountId: string,
    pageId: string,
    req: FacebookInitialUploadRequest,
  ): Promise<FacebookInitialUploadResponse | null> {
    const credential = await this.authorizePage(accountId, pageId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.initMediaUpload(pageId, credential.access_token, req)
  }

  async chunkedMediaUpload(
    accountId: string,
    pageId: string,
    req: ChunkedFileUploadRequest,
  ): Promise<ChunkedFileUploadResponse | null> {
    const credential = await this.authorizePage(accountId, pageId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.chunkedMediaUploadRequest(pageId, credential.access_token, req)
  }

  async finalizeMediaUpload(
    accountId: string,
    pageId: string,
    req: finalizeUploadRequest,
  ): Promise<finalizeUploadResponse | null> {
    const credential = await this.authorizePage(accountId, pageId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return this.facebookAPIService.finalizeMediaUpload(pageId, credential.access_token, req)
  }

  async publishVideoPost(
    accountId: string,
    pageId: string,
    req: PublishUploadedVideoPostRequest,
  ): Promise<publishUploadedVideoPostResponse | null> {
    const credential = await this.authorizePage(accountId, pageId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.publishUploadedVideoPost(pageId, credential.access_token, req)
  }

  async uploadImage(
    accountId: string,
    pageId: string,
    file: Buffer,
  ): Promise<UploadPhotoResponse | null> {
    const credential = await this.authorizePage(accountId, pageId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.uploadPostPhotoByFile(pageId, credential.access_token, file)
  }

  async publicPhotoPost(
    accountId: string,
    pageId: string,
    imageUrlList: string[],
  ): Promise<PublishMediaPostResponse | null> {
    const credential = await this.authorizePage(accountId, pageId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.publishMultiplePhotoPost(pageId, credential.access_token, imageUrlList)
  }

  async getObjectInfo(accountId, objectId: string, pageId: string, fields?: string): Promise<any> {
    const credential = await this.authorizePage(accountId, pageId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.getObjectInfo(credential.access_token, objectId, fields)
  }

  async getPageInsights(
    accountId: string,
    pageId: string,
    req: FacebookInsightsRequest,
  ): Promise<FacebookInsightsResponse | null> {
    const credential = await this.authorizePage(accountId, pageId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.getPageInsights(pageId, credential.access_token, req)
  }

  async getPageDetail(
    accountId: string,
    pageId: string,
    query: FacebookPageDetailRequest,
  ): Promise<FacebookPageDetailResponse | null> {
    const credential = await this.authorizePage(accountId, pageId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.getPageDetails(pageId, credential.access_token, query)
  }

  async getPagePublishedPosts(
    accountId: string,
    pageId: string,
    query: FacebookPublishedPostRequest,
  ): Promise<FacebookPublishedPostResponse | null> {
    const credential = await this.authorizePage(accountId, pageId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.getPagePublishedPosts(pageId, credential.access_token, query)
  }
}
