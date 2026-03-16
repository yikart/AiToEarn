import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AccountType, AppException } from '@yikart/common'
import { AccountRepository } from '@yikart/mongodb'
import { YoutubeService } from '../platforms/youtube/youtube.service'
import { DataCubeBase } from './data.base'

function isYoutubeResponse(value: unknown): value is { items?: unknown[] } {
  return value !== null && typeof value === 'object' && !(value instanceof AppException) && 'items' in value
}

@Injectable()
export class YoutubeDataService extends DataCubeBase {
  private readonly logger = new Logger(YoutubeDataService.name)
  constructor(
    readonly youtubeService: YoutubeService,
    private readonly accountRepository: AccountRepository,
  ) {
    super()
  }

  @OnEvent(`account.create.${AccountType.YOUTUBE}`)
  async accountPortraitReport(accountId: string) {
    const res = await this.getAccountDataCube(accountId)
    await this.accountRepository.updateAccountStatistics(accountId, {
      fansCount: res.fensNum,
      workCount: res.arcNum,
      readCount: res.playNum,
    })
  }

  // 账户数据
  async getAccountDataCube(accountId: string) {
    this.logger.log(`getAccountDataCube accountId: ${accountId}`)
    const res = await this.youtubeService.getChannelsList(accountId, undefined, undefined, undefined, true)

    if (!isYoutubeResponse(res)) {
      return { fensNum: 0, arcNum: 0, playNum: 0 }
    }
    const statData = (res.items as Array<{ statistics?: Record<string, string> }>)?.[0]?.statistics

    return {
      fensNum: Number.parseInt(statData?.['subscriberCount'] || '0') || 0,
      arcNum: Number.parseInt(statData?.['videoCount'] || '0') || 0,
      playNum: Number.parseInt(statData?.['viewCount'] || '0') || 0,
    }
  }

  // 账户数据增量
  async getAccountDataBulk(accountId: string) {
    this.logger.log('getAccountDataBulk', accountId)
    return {
      list: [],
    }
  }

  // 作品数据
  async getArcDataCube(accountId: string, dataId: string) {
    this.logger.log('getArcDataCube', accountId, dataId)
    const res = await this.youtubeService.getVideosList(accountId, undefined, [dataId])

    if (!isYoutubeResponse(res)) {
      return { fensNum: 0, likeNum: 0, playNum: 0, commentNum: 0 }
    }
    const statData = (res.items as Array<{ statistics?: Record<string, string> }>)?.[0]?.statistics

    return {
      fensNum: Number.parseInt(statData?.['favoriteCount'] || '0') || 0,
      likeNum: Number.parseInt(statData?.['likeCount'] || '0') || 0,
      playNum: Number.parseInt(statData?.['viewCount'] || '0') || 0,
      commentNum: Number.parseInt(statData?.['commentCount'] || '0') || 0,
    }
  }

  // 作品数据增量
  async getArcDataBulk(accountId: string, dataId: string) {
    this.logger.log('getArcDataBulk', accountId, dataId)
    return {
      recordId: '',
      dataId: '',
      list: [],
    }
  }
}
