import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosResponse } from 'axios'
import { getCurrentTimestamp } from '../../../common'
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
  FacebookPagePostRequest,
  FacebookPostAttachmentsResponse,
  FacebookPostCommentsRequest,
  FacebookPostCommentsResponse,
  FacebookPostDetail,
  FacebookPostDetailResponse,
  FacebookPostEdgesRequest,
  FacebookPostEdgesResponse,
  FacebookPublishedPostRequest,
  FacebookPublishedPostResponse,
  FacebookReelRequest,
  FacebookReelResponse,
  FacebookReelUploadRequest,
  FacebookReelUploadResponse,
  FacebookSearchPagesRequest,
  finalizeVideoUploadRequest,
  finalizeVideoUploadResponse,
  PublishFeedPostRequest,
  publishFeedPostResponse,
  PublishMediaPostResponse,
  PublishVideoPostRequest,
  publishVideoPostResponse,
  UpdatePostRequest,
  UpdatePostResponse,
  UploadPhotoResponse,
} from '../../../libs/facebook/facebook.interfaces'
import { FacebookService as FacebookAPIService } from '../../../libs/facebook/facebook.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { MetaBaseService } from './base.service'
import { META_TIME_CONSTANTS, metaOAuth2ConfigMap, MetaRedisKeys } from './constants'
import { FacebookAccountResponse, FacebookPageCredentials, MetaFacebookPageResponse, MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class FacebookService extends MetaBaseService {
  protected override readonly platform: string = 'facebook'
  protected override readonly logger = new Logger(FacebookService.name)

  constructor(
    readonly facebookAPIService: FacebookAPIService,
  ) {
    super()
  }

  private async authorize(
    accountId: string,
  ): Promise<MetaUserOAuthCredential | null> {
    const credential = await this.getOAuth2Credential(accountId)
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
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      credential.access_token = refreshedToken.access_token
      credential.expires_in = refreshedToken.expires_in || META_TIME_CONSTANTS.FACEBOOK_LONG_LIVED_TOKEN_DEFAULT_EXPIRE
      const saved = await this.saveOAuth2Credential(accountId, credential, 'facebook')
      if (!saved) {
        this.logger.error(
          `Failed to save refreshed access token for accountId: ${accountId}`,
        )
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      return credential
    }
    return credential
  }

  async getUserAccount(
    accessToken: string,
  ) {
    const accountURL = metaOAuth2ConfigMap['facebook'].pageAccountURL || 'https://graph.facebook.com/v23.0/me/accounts'
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
  ): Promise<FacebookPageCredentials> {
    const pageCredential = await this.getOAuth2Credential(accountId) as unknown as FacebookPageCredentials
    if (!pageCredential) {
      this.logger.warn(`No access token found for accountId: ${accountId}`)
      throw new Error(`No access token found for accountId: ${accountId}`)
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
        throw new Error(`Failed to refresh access token for facebook accountId: ${pageCredential.facebook_user_id}`)
      }
      const fbAccountInfo = await this.getUserAccount(
        userCredential.access_token,
      )
      let newPageCredential: FacebookPageCredentials | null = null
      if (fbAccountInfo.length > 0) {
        for (const fbAccount of fbAccountInfo) {
          fbAccount.expires_in = userCredential.expires_in
          const credential = { ...fbAccount, facebook_user_id: userCredential.user_id, expires_in: userCredential.expires_in }
          if (fbAccount.id === pageCredential.id) {
            newPageCredential = credential
          }
          await this.redisService.setJson(
            MetaRedisKeys.getUserPageAccessTokenKey(
              'facebook',
              fbAccount.id,
            ),
            credential,
          )
        }
      }
      if (!newPageCredential) {
        this.logger.error(
          `Failed to find page access token for accountId: ${accountId} after refreshing`,
        )
        throw new Error(`Failed to find page access token for accountId: ${accountId} after refreshing`)
      }
      return newPageCredential
    }
    return pageCredential
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

  async initVideoUpload(
    accountId: string,
    req: FacebookInitialVideoUploadRequest,
  ): Promise<FacebookInitialVideoUploadResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.initVideoUpload(credential.id, credential.access_token, req)
  }

  async chunkedMediaUpload(
    accountId: string,
    req: ChunkedVideoUploadRequest,
  ): Promise<ChunkedVideoUploadResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.chunkedVideoUploadRequest(credential.id, credential.access_token, req)
  }

  async finalizeMediaUpload(
    accountId: string,
    req: finalizeVideoUploadRequest,
  ): Promise<finalizeVideoUploadResponse> {
    const credential = await this.authorizePage(accountId)
    return this.facebookAPIService.finalizeVideoUpload(credential.id, credential.access_token, req)
  }

  async publishFeedPost(
    accountId: string,
    req: PublishFeedPostRequest,
  ): Promise<publishFeedPostResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.publishFeedPost(credential.id, credential.access_token, req)
  }

  async publishVideo(
    accountId: string,
    req: PublishVideoPostRequest,
  ): Promise<publishVideoPostResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.publishVideo(credential.id, credential.access_token, req)
  }

  async uploadImage(
    accountId: string,
    file: Blob,
  ): Promise<UploadPhotoResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.uploadPostPhotoByFile(credential.id, credential.access_token, file)
  }

  async publicPhotos(
    accountId: string,
    imageUrlList: string[],
    caption?: string,
  ): Promise<PublishMediaPostResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.publishPhotos(credential.id, credential.access_token, imageUrlList, caption)
  }

  async getObjectInfo(accountId: string, objectId: string, fields?: string): Promise<FacebookObjectInfo> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.getObjectInfo(credential.access_token, objectId, fields)
  }

  async getPageInsights(
    accountId: string,
    req: FacebookInsightsRequest,
  ): Promise<FacebookInsightsResponse | null> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.getPageInsights(credential.id, credential.access_token, req)
  }

  async getPageDetail(
    accountId: string,
    query: FacebookPageDetailRequest,
  ): Promise<FacebookPageDetailResponse | null> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.getPageDetails(credential.id, credential.access_token, query)
  }

  async getPagePublishedPosts(
    accountId: string,
    query: FacebookPublishedPostRequest,
  ): Promise<FacebookPublishedPostResponse | null> {
    const credential = await this.authorizePage(accountId)
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

  async getPostDetail(
    accountId: string,
    postId: string,
    fields: string,
  ): Promise<FacebookPostDetail> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.getPagePostDetails(postId, credential.access_token, { fields })
  }

  async getPostInsights(
    accountId: string,
    postId: string,
  ) {
    const credential = await this.authorizePage(accountId)
    const postInsightReq: FacebookInsightsRequest = {
      // metric: 'post_reactions_like_total,post_video_views',
      metric: 'post_impressions,post_clicks,post_reactions_like_total,post_video_views',
      period: 'lifetime',
    }
    const objectId = `${credential.id}_${postId}`
    const postInsights = await this.facebookAPIService.getFacebookObjectInsights(objectId, credential.access_token, postInsightReq)
    const postDetail = await this.facebookAPIService.getPagePostDetails(
      objectId,
      credential.access_token,
      { fields: 'shares' },
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
    const clickCount = postInsights?.data.find(
      item => item.name === 'post_clicks',
    )?.values[0].value || 0
    const impressionCount = postInsights?.data.find(
      item => item.name === 'post_impressions',
    )?.values[0].value || 0
    // const commentCount = postInsights?.data.find(
    //   item => item.name === 'post_comments',
    // )?.values[0].value || 0
    const commentCount = comments?.summary?.total_count || 0
    const shareCount = postDetail?.shares?.count || 0
    return {
      playNum: viewCount,
      commentNum: commentCount,
      likeNum: likeCount,
      shareNum: shareCount,
      clickNum: clickCount,
      impressionNum: impressionCount,
    }
  }

  async initReelVideoUpload(
    accountId: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.initReelVideoUpload(credential.id, credential.access_token, req)
  }

  async uploadReelVideo(
    accountId: string,
    uploadURL: string,
    req: FacebookReelUploadRequest,
  ): Promise<FacebookReelUploadResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.uploadReelVideo(credential.access_token, uploadURL, req)
  }

  async publishReel(
    accountId: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.publishReelPost(credential.id, credential.access_token, req)
  }

  async initStoryVideoUpload(
    accountId: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.initStoryVideoUpload(credential.id, credential.access_token, req)
  }

  async uploadStoryVideo(
    accountId: string,
    uploadURL: string,
    req: FacebookReelUploadRequest,
  ): Promise<FacebookReelUploadResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.uploadStoryVideo(credential.access_token, uploadURL, req)
  }

  async publishVideoStory(
    accountId: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.publishVideoStoryPost(credential.id, credential.access_token, req)
  }

  async publishPhotoStory(
    accountId: string,
    photoId: string,
  ): Promise<FacebookReelResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.publishPhotoStoryPost(credential.id, credential.access_token, photoId)
  }

  async getPagePosts(
    accountId: string,
    query: FacebookPagePostRequest,
  ): Promise<FacebookPostDetailResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.fetchPagePosts(credential.id, credential.access_token, query)
  }

  async getPostComments(
    accountId: string,
    postId: string,
    query: FacebookPostEdgesRequest,
  ): Promise<FacebookPostEdgesResponse> {
    const credential = await this.authorizePage(accountId)
    const objectId = `${credential.id}_${postId}`
    return await this.facebookAPIService.getPostComments(objectId, credential.access_token, query)
  }

  async fetchObjectComments(
    accountId: string,
    objectId: string,
    query: FacebookPostCommentsRequest,
  ): Promise<FacebookPostCommentsResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.fetchObjectComments(objectId, credential.access_token, query)
  }

  async publishPlaintextComment(
    accountId: string,
    objectId: string,
    message: string,
  ): Promise<{ id: string }> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.publishPlaintextComment(objectId, credential.access_token, message)
  }

  async searchPages(
    accountId: string,
    keyword: string,
  ): Promise<MetaFacebookPageResponse> {
    const credential = await this.authorizePage(accountId)
    const query: FacebookSearchPagesRequest = {
      q: keyword,
      fields: 'id,name,location,link',
    }
    const resp = await this.facebookAPIService.searchPages(credential.access_token, query)
    const result: MetaFacebookPageResponse = {
      pages: resp.data.map(item => ({
        id: item.id,
        name: item.name,
        location: `(${item.location?.street || ''} ${item.location?.city || ''} ${item.location?.state || ''} ${item.location?.country || ''})`,
      })),
    }
    return result
  }

  async fetchPostAttachments(
    accountId: string,
    postId: string,
  ): Promise<FacebookPostAttachmentsResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.fetchPostAttachments(postId, credential.access_token)
  }

  override async deletePost(
    accountId: string,
    postId: string,
  ): Promise<boolean> {
    const credential = await this.authorizePage(accountId)
    const result = await this.facebookAPIService.deletePost(postId, credential.access_token)
    return result.success
  }

  async likePost(
    accountId: string,
    postId: string,
  ): Promise<{ success: boolean }> {
    const credential = await this.authorizePage(accountId)
    const objectId = postId.includes('_') ? postId : `${credential.id}_${postId}`
    return await this.facebookAPIService.likeObject(objectId, credential.access_token)
  }

  async unlikePost(
    accountId: string,
    postId: string,
  ): Promise<{ success: boolean }> {
    const credential = await this.authorizePage(accountId)
    const objectId = postId.includes('_') ? postId : `${credential.id}_${postId}`
    return await this.facebookAPIService.unlikeObject(objectId, credential.access_token)
  }

  async updatePost(
    accountId: string,
    postId: string,
    req: UpdatePostRequest,
  ): Promise<UpdatePostResponse> {
    const credential = await this.authorizePage(accountId)
    return await this.facebookAPIService.updatePost(postId, credential.access_token, req)
  }
}
