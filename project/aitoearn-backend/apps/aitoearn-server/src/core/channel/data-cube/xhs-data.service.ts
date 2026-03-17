import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AccountType } from '@yikart/common'
import { AccountRepository } from '@yikart/mongodb'
import { XiaohongshuService } from '../platforms/xiaohongshu/xiaohongshu.service'
import { DataCubeBase } from './data.base'

@Injectable()
export class XhsDataService extends DataCubeBase {
  private readonly logger = new Logger(XiaohongshuService.name)
  constructor(
    readonly xhsService: XiaohongshuService,
    private readonly accountRepository: AccountRepository,
  ) {
    super()
  }

  @OnEvent(`account.create.${AccountType.Xhs}`)
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

    return {
      fensNum: 0,
      arcNum: 0,
      playNum: 0,
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
    return {
      fensNum: 0,
      likeNum: 0,
      playNum: 0,
      commentNum: 0,
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
