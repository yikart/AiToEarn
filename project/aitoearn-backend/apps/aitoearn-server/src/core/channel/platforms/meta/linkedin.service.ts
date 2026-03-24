import { Injectable, Logger } from '@nestjs/common'
import { PublishType } from '@yikart/aitoearn-server-client'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { getCurrentTimestamp } from '../../../../common/utils/time.util'
import { LinkedInShareRequest, LinkedInUploadRequest, MemberNetworkVisibility, ShareMediaCategory, UploadRecipe } from '../../libs/linkedin/linkedin.interface'
import { LinkedinService as LinkedinAPIService } from '../../libs/linkedin/linkedin.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { MetaBaseService } from './base.service'
import { META_TIME_CONSTANTS } from './constants'
import { MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class LinkedinService extends MetaBaseService {
  protected override readonly platform: AccountType = AccountType.LINKEDIN
  protected override readonly logger = new Logger(LinkedinService.name)

  constructor(
    readonly linkedinAPIService: LinkedinAPIService,
  ) {
    super()
  }

  private async authorize(
    accountId: string,
  ): Promise<MetaUserOAuthCredential | null> {
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
      const saved = await this.saveOAuth2Credential(accountId, credential, AccountType.LINKEDIN)
      if (!saved) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      return credential
    }
    return credential
  }

  private async refreshOAuthCredential(refresh_token: string) {
    const credential
      = await this.linkedinAPIService.refreshOAuthCredential(refresh_token)
    if (!credential) {
      this.logger.error(`Failed to refresh access token`)
      return null
    }
    return credential
  }

  public generateURN(accountId: string): string {
    const uid = accountId.replace('linkedin_', '')
    return `urn:li:person:${uid}`
  }

  public async uploadMedia(accountId: string, src: string, recipe: UploadRecipe): Promise<string> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      throw new Error(`No valid credential for accountId: ${accountId}`)
    }
    const initMediaUploadReq: LinkedInUploadRequest = {
      registerUploadRequest: {
        recipes: [recipe],
        owner: this.generateURN(accountId),
        serviceRelationships: [
          {
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          },
        ],
      },
    }
    const initUploadResp = await this.linkedinAPIService.initMediaUpload(credential.access_token, initMediaUploadReq)
    const dest = initUploadResp.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
    await this.linkedinAPIService.streamUpload(credential.access_token, src, dest)
    return initUploadResp.value.asset
  }

  async streamUpload(accountId: string, src: string, dest: string) {
    const credential = await this.authorize(accountId)
    if (!credential) {
      throw new Error(`No valid credential for accountId: ${accountId}`)
    }
    return await this.linkedinAPIService.streamUpload(credential.access_token, src, dest)
  }

  async publish(accountId: string, req: LinkedInShareRequest) {
    const credential = await this.authorize(accountId)
    if (!credential) {
      throw new Error(`No valid credential for accountId: ${accountId}`)
    }
    return this.linkedinAPIService.createShare(credential.access_token, req)
  }

  async createShare(accountId: string) {
    const credential = await this.authorize(accountId)
    if (!credential) {
      throw new Error(`No valid credential for accountId: ${accountId}`)
    }

    const initMediaUploadReq: LinkedInUploadRequest = {
      registerUploadRequest: {
        recipes: [UploadRecipe.VIDEO],
        owner: this.generateURN(accountId),
        serviceRelationships: [
          {
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          },
        ],
      },
    }
    const initUploadResp = await this.linkedinAPIService.initMediaUpload(credential.access_token, initMediaUploadReq)
    const uploadURL = initUploadResp.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl

    await this.linkedinAPIService.streamUpload(credential.access_token, uploadURL, 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/production/temp/uploads/9287ddb9-2180-4a3a-9cb2-91fadc1e50be.mp4')
    const createShareReq: LinkedInShareRequest = {
      author: this.generateURN(accountId),
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: 'Test share from Aitoearn' },
          shareMediaCategory: ShareMediaCategory.IMAGE,
          media: [
            {
              status: 'READY',
              description: { text: 'Test image upload' },
              media: initUploadResp.value.asset,
              title: { text: 'Aitoearn Image' },
            },
          ],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': MemberNetworkVisibility.PUBLIC },
    }
    return await this.linkedinAPIService.createShare(credential.access_token, createShareReq)
  }

  override async deletePost(accountId: string, shareId: string) {
    const credential = await this.authorize(accountId)
    if (!credential) {
      throw new Error('Failed to authorize')
    }
    await this.linkedinAPIService.deletePost(credential.access_token, shareId)
    return true
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
    const postId = this.parseLinkedInUrl(workLink)
    const resolvedDataId = postId || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: resolvedDataId,
      uniqueId: `${accountType}_${resolvedDataId}`,
      type: PublishType.VIDEO,
      videoType: 'long',
    }
  }

  /**
   * 解析 LinkedIn URL，提取帖子 ID
   * 支持的 URL 格式：
   * - https://www.linkedin.com/posts/username_POST_ID
   * - https://www.linkedin.com/feed/update/urn:li:activity:ACTIVITY_ID
   * - https://www.linkedin.com/feed/update/urn:li:share:SHARE_ID
   * @param workLink LinkedIn 链接
   * @returns postId 或 null
   */
  private parseLinkedInUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname.replace('www.', '')

    if (hostname === 'linkedin.com') {
      const pathname = url.pathname

      // https://www.linkedin.com/feed/update/urn:li:activity:ACTIVITY_ID
      // https://www.linkedin.com/feed/update/urn:li:share:SHARE_ID
      if (pathname.startsWith('/feed/update/')) {
        const urn = pathname.split('/feed/update/')[1]?.split(/[?&#/]/)[0]
        if (urn) {
          // Extract the ID from URN
          const urnMatch = urn.match(/:(\d+)$/)
          return urnMatch ? urnMatch[1] : urn
        }
      }
      // https://www.linkedin.com/posts/username_POST_ID
      if (pathname.startsWith('/posts/')) {
        return pathname.split('/posts/')[1]?.split(/[?&#/]/)[0] || null
      }
    }

    return null
  }
}
