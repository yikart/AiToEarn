import { Injectable, Logger } from '@nestjs/common'
import { getCurrentTimestamp } from '../../../common'
import { LinkedInShareRequest, LinkedInUploadRequest, MemberNetworkVisibility, ShareMediaCategory, UploadRecipe } from '../../../libs/linkedin/linkedin.interface'
import { LinkedinService as LinkedinAPIService } from '../../../libs/linkedin/linkedin.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { MetaBaseService } from './base.service'
import { META_TIME_CONSTANTS } from './constants'
import { MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class LinkedinService extends MetaBaseService {
  protected override readonly platform = 'linkedin'
  protected override readonly logger = new Logger(LinkedinService.name)

  constructor(
    readonly linkedinAPIService: LinkedinAPIService,
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
      credential.expires_in = refreshedToken.expires_in
      const saved = await this.saveOAuth2Credential(accountId, credential, 'linkedin')
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
    this.logger.log(`Init upload request: ${JSON.stringify(initMediaUploadReq)}, accessToken: ${credential.access_token}`)

    const initUploadResp = await this.linkedinAPIService.initMediaUpload(credential.access_token, initMediaUploadReq)
    this.logger.log(`Init upload response: ${JSON.stringify(initUploadResp)}`)
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
    this.logger.log(`Init upload request: ${JSON.stringify(initMediaUploadReq)}, accessToken: ${credential.access_token}`)

    const initUploadResp = await this.linkedinAPIService.initMediaUpload(credential.access_token, initMediaUploadReq)
    this.logger.log(`Init upload response: ${JSON.stringify(initUploadResp)}`)
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
    this.logger.log(`Create share request: ${JSON.stringify(createShareReq)}`)
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
}
