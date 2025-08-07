import { Injectable, Logger } from '@nestjs/common';
import { InstagramInsightsRequest, InstagramMediaInsightsRequest } from '@/libs/instagram/instagram.interfaces';
import { InstagramService } from '../plat/meta/instagram.service';
import { DataCubeBase } from './data.base';

@Injectable()
export class InstagramDataService extends DataCubeBase {
  constructor(readonly instagramService: InstagramService) {
    super();
  }

  async getAccountDataCube(accountId: string) {
    const query = {
      fields: 'media_count,followers_count,follows_count',
    }
    const res = await this.instagramService.getAccountInfo(accountId, query);
    return {
      fensNum: res?.followers_count,
      arcNum: res?.media_count,
    };
  }

  // Todo : Implement bulk data retrieval for crawler service
  async getAccountDataBulk(accountId: string) {
    const query: InstagramInsightsRequest = {
      metric: 'comments,likes,replies,shares,views,reach,follows_and_unfollows',
      period: 'day',
    }
    await this.instagramService.getAccountInsights(accountId, query)
    return {
      list: [],
    };
  }

  async getArcDataCube(accountId: string, dataId: string) {
    const query: InstagramMediaInsightsRequest = {
      metric: 'comments,likes,shares,views',
      period: 'lifetime',
    }
    const res = await this.instagramService.getMediaInsights(accountId, dataId, query);
    return {
      commentNum: res?.data?.filter(item => item.name === 'comments')[0]?.values[0]?.value || 0,
      likeNum: res?.data?.filter(item => item.name === 'likes')[0]?.values[0]?.value || 0,
      shareNum: res?.data?.filter(item => item.name === 'shares')[0]?.values[0]?.value || 0,
      viewNum: res?.data?.filter(item => item.name === 'views')[0]?.values[0]?.value || 0,
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
