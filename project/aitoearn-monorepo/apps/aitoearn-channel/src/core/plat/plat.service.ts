import { Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import { RedisService } from '@yikart/redis'
import { isInstance } from 'class-validator'
import { AccountService } from '../account/account.service'
import { BilibiliService } from './bilibili/bilibili.service'
import { KwaiService } from './kwai/kwai.service'
import { MetaService } from './meta/meta.service'
import { PinterestService } from './pinterest/pinterest.service'
import { GenAuthURLDto } from './plat.dto'
import { TiktokService } from './tiktok/tiktok.service'
import { TwitterService } from './twitter/twitter.service'
import { YoutubeService } from './youtube/youtube.service'
// import { WxPlatService } from './wxPlat/wxPlat.service';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name)
  private platformServiceMap: { [key in AccountType]?: any } = {}
  constructor(
    private readonly redisService: RedisService,
    private readonly bilibiliService: BilibiliService,
    private readonly kwaiService: KwaiService,
    private readonly metaService: MetaService,
    private readonly pinterestService: PinterestService,
    private readonly tiktokService: TiktokService,
    private readonly twitterService: TwitterService,
    private readonly accountService: AccountService,
    private readonly youtubeService: YoutubeService,
    // private readonly wxPlatService: WxPlatService,
  ) {
    this.platformServiceMap[AccountType.BILIBILI] = this.bilibiliService
    this.platformServiceMap[AccountType.KWAI] = this.kwaiService
    this.platformServiceMap[AccountType.FACEBOOK] = this.metaService
    this.platformServiceMap[AccountType.INSTAGRAM] = this.metaService
    this.platformServiceMap[AccountType.THREADS] = this.metaService
    this.platformServiceMap[AccountType.LINKEDIN] = this.metaService
    this.platformServiceMap[AccountType.PINTEREST] = this.pinterestService
    this.platformServiceMap[AccountType.TIKTOK] = this.tiktokService
    this.platformServiceMap[AccountType.TWITTER] = this.twitterService
    this.platformServiceMap[AccountType.YOUTUBE] = this.youtubeService
    // this.platformServiceMap[AccountType.WxGzh] = this.wxPlatService;
  }

  async getUserAccounts(userId: string) {
    const accounts = await this.accountService.getUserAccountList(userId)
    if (!accounts || accounts.length === 0) {
      return []
    }
    for (const account of accounts) {
      const svc = this.platformServiceMap[account.type]
      if (svc && svc.getAccessTokenStatus) {
        if (isInstance(svc, MetaService)) {
          account.status = await svc.getAccessTokenStatus(account._id.toString(), account.type)
        }
        else {
          account.status = await svc.getAccessTokenStatus(account._id.toString())
        }
      }
    }
    return accounts
  }

  async updateAccountStatus(accountId: string, status: number) {
    const res = await this.accountService.updateAccountStatus(accountId, status)
    return res
  }

  async generateAuthorizationUrl(data: GenAuthURLDto) {
    const platform = data.platform as AccountType
    const svc = this.platformServiceMap[platform]
    if (!svc) {
      throw new Error(`Unsupported platform: ${data.platform}`)
    }
    let resp: any = null
    switch (platform) {
      case AccountType.BILIBILI:
        resp = await svc.createAuthTask({
          userId: data.userId,
          type: data.type,
        })
        break
      case AccountType.WxGzh:
        resp = await svc.createAuthTask({
          userId: data.userId,
          type: data.type,
        })
        break
      case AccountType.KWAI:
        resp = await svc.createAuthTask({
          userId: data.userId,
          type: data.type,
        })
        break
      case AccountType.FACEBOOK:
      case AccountType.INSTAGRAM:
      case AccountType.THREADS:
      case AccountType.LINKEDIN:
        resp = await svc.generateAuthorizationUrl({
          userId: data.userId,
          platform,
          scopes: data.scopes,
        })
        break
      case AccountType.TIKTOK:
        resp = await svc.getAuthUrl(data.userId, data.scopes)
        break
      case AccountType.TWITTER:
        resp = await svc.generateAuthorizationUrl({
          userId: data.userId,
          platform,
          scopes: data.scopes,
        })
        break
      case AccountType.PINTEREST:
        resp = await svc.getAuth({
          userId: data.userId,
        })
        break
      default:
        throw new Error(`Unsupported platform: ${data.platform}`)
    }
    if (!resp || !resp.taskId) {
      throw new Error(`Failed to generate authorization URL for platform: ${data.platform}`)
    }
    const spaceInfoCached = await this.redisService.setJson(
      `platform:oauth:space:${resp.taskId}`,
      data.spaceId,
      600,
    )
    if (!spaceInfoCached) {
      throw new Error(`Failed to generate authorization URL for platform: ${data.platform}`)
    }
    return resp
  }
}
