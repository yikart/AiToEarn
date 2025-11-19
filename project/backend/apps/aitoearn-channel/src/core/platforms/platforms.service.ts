import { Inject, Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import { RedisService } from '@yikart/redis'
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
        account.status = await svc.getAccessTokenStatus(account._id.toString())
      }
    }
    return accounts
  }

  async deletePost(accountId: string, platform: AccountType, postId: string) {
    const svc = this.platformServices[platform]
    if (svc) {
      return await svc.deletePost(accountId, postId)
    }
    return false
  }

  async updateAccountStatus(accountId: string, status: number) {
    const res = await this.accountService.updateAccountStatus(accountId, status)
    return res
  }
}
