/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: b站-统计数据
 */
import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AccountType, AitoearnServerClientService } from '@yikart/aitoearn-server-client'
import { PinterestService } from '../../core/plat/pinterest/pinterest.service'
import { DataCubeBase } from './data.base'

@Injectable()
export class PinterestDataService extends DataCubeBase {
  private readonly logger = new Logger(PinterestDataService.name)
  constructor(
    readonly pinterestService: PinterestService,
    private readonly serverClient: AitoearnServerClientService,
  ) {
    super()
  }

  @OnEvent(`account.create.${AccountType.PINTEREST}`)
  async accountPortraitReport(accountId: string) {
    const res = await this.getAccountDataCube(accountId)
    this.serverClient.account.updateAccountStatistics(accountId, {
      workCount: res.arcNum,
      fansCount: res.fensNum,
    })
  }

  async getAccountDataCube(accountId: string) {
    const res: any = await this.pinterestService.getUserStat(accountId)
    return {
      fensNum: res.userInfo.follower,
      arcNum: res.userInfo.monthly_views,
    }
  }

  async getAccountDataBulk(accountId: string) {
    this.logger.log('getAccountDataBulk', accountId)
    return {
      list: [],
    }
  }

  async getArcDataCube(accountId: string) {
    const res: any = await this.pinterestService.getUserStat(accountId)
    const { userInfo } = res
    return {
      fensNum: userInfo.follower_count,
      playNum: userInfo.monthly_views,
      pin_count: userInfo.pin_count,
      board_count: userInfo.board_count,
    }
  }

  async getArcDataBulk(accountId: string, dataId: string) {
    this.logger.log('getArcDataBulk', accountId, dataId)
    return {
      recordId: '',
      dataId: '',
      list: [],
    }
  }
}
