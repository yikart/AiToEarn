import { Injectable, Logger } from '@nestjs/common'
import { PublishType } from '@yikart/aitoearn-server-client'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { getCurrentTimestamp } from '../../../../common/utils/time.util'
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
} from '../../libs/instagram/instagram.interfaces'
import { InstagramService as InstagramAPIService } from '../../libs/instagram/instagram.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { MetaBaseService } from './base.service'
import { META_TIME_CONSTANTS } from './constants'
import { MetaPublishPlaintextCommentResponse, MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class InstagramService extends MetaBaseService {
  protected override readonly platform: AccountType = AccountType.INSTAGRAM
  protected override readonly logger = new Logger(InstagramService.name)

  constructor(
    readonly instagramAPIService: InstagramAPIService,
  ) {
    super()
  }

  private async authorize(
    accountId: string,
  ): Promise<MetaUserOAuthCredential> {
    await this.ensureLocalAccount(accountId)
    const credential = await this.getOAuth2Credential(accountId)
    if (!credential) {
      throw new PlatformAuthExpiredException(this.platform, accountId)
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
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      credential.access_token = refreshedToken.access_token
      credential.expires_in = refreshedToken.expires_in
      const saved = await this.saveOAuth2Credential(accountId, credential, this.platform)
      if (!saved) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      return credential
    }
    return credential
  }

  private async refreshOAuthCredential(refresh_token: string) {
    const credential
      = await this.instagramAPIService.refreshOAuthCredential(refresh_token)
    if (!credential) {
      throw new PlatformAuthExpiredException(this.platform)
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
      return null as unknown as InstagramObjectInfo
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

  /**
   * 获取作品信息
   * @param accountType
   * @param workLink
   * @param dataId
   * @returns
   */
  override async getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string): Promise<{
    dataId: string
    uniqueId: string
    type: PublishType
    videoType?: 'short' | 'long'
  }> {
    const postId = this.parseInstagramUrl(workLink)
    const resolvedDataId = postId || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: resolvedDataId,
      uniqueId: `${accountType}_${resolvedDataId}`,
      type: PublishType.VIDEO,
      videoType: 'short',
    }
  }

  /**
   * 解析 Instagram URL，提取帖子 ID
   * 支持的 URL 格式：
   * - https://www.instagram.com/p/POST_ID
   * - https://www.instagram.com/reel/REEL_ID
   * - https://www.instagram.com/reels/REEL_ID
   * - https://www.instagram.com/tv/TV_ID
   * @param workLink Instagram 链接
   * @returns postId 或 null
   */
  private parseInstagramUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname.replace('www.', '')

    if (hostname === 'instagram.com') {
      const pathname = url.pathname

      // https://www.instagram.com/p/POST_ID
      if (pathname.startsWith('/p/')) {
        return pathname.split('/p/')[1]?.split(/[?&#/]/)[0] || null
      }
      // https://www.instagram.com/reel/REEL_ID
      if (pathname.startsWith('/reel/')) {
        return pathname.split('/reel/')[1]?.split(/[?&#/]/)[0] || null
      }
      // https://www.instagram.com/reels/REEL_ID
      if (pathname.startsWith('/reels/')) {
        return pathname.split('/reels/')[1]?.split(/[?&#/]/)[0] || null
      }
      // https://www.instagram.com/tv/TV_ID
      if (pathname.startsWith('/tv/')) {
        return pathname.split('/tv/')[1]?.split(/[?&#/]/)[0] || null
      }
    }

    return null
  }
}
