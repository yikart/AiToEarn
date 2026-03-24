import { Inject, Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import { OAuth2CredentialRepository } from '@yikart/channel-db'
import { RedisService } from '@yikart/redis'
import { ChannelRedisKeys } from '../channel.constants'

@Injectable()
export class CredentialInvalidationService {
  private readonly logger = new Logger(CredentialInvalidationService.name)

  @Inject(RedisService)
  private readonly redisService: RedisService

  @Inject(OAuth2CredentialRepository)
  protected readonly oauth2CredentialRepository: OAuth2CredentialRepository

  private getRedisKeysToDelete(accountId: string, accountType: AccountType): string {
    switch (accountType) {
      case AccountType.FACEBOOK:
        return ChannelRedisKeys.pageAccessToken('facebook', accountId)
      case AccountType.INSTAGRAM:
      case AccountType.THREADS:
      case AccountType.LINKEDIN:
        return ChannelRedisKeys.accessToken(accountType, accountId)
      case AccountType.TWITTER:
        return ChannelRedisKeys.accessToken('twitter', accountId)
      case AccountType.TIKTOK:
        return ChannelRedisKeys.accessToken('tiktok', accountId)
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
    catch (err: any) {
      this.logger.warn(`Failed to delete Redis credential for accountId=${accountId}, type=${accountType}: ${err?.message}`)
    }
  }

  private async deleteDbCredential(accountId: string, accountType: AccountType) {
    try {
      await this.oauth2CredentialRepository.delOne(
        accountId,
        accountType,
      )
    }
    catch (err: any) {
      this.logger.warn(`Failed to delete DB credential for accountId=${accountId}, type=${accountType}: ${err?.message}`)
    }
  }

  async invalidate(accountId: string, accountType: AccountType): Promise<void> {
    this.logger.log(`Invalidating credentials for accountId=${accountId}, type=${accountType}`)
    await this.deleteRedisCredential(accountId, accountType)
    await this.deleteDbCredential(accountId, accountType)
  }
}
