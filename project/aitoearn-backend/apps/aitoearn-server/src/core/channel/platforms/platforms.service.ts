import { Inject, Injectable, Logger } from '@nestjs/common'
import { AccountStatus } from '@yikart/channel-db'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { BatchAccountStatusVo } from '../../account/account.vo'
import { RelayAccountException } from '../../relay/relay-account.exception'
import { RelayClientService } from '../../relay/relay-client.service'
import { SocialMediaError } from '../libs/exception/base'
import { PlatformBaseService, WorkDetailInfo } from './base.service'
import { ChannelAccountService } from './channel-account.service'

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name)
  @Inject('CHANNEL_PROVIDERS')
  private readonly platformServices: Record<AccountType, PlatformBaseService>

  @Inject()
  private readonly channelAccountService: ChannelAccountService

  @Inject()
  private readonly relayClientService: RelayClientService

  async getUserAccounts(userId: string) {
    const accounts = await this.channelAccountService.getUserAccountList(userId)
    if (!accounts || accounts.length === 0) {
      return []
    }

    const relayAccounts = accounts.filter(a => a.relayAccountRef)
    const localAccounts = accounts.filter(a => !a.relayAccountRef)

    for (const account of localAccounts) {
      const svc = this.platformServices[account.type]
      if (svc) {
        try {
          const status = await svc.getAccessTokenStatus(account._id.toString())
          account.status = status
        }
        catch (error) {
          if (error instanceof RelayAccountException) {
            throw error
          }
          this.logger.error(`user:[${userId}] -- ${account.type} get access token status failed: ${error}`)
          account.status = AccountStatus.ABNORMAL
        }
      }
    }

    if (relayAccounts.length > 0 && this.relayClientService.enabled) {
      await this.fetchRelayAccountStatuses(relayAccounts)
    }

    return accounts
  }

  private async fetchRelayAccountStatuses(relayAccounts: { _id: any, relayAccountRef: string | null, type: AccountType, status: number }[]) {
    try {
      const accountIds = relayAccounts.map(a => a.relayAccountRef).filter(Boolean) as string[]
      const result = await this.relayClientService.post<BatchAccountStatusVo>('/account/batch-status', { accountIds })
      const statusMap = result.statuses ?? {}
      for (const account of relayAccounts) {
        if (account.relayAccountRef && statusMap[account.relayAccountRef] !== undefined) {
          account.status = statusMap[account.relayAccountRef]
        }
      }
    }
    catch (error) {
      this.logger.error(`Fetch relay account statuses failed: ${error}`)
      for (const account of relayAccounts) {
        account.status = AccountStatus.ABNORMAL
      }
    }
  }

  getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string, accountId?: string) {
    const svc = this.platformServices[accountType]
    if (svc) {
      return svc.getWorkLinkInfo(accountType, workLink, dataId, accountId)
    }
    throw new AppException(ResponseCode.PlatformNotSupported)
  }

  async deletePost(accountId: string, platform: AccountType, postId: string) {
    try {
      const svc = this.platformServices[platform]
      if (svc) {
        return await svc.deletePost(accountId, postId)
      }
      throw new AppException(ResponseCode.PlatformNotSupported)
    }
    catch (error) {
      if (error instanceof SocialMediaError) {
        throw new AppException(ResponseCode.DeletePostFailed, error.message)
      }
      if (error instanceof AppException) {
        throw error
      }
      throw new AppException(ResponseCode.DeletePostFailed, 'Unknown error')
    }
  }

  async getAccountTokenStatus(accountId: string, accountType: AccountType): Promise<number> {
    const svc = this.platformServices[accountType]
    if (!svc) {
      throw new AppException(ResponseCode.PlatformNotSupported)
    }
    return await svc.getAccessTokenStatus(accountId)
  }

  async updateAccountStatus(accountId: string, status: number) {
    const res = await this.channelAccountService.updateAccountStatus(accountId, status)
    return res
  }

  /**
   * 获取作品详情
   * @param accountType 平台类型
   * @param accountId 账号ID（用于API调用授权）
   * @param dataId 作品ID
   * @returns 作品详情
   */
  async getWorkDetail(accountType: AccountType, accountId: string, dataId: string): Promise<WorkDetailInfo | null> {
    const svc = this.platformServices[accountType]
    if (svc) {
      return svc.getWorkDetail(accountId, dataId)
    }
    throw new AppException(ResponseCode.PlatformNotSupported)
  }

  /**
   * 验证作品是否属于指定账号
   * @param accountType 平台类型
   * @param accountId 账号ID
   * @param dataId 作品ID
   * @returns true 如果作品属于该账号
   * @throws AppException 如果作品不属于该账号或平台不支持
   */
  async verifyWorkOwnership(accountType: AccountType, accountId: string, dataId: string): Promise<boolean> {
    const svc = this.platformServices[accountType]
    if (svc) {
      return svc.verifyWorkOwnership(accountId, dataId)
    }
    throw new AppException(ResponseCode.PlatformNotSupported)
  }
}
