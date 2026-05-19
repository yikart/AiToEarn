import { Inject, Injectable, Logger } from '@nestjs/common'
import { Account, AccountStatus } from '@yikart/channel-db'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { google } from 'googleapis'
import { BatchAccountStatusVo } from '../../account/account.vo'
import { RelayAccountException } from '../../relay/relay-account.exception'
import { RelayClientService } from '../../relay/relay-client.service'
import { PlatformBaseService, ValidatedWorkInfo, WorkDetailInfo, WorkLinkInfo } from './base.service'
import { BilibiliService } from './bilibili/bilibili.service'
import { ChannelAccountService } from './channel-account.service'
import { KwaiService } from './kwai/kwai.service'
import { InstagramService } from './meta/instagram.service'
import { PinterestService } from './pinterest/pinterest.service'
import { TiktokService } from './tiktok/tiktok.service'
import { WxPlatService } from './wx-plat/wx-plat.service'
import { YoutubeService } from './youtube/youtube.service'

export interface AccountStatsData {
  fansCount?: number
  readCount?: number
  likeCount?: number
  collectCount?: number
  commentCount?: number
  workCount?: number
}

const SUPPORTED_REFRESH_PLATFORMS = new Set<string>([
  AccountType.TIKTOK,
  AccountType.BILIBILI,
  AccountType.KWAI,
  AccountType.YOUTUBE,
  AccountType.INSTAGRAM,
  AccountType.PINTEREST,
])

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name)
  @Inject('CHANNEL_PROVIDERS')
  private readonly platformServices: Record<AccountType, PlatformBaseService>

  @Inject()
  private readonly channelAccountService: ChannelAccountService

  @Inject()
  private readonly relayClientService: RelayClientService

  @Inject()
  private readonly wxPlatService: WxPlatService

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
          this.logger.error(error, `user:[${userId}] -- ${account.type} get access token status failed`)
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
      this.logger.error(error, 'Fetch relay account statuses failed')
      for (const account of relayAccounts) {
        account.status = AccountStatus.ABNORMAL
      }
    }
  }

  getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string, accountId?: string): Promise<WorkLinkInfo> {
    if (accountType === AccountType.WxSph) {
      return this.wxPlatService.getWorkLinkInfo(accountType, workLink, dataId)
    }

    const svc = this.platformServices[accountType]
    if (!svc) {
      throw new AppException(ResponseCode.PlatformNotSupported)
    }
    return svc.getWorkLinkInfo(accountType, workLink, dataId, accountId)
  }

  async validateOwnedWorkLink(accountType: AccountType, accountId: string, workLink: string): Promise<ValidatedWorkInfo> {
    const svc = this.platformServices[accountType]
    if (!svc) {
      throw new AppException(ResponseCode.PlatformNotSupported)
    }
    return await svc.validateOwnedWorkLink(accountType, accountId, workLink)
  }

  async deletePost(accountId: string, platform: AccountType, postId: string) {
    const svc = this.platformServices[platform]
    if (!svc) {
      throw new AppException(ResponseCode.PlatformNotSupported)
    }
    return await svc.deletePost(accountId, postId)
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

  isSupportedRefreshPlatform(type: string): boolean {
    return SUPPORTED_REFRESH_PLATFORMS.has(type)
  }

  async fetchLatestStatsFromPlatform(account: Account): Promise<AccountStatsData> {
    const accountId = account.id

    switch (account.type) {
      case AccountType.TIKTOK: {
        const svc = this.platformServices[AccountType.TIKTOK] as unknown as TiktokService
        const info = await svc.getUserInfo(accountId, 'follower_count,following_count,likes_count,video_count')
        return {
          fansCount: info.data.user.follower_count ?? undefined,
          likeCount: info.data.user.like_count ?? undefined,
          workCount: info.data.user.video_count ?? undefined,
        }
      }
      case AccountType.BILIBILI: {
        const svc = this.platformServices[AccountType.BILIBILI] as unknown as BilibiliService
        const stat = await svc.getUserStatByAccountId(accountId)
        return {
          fansCount: (stat as any).follower ?? undefined,
        }
      }
      case AccountType.KWAI: {
        const svc = this.platformServices[AccountType.KWAI] as unknown as KwaiService
        const info = await svc.getAuthorInfoByAccountId(accountId)
        return {
          fansCount: info.fan ?? undefined,
        }
      }
      case AccountType.YOUTUBE: {
        const svc = this.platformServices[AccountType.YOUTUBE] as unknown as YoutubeService
        const accessToken = await svc.getUserAccessTokenByAccountId(accountId)
        const localAuth = new google.auth.OAuth2()
        localAuth.setCredentials({ access_token: accessToken })
        const youtube = google.youtube({ version: 'v3', auth: localAuth })
        const response = await youtube.channels.list({
          part: ['statistics'],
          mine: true,
        })
        const channel = response.data.items?.[0]
        const stats = channel?.statistics
        return {
          fansCount: stats?.subscriberCount ? Number(stats.subscriberCount) : undefined,
          readCount: stats?.viewCount ? Number(stats.viewCount) : undefined,
          workCount: stats?.videoCount ? Number(stats.videoCount) : undefined,
        }
      }
      case AccountType.INSTAGRAM: {
        const svc = this.platformServices[AccountType.INSTAGRAM] as unknown as InstagramService
        const info = await svc.getAccountInfoByAccountId(accountId, {
          fields: 'followers_count,follows_count,media_count',
        })
        return {
          fansCount: info.followers_count ?? undefined,
          workCount: info.media_count ?? undefined,
        }
      }
      case AccountType.PINTEREST: {
        const svc = this.platformServices[AccountType.PINTEREST] as unknown as PinterestService
        const info = await svc.getUserInfo(accountId)
        return {
          fansCount: (info as any).follower_count ?? undefined,
        }
      }
      default:
        throw new AppException(ResponseCode.AccountRefreshNotSupported)
    }
  }
}
