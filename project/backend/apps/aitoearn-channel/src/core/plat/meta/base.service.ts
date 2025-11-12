import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { RedisService } from '@yikart/redis'
import { Model } from 'mongoose'
import { getCurrentTimestamp } from '../../../common'

import { OAuth2Credential } from '../../../libs/database/schema/oauth2Credential.schema'
import { META_TIME_CONSTANTS, MetaRedisKeys } from './constants'
import { MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class MetaBaseService {
  protected readonly platform: string = 'meta'
  protected readonly logger = new Logger(MetaBaseService.name)

  @InjectModel(OAuth2Credential.name)
  protected readonly oAuth2CredentialModel: Model<OAuth2Credential>

  @Inject(RedisService)
  protected readonly redisService: RedisService

  constructor() { }

  protected async getOAuth2Credential(accountId: string): Promise<MetaUserOAuthCredential | null> {
    let key = MetaRedisKeys.getAccessTokenKey(this.platform, accountId)
    if (this.platform === 'facebook') {
      key = MetaRedisKeys.getUserPageAccessTokenKey('facebook', accountId)
    }
    let credential = await this.redisService.getJson<MetaUserOAuthCredential>(key)
    if (!credential) {
      const oauth2Credential = await this.oAuth2CredentialModel.findOne(
        {
          accountId,
          platform: this.platform,
        },
      )
      if (!oauth2Credential) {
        return null
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
}
