import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { RedisService } from '@yikart/redis'
import { Model } from 'mongoose'
import { getCurrentTimestamp } from '../../../common'

import { OAuth2Credential } from '../../../libs/database/schema/oauth2Credential.schema'
import { PlatformBaseService } from '../base.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { META_TIME_CONSTANTS, MetaRedisKeys } from './constants'
import { MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class MetaBaseService extends PlatformBaseService {
  protected override readonly platform: string = 'meta'
  protected override readonly logger = new Logger(MetaBaseService.name)

  @InjectModel(OAuth2Credential.name)
  protected readonly oAuth2CredentialModel: Model<OAuth2Credential>

  @Inject(RedisService)
  protected readonly redisService: RedisService

  constructor() {
    super()
  }

  protected async getOAuth2Credential(accountId: string): Promise<MetaUserOAuthCredential | null> {
    let key = MetaRedisKeys.getAccessTokenKey(this.platform, accountId)
    if (this.platform === 'facebook') {
      key = MetaRedisKeys.getUserPageAccessTokenKey('facebook', accountId)
    }
    let credential = await this.redisService.getJson<MetaUserOAuthCredential>(key)
    if (!credential) {
      this.logger.error(`No access token found for accountId: ${this.platform} ${accountId} in redis`)
      const oauth2Credential = await this.oAuth2CredentialModel.findOne(
        {
          accountId,
          platform: this.platform,
        },
      )
      if (!oauth2Credential) {
        throw new PlatformAuthExpiredException(this.platform)
      }
      credential = JSON.parse(oauth2Credential.raw) as MetaUserOAuthCredential
    }
    return credential
  }

  protected async saveOAuth2Credential(
    accountId: string,
    tokenInfo: MetaUserOAuthCredential,
    platform: string,
  ): Promise<boolean> {
    const now = getCurrentTimestamp()
    const expireTime
      = now + tokenInfo.expires_in - META_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    tokenInfo.expires_in = expireTime
    const cached = await this.redisService.setJson(
      MetaRedisKeys.getAccessTokenKey(platform, accountId),
      tokenInfo,
    )
    const persistResult = await this.oAuth2CredentialModel.updateOne({
      accountId,
      platform,
    }, {
      accessToken: tokenInfo.access_token,
      refreshToken: tokenInfo.refresh_token,
      accessTokenExpiresAt: tokenInfo.expires_in,
      refreshTokenExpiresAt: tokenInfo.refresh_token_expires_in,
      raw: JSON.stringify(tokenInfo),
    }, {
      upsert: true,
    })
    const saved = cached && (persistResult.modifiedCount > 0 || persistResult.upsertedCount > 0)
    return saved
  }

  override async getAccessTokenStatus(
    accountId: string,
  ): Promise<number> {
    const credential = await this.getOAuth2Credential(accountId)
    if (!credential) {
      return 0
    }
    return credential.expires_in > getCurrentTimestamp() ? 1 : 0
  }
}
