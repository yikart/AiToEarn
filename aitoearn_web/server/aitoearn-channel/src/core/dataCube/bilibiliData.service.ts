/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: b站-统计数据
 */
import { Injectable, Logger } from '@nestjs/common';
import { BilibiliService } from '../plat/bilibili/bilibili.service';
import { DataCubeBase } from './data.base';

@Injectable()
export class BilibiliDataService extends DataCubeBase {
  constructor(readonly bilibiliService: BilibiliService) {
    super();
  }

  async getAccountDataCube(accountId: string) {
    const res = await this.bilibiliService.getUserStat(accountId);
    return {
      fensNum: res.follower,
      arcNum: res.arc_passed_total,
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
    return {};
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
