/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: 微信公众号-统计数据
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import moment from 'moment';
import { AccountNatsApi } from '@/transports/account/account.natsApi';
import { AccountType } from '@/transports/account/common';
import { WxGzhService } from '../plat/wxPlat/wxGzh.service';
import { DataCubeBase } from './data.base';

@Injectable()
export class WxGzhDataService extends DataCubeBase {
  constructor(readonly wxGzhService: WxGzhService, readonly accountNatsApi: AccountNatsApi) {
    super();
  }

  @OnEvent(`account.create.${AccountType.WxGzh}`)
  async accountPortraitReport(accountId: string) {
    const res = await this.getAccountDataCube(accountId)
    this.accountNatsApi.updateAccountStatistics(accountId, {
      fansCount: res.fensNum,
    })
  }

  async getAccountDataCube(accountId: string) {
    const [startTime, endTime] = [moment().startOf('day').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')]
    const res = await this.wxGzhService.getusercumulate(accountId, startTime, endTime);
    const lastData = res.list[0];

    return {
      fensNum: lastData.cumulate_user,
    };
  }

  async getAccountDataBulk(accountId: string) {
    Logger.log('getAccountDataBulk', accountId);
    return {
      list: [],
    };
  }

  async getArcDataCube(accountId: string, dataId: string) {
    return {
    };
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
