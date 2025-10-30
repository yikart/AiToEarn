/*
 * @Author: zhangwei
 * @Date: 2025-08-04 21:25:55
 * @LastEditTime: 2025-08-04 21:25:55
 * @LastEditors: zhangwei
 * @Description: YouTube-统计数据
 */
import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AccountType, AitoearnServerClientService } from '@yikart/aitoearn-server-client'
import { YoutubeService } from '../plat/youtube/youtube.service'
import { DataCubeBase } from './data.base'

@Injectable()
export class YoutubeDataService extends DataCubeBase {
  private readonly logger = new Logger(YoutubeDataService.name)
  constructor(
    readonly youtubeService: YoutubeService,
    private readonly serverClient: AitoearnServerClientService,
  ) {
    super()
  }

  @OnEvent(`account.create.${AccountType.YOUTUBE}`)
  async accountPortraitReport(accountId: string) {
    const res = await this.getAccountDataCube(accountId)
    this.serverClient.account.updateAccountStatistics(accountId, {
      fansCount: res.fensNum,
      workCount: res.arcNum,
      readCount: res.playNum,
    })
  }

  // 账户数据
  async getAccountDataCube(accountId: string) {
    this.logger.log(`getAccountDataCube accountId: ${accountId}`)
    const res = await this.youtubeService.getChannelsList(accountId, undefined, undefined, undefined, true)
    const statData = res.data.items[0].statistics

    return {
      fensNum: Number.parseInt(statData.subscriberCount) || 0,
      arcNum: Number.parseInt(statData.videoCount) || 0,
      playNum: Number.parseInt(statData.viewCount) || 0,
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
    const statData = res.data.items[0].statistics

    return {
      fensNum: Number.parseInt(statData.favoriteCount) || 0,
      likeNum: Number.parseInt(statData.likeCount) || 0,
      playNum: Number.parseInt(statData.viewCount) || 0,
      commentNum: Number.parseInt(statData.commentCount) || 0,
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
