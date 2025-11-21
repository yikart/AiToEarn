import { Inject, Injectable, Logger } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import { SocialMediaError } from '../../libs/exception/base'
import { AccountService } from '../account/account.service'
import { PlatformBaseService } from './base.service'

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name)
  @Inject('CHANNEL_PROVIDERS')
  private readonly platformServices: Record<AccountType, PlatformBaseService>

  @Inject(RedisService)
  private readonly redisService: RedisService

  @Inject(AccountService)
  private readonly accountService: AccountService

  async getUserAccounts(userId: string) {
    const accounts = await this.accountService.getUserAccountList(userId)
    if (!accounts || accounts.length === 0) {
      return []
    }
    for (const account of accounts) {
      const svc = this.platformServices[account.type]
      if (svc) {
        const status = await svc.getAccessTokenStatus(account._id.toString())
        this.logger.log(`${account.type} access token status: ${status}`)
        account.status = status
      }
    }
    return accounts
  }

  async deletePost(accountId: string, platform: AccountType, postId: string) {
    try {
      const svc = this.platformServices[platform]
      if (svc) {
        return await svc.deletePost(accountId, postId)
      }
      return new AppException(ResponseCode.PlatformNotSupported)
    }
    catch (error) {
      if (error instanceof SocialMediaError) {
        return new AppException(ResponseCode.DeletePostFailed, error.message)
      }
      return new AppException(ResponseCode.DeletePostFailed, 'Unknown error')
    }
  }

  async updateAccountStatus(accountId: string, status: number) {
    const res = await this.accountService.updateAccountStatus(accountId, status)
    return res
  }
}
