import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AccountNatsApi } from '@/transports/account/account.natsApi';
import { AccountType } from '@/transports/account/common';
import { FacebookService } from '../plat/meta/facebook.service';
import { DataCubeBase } from './data.base';

@Injectable()
export class FacebookDataService extends DataCubeBase {
  constructor(readonly facebookService: FacebookService, readonly accountNatsApi: AccountNatsApi) {
    super();
  }

  @OnEvent(`account.create.${AccountType.FACEBOOK}`)
  async accountPortraitReport(accountId: string) {
    const res = await this.getAccountDataCube(accountId)
    this.accountNatsApi.updateAccountStatistics(accountId, {
      readCount: res.playNum,
      fansCount: res.fensNum,
    })
  }

  async getAccountDataCube(accountId: string) {
    const res = await this.facebookService.getAccountInsights(accountId);
    return {
      fensNum: res.fensNum,
      playNum: res.playNum,
    };
  }

  async getAccountDataBulk(accountId: string) {
    Logger.log('getAccountDataBulk', accountId);
    return {
      list: [],
    };
  }

  async getArcDataCube(accountId: string, dataId: string) {
    Logger.log('getArcDataCube', accountId, dataId);
    const res = await this.facebookService.getPostInsights(accountId, dataId);
    return res || {};
  }

  async getArcDataBulk(accountId: string, dataId: string) {
    Logger.log('getArcDataBulk', accountId, dataId);
    return {
      recordId: '',
      dataId: '',
      list: [],
    };
  }
}
