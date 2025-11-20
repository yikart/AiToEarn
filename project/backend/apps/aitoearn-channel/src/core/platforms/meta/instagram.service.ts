import { Injectable, Logger } from '@nestjs/common'
import { getCurrentTimestamp } from '../../../common'
import {
  ChunkedMediaUploadRequest,
  CreateMediaContainerRequest,
  CreateMediaContainerResponse,
  IGCommentsResponse,
  IGPostCommentsRequest,
  InstagramInsightsRequest,
  InstagramInsightsResponse,
  InstagramMediaInsightsRequest,
  InstagramObjectInfo,
  InstagramUserInfoRequest,
  InstagramUserInfoResponse,
  InstagramUserPost,
  InstagramUserPostRequest,
  InstagramUserPostResponse,
} from '../../../libs/instagram/instagram.interfaces'
import { InstagramService as InstagramAPIService } from '../../../libs/instagram/instagram.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { MetaBaseService } from './base.service'
import { META_TIME_CONSTANTS } from './constants'
import { MetaPublishPlaintextCommentResponse, MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class InstagramService extends MetaBaseService {
  protected override readonly platform = 'instagram'
  protected override readonly logger = new Logger(InstagramService.name)

  constructor(
    readonly instagramAPIService: InstagramAPIService,
  ) {
    super()
  }

  private async authorize(
    accountId: string,
  ): Promise<MetaUserOAuthCredential> {
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
        throw new PlatformAuthExpiredException(this.platform)
      }
      credential.access_token = refreshedToken.access_token
      credential.expires_in = refreshedToken.expires_in
      const saved = await this.saveOAuth2Credential(accountId, credential, this.platform)
      if (!saved) {
        throw new PlatformAuthExpiredException(this.platform)
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

  async createMediaContainer(
    accountId: string,
    req: CreateMediaContainerRequest,
  ): Promise<CreateMediaContainerResponse> {
    const credential = await this.authorize(accountId)
    return await this.instagramAPIService.createMediaContainer(
      credential.user_id,
      credential.access_token,
      req,
    )
  }

  async chunkedMediaUploadRequest(
    accountId: string,
    req: ChunkedMediaUploadRequest,
  ): Promise<CreateMediaContainerResponse> {
    const credential = await this.authorize(accountId)
    return await this.instagramAPIService.chunkedMediaUploadRequest(
      credential.access_token,
      req,
    )
  }

  async publishMediaContainer(
    accountId: string,
    igContainerId: string,
  ): Promise<CreateMediaContainerResponse> {
    const credential = await this.authorize(accountId)
    return await this.instagramAPIService.publishMediaContainer(
      credential.user_id,
      credential.access_token,
      igContainerId,
    )
  }

  async getObjectInfo(accountId: string, objectId: string, pageId: string, fields?: string): Promise<InstagramObjectInfo> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}, ${pageId}`)
      return null
    }
    return await this.instagramAPIService.getObjectInfo(credential.access_token, objectId, fields)
  }

  async getAccountInsights(
    accountId: string,
    query: InstagramInsightsRequest,
    requestURL?: string,
  ): Promise<InstagramInsightsResponse> {
    const credential = await this.authorize(accountId)
    return await this.instagramAPIService.getAccountInsights(
      credential.access_token,
      credential.user_id,
      query,
      requestURL,
    )
  }

  async getAccountInfo(
    accountId: string,
    query: InstagramUserInfoRequest,
  ): Promise<InstagramUserInfoResponse> {
    const credential = await this.authorize(accountId)
    return await this.instagramAPIService.getAccountInfo(
      credential.user_id,
      credential.access_token,
      query,
    )
  }

  async getMediaInsights(
    accountId: string,
    mediaId: string,
    query: InstagramMediaInsightsRequest,
  ): Promise<InstagramInsightsResponse> {
    const credential = await this.authorize(accountId)
    return await this.instagramAPIService.getMediaInsights(
      credential.access_token,
      mediaId,
      query,
    )
  }

  async getUserPosts(
    accountId: string,
    query: InstagramUserPostRequest,
  ): Promise<InstagramUserPostResponse> {
    const credential = await this.authorize(accountId)
    return await this.instagramAPIService.getUserPosts(
      credential.access_token,
      credential.user_id,
      query,
    )
  }

  async getPostDetail(
    accountId: string,
    postId: string,
    query: InstagramUserPostRequest,
  ): Promise<InstagramUserPost> {
    const credential = await this.authorize(accountId)
    return await this.instagramAPIService.getPostDetail(credential.access_token, postId, query)
  }

  async fetchPostComments(
    accountId: string,
    postId: string,
    query: IGPostCommentsRequest,
  ): Promise<IGCommentsResponse> {
    const credential = await this.authorize(accountId)
    return await this.instagramAPIService.fetchPostComments(
      credential.access_token,
      postId,
      query,
    )
  }

  async fetchCommentReplies(
    accountId: string,
    commentId: string,
    query: IGPostCommentsRequest,
  ): Promise<IGCommentsResponse> {
    const credential = await this.authorize(accountId)
    return await this.instagramAPIService.fetchCommentReplies(
      credential.access_token,
      commentId,
      query,
    )
  }

  async publishPlaintextComment(
    accountId: string,
    postId: string,
    message: string,
  ): Promise<MetaPublishPlaintextCommentResponse> {
    const credential = await this.authorize(accountId)
    const resp = await this.instagramAPIService.publishComment(
      credential.access_token,
      postId,
      message,
    )
    const result: MetaPublishPlaintextCommentResponse = {
      id: resp.id,
      success: !!resp.id,
      message: resp.id ? 'Comment published successfully' : 'Failed to publish comment',
    }
    return result
  }

  async publishPlaintextCommentReply(
    accountId: string,
    commentId: string,
    message: string,
  ): Promise<MetaPublishPlaintextCommentResponse> {
    const credential = await this.authorize(accountId)
    const resp = await this.instagramAPIService.publishSubComment(
      credential.access_token,
      commentId,
      message,
    )
    const result: MetaPublishPlaintextCommentResponse = {
      id: resp.id,
      success: !!resp.id,
      message: resp.id ? 'Sub-comment published successfully' : 'Failed to publish sub-comment',
    }
    return result
  }
}
