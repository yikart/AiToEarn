import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AccountInternalApi } from '../../transports/account/account.api'
import { AccountType } from '../../transports/account/common'
import { FacebookService } from '../plat/meta/facebook.service'
import { DataCubeBase } from './data.base'

@Injectable()
export class FacebookDataService extends DataCubeBase {
  private readonly logger = new Logger(FacebookDataService.name)
  constructor(readonly facebookService: FacebookService, readonly accountInternalApi: AccountInternalApi) {
    super()
  }

  @OnEvent(`account.create.${AccountType.FACEBOOK}`)
  async accountPortraitReport(accountId: string) {
    const res = await this.getAccountDataCube(accountId)
    this.accountInternalApi.updateAccountStatistics(accountId, {
      readCount: res.playNum,
      fansCount: res.fensNum,
    })
  }

  async getAccountDataCube(accountId: string) {
    const res = await this.facebookService.getAccountInsights(accountId)
    return {
      fensNum: res.fensNum,
      playNum: res.playNum,
    }
  }

  async getAccountDataBulk(accountId: string) {
    this.logger.log('getAccountDataBulk', accountId)
    return {
      list: [],
    }
  }

  async getArcDataCube(accountId: string, dataId: string) {
    this.logger.log('getArcDataCube', accountId, dataId)
    const res = await this.facebookService.getPostInsights(accountId, dataId)
    return res || {}
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
