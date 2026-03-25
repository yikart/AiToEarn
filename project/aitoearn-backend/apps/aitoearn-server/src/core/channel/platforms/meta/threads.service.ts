import { Injectable, Logger } from '@nestjs/common'
import { PublishType } from '@yikart/aitoearn-server-client'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { getCurrentTimestamp } from '../../../../common/utils/time.util'
import {
  publicProfileResponse,
  ThreadsContainerRequest,
  ThreadsInsightsRequest,
  ThreadsInsightsResponse,
  ThreadsObjectCommentsRequest,
  ThreadsObjectCommentsResponse,
  ThreadsObjectInfo,
  ThreadsPostItem,
  ThreadsPostResponse,
  ThreadsPostsRequest,
  ThreadsPostsResponse,
  ThreadsSearchLocationRequest,
} from '../../libs/threads/threads.interfaces'
import { ThreadsService as ThreadsAPIService } from '../../libs/threads/threads.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { MetaBaseService } from './base.service'
import { MetaLocation, MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class ThreadsService extends MetaBaseService {
  protected override readonly platform: AccountType = AccountType.THREADS
  protected override readonly logger = new Logger(ThreadsService.name)

  constructor(
    readonly threadsAPIService: ThreadsAPIService,
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
    if (now >= credential.expires_in) {
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
        this.logger.error(
          `Failed to save refreshed access token for accountId: ${accountId}`,
        )
        throw new PlatformAuthExpiredException(this.platform, accountId)
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

  async getObjectInfo(accountId: string, objectId: string, pageId: string, fields?: string): Promise<ThreadsObjectInfo> {
    const credential = await this.authorize(accountId)
    return await this.threadsAPIService.getObjectInfo(credential.access_token, objectId, fields)
  }

  async getAccountInsights(
    accountId: string,
    query: ThreadsInsightsRequest,
  ): Promise<ThreadsInsightsResponse | null> {
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

  async getMediaInsights(
    accountId: string,
    mediaId: string,
    query: ThreadsInsightsRequest,
  ): Promise<ThreadsInsightsResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.threadsAPIService.getMediaInsights(
      mediaId,
      credential.access_token,
      query,
    )
  }

  async getPublicProfile(
    accountId: string,
    username: string,
  ): Promise<publicProfileResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.threadsAPIService.getPublicProfile(
      credential.access_token,
      username,
    )
  }

  async getUserPosts(
    accountId: string,
    query: ThreadsPostsRequest,
  ): Promise<ThreadsPostsResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.threadsAPIService.getAccountAllPosts(
      credential.user_id,
      credential.access_token,
      query,
    )
  }

  async getPostDetail(
    accountId: string,
    postId: string,
    query: ThreadsPostsRequest,
  ): Promise<ThreadsPostItem | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.threadsAPIService.getPostDetail(
      credential.access_token,
      postId,
      query,
    )
  }

  async fetchObjectComments(
    accountId: string,
    objectId: string,
    query: ThreadsObjectCommentsRequest,
  ): Promise<ThreadsObjectCommentsResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    return await this.threadsAPIService.fetchObjectComments(
      objectId,
      credential.access_token,
      query,
    )
  }

  async publishPlaintextComment(
    accountId: string,
    objectId: string,
    message: string,
  ): Promise<ThreadsPostResponse | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    const containerReq: ThreadsContainerRequest = {
      text: message,
      reply_to_id: objectId,
      media_type: 'TEXT',
    }
    const createContainerResp = await this.threadsAPIService.createItemContainer(
      credential.user_id,
      credential.access_token,
      containerReq,
    )
    if (!createContainerResp || !createContainerResp.id) {
      this.logger.error(`Failed to create comment container for objectId: ${objectId}`)
      return null
    }
    return await this.threadsAPIService.publishPost(
      credential.user_id,
      credential.access_token,
      createContainerResp.id,
    )
  }

  async searchLocations(
    accountId: string,
    keyword: string,
  ): Promise<MetaLocation[] | null> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return null
    }
    const query: ThreadsSearchLocationRequest = {
      query: keyword,
      fields: 'id, name, address, city, country, latitude, longitude, postal_code',
    }
    const response = await this.threadsAPIService.searchLocations(
      credential.access_token,
      query,
    )
    if (!response) {
      this.logger.error(`Failed to search locations for keyword: ${keyword}`)
      return null
    }
    const result = response.data.map(loc => ({
      id: loc.id,
      label: `${loc.name} - ${loc.address || ''} ${loc.city || ''} ${loc.country || ''}`,
    }))
    return result
  }

  override async deletePost(
    accountId: string,
    postId: string,
  ): Promise<boolean> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.error(`No valid access token found for accountId: ${accountId}`)
      return false
    }
    const result = await this.threadsAPIService.deletePost(postId, credential.access_token)
    return result.success
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
    const postId = this.parseThreadsUrl(workLink)
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
   * 解析 Threads URL，提取帖子 ID
   * 支持的 URL 格式：
   * - https://www.threads.net/@username/post/POST_ID
   * - https://www.threads.net/t/POST_ID
   * @param workLink Threads 链接
   * @returns postId 或 null
   */
  private parseThreadsUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname.replace('www.', '')

    if (hostname === 'threads.net') {
      const pathname = url.pathname

      // https://www.threads.net/@username/post/POST_ID
      const postMatch = pathname.match(/\/post\/([^/?]+)/)
      if (postMatch) {
        return postMatch[1]
      }
      // https://www.threads.net/t/POST_ID
      if (pathname.startsWith('/t/')) {
        return pathname.split('/t/')[1]?.split(/[?&#/]/)[0] || null
      }
    }

    return null
  }
}
