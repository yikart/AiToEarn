import { Injectable, Logger } from '@nestjs/common'
import { getCurrentTimestamp } from '../../../common'
import {
  publicProfileResponse,
  ThreadsContainerRequest,
  ThreadsInsightsRequest,
  ThreadsInsightsResponse,
  ThreadsObjectCommentsRequest,
  ThreadsObjectCommentsResponse,
  ThreadsObjectInfo,
  ThreadsPostResponse,
  ThreadsPostsRequest,
  ThreadsPostsResponse,
  ThreadsSearchLocationRequest,
} from '../../../libs/threads/threads.interfaces'
import { ThreadsService as ThreadsAPIService } from '../../../libs/threads/threads.service'
import { MetaBaseService } from './base.service'
import { MetaLocation, MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class ThreadsService extends MetaBaseService {
  protected override readonly platform = 'threads'
  protected override readonly logger = new Logger(ThreadsService.name)

  constructor(
    readonly threadsAPIService: ThreadsAPIService,
  ) {
    super()
  }

  private async authorize(
    accountId: string,
  ): Promise<MetaUserOAuthCredential> {
    const credential = await this.getOAuth2Credential(accountId)
    if (!credential) {
      this.logger.warn(`No access token found for accountId: ${accountId}`)
      throw new Error(`No access token found for accountId: ${accountId}`)
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
        this.logger.error(
          `Failed to refresh access token for accountId: ${accountId}`,
        )
        return null
      }
      credential.access_token = refreshedToken.access_token
      credential.expires_in = refreshedToken.expires_in
      const saved = await this.saveOAuth2Credential(accountId, credential, 'threads')
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

  async deletePost(
    postId: string,
    accessToken: string,
  ): Promise<void> {
    return await this.threadsAPIService.deletePost(postId, accessToken)
  }
}
