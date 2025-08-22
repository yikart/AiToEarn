import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosResponse } from 'axios'
import { getCurrentTimestamp } from '@/common'
import { config } from '@/config'
import { RedisService } from '@/libs'
import {
  ChunkedVideoUploadRequest,
  ChunkedVideoUploadResponse,
  FacebookInitialVideoUploadRequest,
  FacebookInitialVideoUploadResponse,
  FacebookInsightsRequest,
  FacebookInsightsResponse,
  FacebookObjectInfo,
  FacebookPageDetailRequest,
  FacebookPageDetailResponse,
  FacebookPublishedPostRequest,
  FacebookPublishedPostResponse,
  FacebookReelRequest,
  FacebookReelResponse,
  FacebookReelUploadRequest,
  FacebookReelUploadResponse,
  finalizeVideoUploadRequest,
  finalizeVideoUploadResponse,
  PublishFeedPostRequest,
  publishFeedPostResponse,
  PublishMediaPostResponse,
  PublishVideoPostRequest,
  publishVideoPostResponse,
  UploadPhotoResponse,
} from '@/libs/facebook/facebook.interfaces'
import { FacebookService as FacebookAPIService } from '@/libs/facebook/facebook.service'
import { META_TIME_CONSTANTS, metaOAuth2ConfigMap, MetaRedisKeys } from './constants'
import { FacebookAccountResponse, FacebookPageCredentials, MetaUserOAuthCredential } from './meta.interfaces'

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
  ): Promise<FacebookPageCredentials | null> {
    const pageCredential = await this.redisService.get<FacebookPageCredentials>(
      MetaRedisKeys.getUserPageAccessTokenKey('facebook', accountId),
    )
    if (!pageCredential) {
      this.logger.warn(`No access token found for accountId: ${accountId}`)
      return null
    }
    const now = getCurrentTimestamp()
    const tokenExpiredAt = now + pageCredential.expires_in
    const requestTime
      = tokenExpiredAt - META_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    if (requestTime <= now) {
      this.logger.debug(
        `Access token for accountId: ${accountId} is expired, refreshing...`,
      )
      const userCredential = await this.authorize(pageCredential.facebook_user_id)
      if (!userCredential) {
        this.logger.error(
          `Failed to refresh access token for facebook accountId: ${pageCredential.facebook_user_id}`,
        )
        return null
      }
      const fbAccountInfo = await this.getUserAccount(
        userCredential.access_token,
      )
      let newPageCredential: FacebookPageCredentials | null = null
      if (fbAccountInfo.length > 0) {
        for (const fbAccount of fbAccountInfo) {
          fbAccount.expires_in = userCredential.expires_in;
          const credential = { ...fbAccount, facebook_user_id: userCredential.user_id, expires_in: userCredential.expires_in }
          if (fbAccount.id === pageCredential.id) {
            newPageCredential = credential
          }
          await this.redisService.setKey(
            MetaRedisKeys.getUserPageAccessTokenKey(
              'facebook',
              fbAccount.id,
            ),
            credential,
          )
        }
      }
      return newPageCredential;
    }
    return pageCredential;
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
    req: FacebookInitialVideoUploadRequest,
  ): Promise<FacebookInitialVideoUploadResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.initVideoUpload(credential.id, credential.access_token, req)
  }

  async chunkedMediaUpload(
    accountId: string,
    req: ChunkedVideoUploadRequest,
  ): Promise<ChunkedVideoUploadResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.chunkedVideoUploadRequest(credential.id, credential.access_token, req)
  }

  async finalizeMediaUpload(
    accountId: string,
    req: finalizeVideoUploadRequest,
  ): Promise<finalizeVideoUploadResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return this.facebookAPIService.finalizeVideoUpload(credential.id, credential.access_token, req)
  }

  async publishFeedPost(
    accountId: string,
    req: PublishFeedPostRequest,
  ): Promise<publishFeedPostResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.publishFeedPost(credential.id, credential.access_token, req)
  }

  async publishVideoPost(
    accountId: string,
    req: PublishVideoPostRequest,
  ): Promise<publishVideoPostResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.publishVideoPost(credential.id, credential.access_token, req)
  }

  async uploadImage(
    accountId: string,
    file: Blob,
  ): Promise<UploadPhotoResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.uploadPostPhotoByFile(credential.id, credential.access_token, file)
  }

  async publicPhotoPost(
    accountId: string,
    imageUrlList: string[],
    caption?: string,
  ): Promise<PublishMediaPostResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.publishMultiplePhotoPost(credential.id, credential.access_token, imageUrlList, caption)
  }

  async getObjectInfo(accountId, objectId: string, fields?: string): Promise<FacebookObjectInfo | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.getObjectInfo(credential.access_token, objectId, fields)
  }

  async getPageInsights(
    accountId: string,
    req: FacebookInsightsRequest,
  ): Promise<FacebookInsightsResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.getPageInsights(credential.id, credential.access_token, req)
  }

  async getPageDetail(
    accountId: string,
    query: FacebookPageDetailRequest,
  ): Promise<FacebookPageDetailResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.getPageDetails(credential.id, credential.access_token, query)
  }

  async getPagePublishedPosts(
    accountId: string,
    query: FacebookPublishedPostRequest,
  ): Promise<FacebookPublishedPostResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.getPagePublishedPosts(credential.id, credential.access_token, query)
  }

  async getAccountInsights(
    accountId: string,
  ) {
    const pageInsights = await this.getPageInsights(accountId, {
      metric: 'page_video_views',
      period: 'lifetime',
    })
    const pageDetail = await this.getPageDetail(accountId, { fields: 'followers_count' })
    const fensNum = pageDetail?.followers_count || 0
    const playNum = pageInsights?.data.find(
      item => item.name === 'page_video_views',
    )?.values[0].value || 0
    return {
      fensNum,
      playNum,
    }
  }

  async getPostInsights(
    accountId: string,
    postId: string,
  ) {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    const postInsightReq: FacebookInsightsRequest = {
      metric: 'post_reactions_like_total,post_video_views',
      period: 'lifetime',
    }
    const objectId = `${credential.id}_${postId}`
    const postInsights = await this.facebookAPIService.getFacebookObjectInsights(objectId, credential.access_token, postInsightReq)
    const postDetail = await this.facebookAPIService.getPagePostDetails(
      objectId,
      credential.access_token,
      { field: 'shares' },
    )
    const comments = await this.facebookAPIService.getPostComments(
      objectId,
      credential.access_token,
      { summary: true, type: 'LIKE' },
    )
    const viewCount = postInsights?.data.find(
      item => item.name === 'post_video_views',
    )?.values[0].value || 0
    const likeCount = postInsights?.data.find(
      item => item.name === 'post_reactions_like_total',
    )?.values[0].value || 0
    const commentCount = comments?.summary?.total_count || 0
    const shareCount = postDetail?.shares?.count || 0
    return {
      playNum: viewCount,
      commentNum: commentCount,
      likeNum: likeCount,
      shareNum: shareCount,
    }
  }

  async initReelUpload(
    accountId: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.initReelUpload(credential.id, credential.access_token, req)
  }

  async uploadReel(
    accountId: string,
    uploadURL: string,
    req: FacebookReelUploadRequest,
  ): Promise<FacebookReelUploadResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.uploadReel(credential.access_token, uploadURL, req)
  }

  async publishReel(
    accountId: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.publishReelPost(credential.id, credential.access_token, req)
  }

  async initVideoStoryUpload(
    accountId: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.initVideoStoryUpload(credential.id, credential.access_token, req)
  }

  async uploadVideoStory(
    accountId: string,
    uploadURL: string,
    req: FacebookReelUploadRequest,
  ): Promise<FacebookReelUploadResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.uploadVideoStory(credential.access_token, uploadURL, req)
  }

  async publishVideoStory(
    accountId: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.publishVideoStoryPost(credential.id, credential.access_token, req)
  }

  async publishPhotoStory(
    accountId: string,
    photoId: string,
  ): Promise<FacebookReelResponse | null> {
    const credential = await this.authorizePage(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.facebookAPIService.publishPhotoStoryPost(credential.id, credential.access_token, photoId)
  }
}
