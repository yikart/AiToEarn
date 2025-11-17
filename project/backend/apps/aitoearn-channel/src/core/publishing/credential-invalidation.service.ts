import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType } from '@yikart/aitoearn-server-client'
import { RedisService } from '@yikart/redis'
import { Model } from 'mongoose'
import { OAuth2Credential } from '../../libs/database/schema/oauth2Credential.schema'
import { AccountService } from '../account/account.service'
import { MetaRedisKeys } from '../platforms/meta/constants'
import { TiktokRedisKeys } from '../platforms/tiktok/constants'
import { TwitterRedisKeys } from '../platforms/twitter/constants'

@Injectable()
export class CredentialInvalidationService {
  private readonly logger = new Logger(CredentialInvalidationService.name)

  @Inject(RedisService)
  private readonly redisService: RedisService

  @InjectModel(OAuth2Credential.name)
  private readonly oAuth2CredentialModel: Model<OAuth2Credential>

  constructor(
    private readonly accountService: AccountService,
  ) {}

  private getRedisKeysToDelete(accountId: string, accountType: AccountType): string {
    switch (accountType) {
      case AccountType.FACEBOOK:
        return MetaRedisKeys.getUserPageAccessTokenKey('facebook', accountId)
      case AccountType.INSTAGRAM:
      case AccountType.THREADS:
      case AccountType.LINKEDIN:
        return MetaRedisKeys.getAccessTokenKey(accountType, accountId)
      case AccountType.TWITTER:
        return TwitterRedisKeys.getAccessTokenKey(accountId)
      case AccountType.TIKTOK:
        return TiktokRedisKeys.getAccessTokenKey(accountId)
      case AccountType.YOUTUBE:
      case AccountType.PINTEREST:
      case AccountType.BILIBILI:
      case AccountType.KWAI:
      case AccountType.WxGzh:
        return `${accountType.toLowerCase()}:accessToken:${accountId}`
      default:
        return ''
    }
  }

  private async deleteRedisCredential(accountId: string, accountType: AccountType) {
    try {
      const key = this.getRedisKeysToDelete(accountId, accountType)
      if (!key) {
        return
      }
      await this.redisService.del(key)
    }
    catch (err) {
      this.logger.warn(`Failed to delete Redis credential for accountId=${accountId}, type=${accountType}: ${err?.message}`)
    }
  }

  private async deleteDbCredential(accountId: string, accountType: AccountType) {
    try {
      await this.oAuth2CredentialModel.deleteOne({
        accountId,
        platform: accountType,
      }).exec()
    }
    catch (err) {
      this.logger.warn(`Failed to delete DB credential for accountId=${accountId}, type=${accountType}: ${err?.message}`)
    }
  }

  async invalidate(accountId: string, accountType: AccountType): Promise<void> {
    this.logger.log(`Invalidating credentials for accountId=${accountId}, type=${accountType}`)
    await this.deleteRedisCredential(accountId, accountType)
    await this.deleteDbCredential(accountId, accountType)
  }
}
