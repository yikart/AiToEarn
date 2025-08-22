import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AccountNatsApi } from '@/transports/account/account.natsApi';
import { AccountType } from '@/transports/account/common';
import { ThreadsService } from '../plat/meta/threads.service';
import { DataCubeBase } from './data.base';

@Injectable()
export class ThreadsDataService extends DataCubeBase {
  constructor(readonly threadsService: ThreadsService, readonly accountNatsApi: AccountNatsApi) {
    super();
  }

  @OnEvent(`account.create.${AccountType.THREADS}`)
  async accountPortraitReport(accountId: string) {
    const res = await this.getAccountDataCube(accountId)
    this.accountNatsApi.updateAccountStatistics(accountId, {
      likeCount: res.likeNum,
      commentCount: res.commentNum,
      readCount: res.playNum,
      collectCount: res.shareNum,
      fansCount: res.fensNum,
    })
  }

  async getAccountDataCube(accountId: string) {
    const query = {
      metric: 'likes,replies,followers_count,reposts,views,quotes',
    }
    const res = await this.threadsService.getAccountInsights(accountId, query);
    return {
      likeNum: res?.data?.filter(item => item.name === 'likes')?.[0]?.total_value?.[0]?.value || 0,
      commentNum: res?.data?.filter(item => item.name === 'replies')?.[0]?.total_value?.[0]?.value || 0,
      shareNum: res?.data?.filter(item => item.name === 'reposts')?.[0]?.total_value?.[0]?.value || 0,
      fensNum: res?.data?.filter(item => item.name === 'followers_count')?.[0]?.total_value?.[0]?.value || 0,
      playNum: res?.data?.filter(item => item.name === 'views')?.[0]?.total_value?.[0]?.value || 0,
    };
  }

  // Todo : Implement bulk data retrieval for crawler service
  async getAccountDataBulk(accountId: string) {
    Logger.log('getAccountDataBulk', accountId);
    return {
      list: [],
    };
  }

  async getArcDataCube(accountId: string, dataId: string) {
    const query = {
      metric: 'likes,views,replies,shares',
    }
    const res = await this.threadsService.getMediaInsights(accountId, dataId, query);
    return {
      commentNum: res?.data?.filter(item => item.name === 'replies')?.[0]?.values?.[0]?.value || 0,
      likeNum: res?.data?.filter(item => item.name === 'likes')?.[0]?.values?.[0]?.value || 0,
      shareNum: res?.data?.filter(item => item.name === 'shares')?.[0]?.values?.[0]?.value || 0,
      viewNum: res?.data?.filter(item => item.name === 'views')?.[0]?.values?.[0]?.value || 0,
    }
  }

  // Todo : Implement bulk data retrieval for crawler service
  async getArcDataBulk(accountId: string, dataId: string) {
    Logger.log('getArcDataBulk', accountId, dataId);
    return {
      recordId: '',
      dataId: '',
      list: [],
    };
  }
}
