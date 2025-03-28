/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-02-22 20:39:02
 * @LastEditors: nevin
 * @Description:
 */
import { Controller, Icp, Inject } from '../core/decorators';
import { PublishService } from './service';
import { getUserInfo } from '../user/comment';
import { Between, FindOptionsWhere, Not } from 'typeorm';
import {
  backPageData,
  type CorrectQuery,
  type pubRecordListQuery,
} from '../../global/table';
import { PubRecordModel, PubStatus } from '../../db/models/pubRecord';
import { PubType } from '../../../commont/publish/PublishEnum';
import { VideoPubService } from './video/service';
import { VideoModel } from '../../db/models/video';
import platController from '../plat';
import { AccountModel } from '../../db/models/account';
import type {
  IGetLocationDataParams,
  IGetUsersParams,
} from '../plat/plat.type';
import { douyinService } from '../../plat/douyin';
import { shipinhaoService } from '../../plat/shipinhao';

@Controller()
export class PublishController {
  @Inject(PublishService)
  private readonly publishService!: PublishService;

  @Inject(VideoPubService)
  private readonly videoPubService!: VideoPubService;

  // 创建发布记录
  @Icp('ICP_PUBLISH_CREATE_PUB_RECORD')
  async createPubRecord(
    event: Electron.IpcMainInvokeEvent,
    pubRecord: PubRecordModel,
  ): Promise<any> {
    pubRecord.userId = getUserInfo().id;
    pubRecord.publishTime = new Date();
    return await this.publishService.createPubRecord(pubRecord);
  }

  // 获取发布记录列表
  @Icp('ICP_PUBLISH_GET_PUB_RECORD_LIST')
  async getPubRecordList(
    event: Electron.IpcMainInvokeEvent,
    page: CorrectQuery,
    query?: pubRecordListQuery,
  ): Promise<any> {
    const userInfo = getUserInfo();
    const filters: FindOptionsWhere<PubRecordModel> = !query
      ? {}
      : {
          ...(query.type !== undefined && { type: query.type }),
          ...(query.status === undefined
            ? { status: Not(PubStatus.UNPUBLISH) }
            : {
                status: query.status,
              }),
          ...(query.time !== undefined &&
            query.time.length === 2 &&
            Between(new Date(query.time[0]), new Date(query.time[1]))),
        };
    return await this.publishService.getPubRecordList(
      userInfo.id,
      page,
      filters,
    );
  }

  // 获取草稿列表
  @Icp('ICP_PUBLISH_GET_PUB_RECORD_DRAFTS_LIST')
  async getPubRecordDraftsList(
    event: Electron.IpcMainInvokeEvent,
    page: CorrectQuery,
    query?: {
      time?: [string, string];
      type?: PubType;
    },
  ): Promise<any> {
    const userInfo = getUserInfo();
    const filters: FindOptionsWhere<PubRecordModel> = !query
      ? {
          status: PubStatus.UNPUBLISH,
        }
      : {
          status: PubStatus.UNPUBLISH,
          ...(query.type !== undefined && { type: query.type }),
          ...(query.time !== undefined &&
            query.time.length === 2 &&
            Between(new Date(query.time[0]), new Date(query.time[1]))),
        };
    return await this.publishService.getPubRecordList(
      userInfo.id,
      page,
      filters,
    );
  }

  // 获取发布记录的发布内容列表
  @Icp('ICP_PUBLISH_GET_PUB_RECORD_ITEM_LIST')
  async getPubRecordItemList(
    event: Electron.IpcMainInvokeEvent,
    page: CorrectQuery,
    id: number,
  ): Promise<any> {
    let res = backPageData<VideoModel | never>([], 0, page);
    const pubRecordInfo = await this.publishService.getPubRecordInfo(id);
    if (!pubRecordInfo) return res;

    if (pubRecordInfo.type === PubType.VIDEO) {
      res = await this.videoPubService.getVideoPulListByPubRecordIdToShow(
        id,
        page,
      );
    } else if (pubRecordInfo.type === PubType.ARTICLE) {
      // TODO: 图文
      return res;
    }

    return res;
  }

  // 获取发布记录信息
  @Icp('ICP_PUBLISH_GET_PUB_RECORD_INFO')
  async getPubRecordInfo(
    event: Electron.IpcMainInvokeEvent,
    id: number,
  ): Promise<any> {
    return await this.publishService.getPubRecordInfo(id);
  }

  // 删除发布记录
  @Icp('ICP_PUBLISH_DEL_PUB_RECORD_BY_ID')
  async delPubRecord(event: Electron.IpcMainInvokeEvent, id: number) {
    return await this.publishService.deletePubRecordById(id);
  }

  // 获取所有平台话题
  @Icp('ICP_PUBLISH_GET_TOPIC')
  async getTopic(
    event: Electron.IpcMainInvokeEvent,
    account: AccountModel,
    keyword: string,
  ) {
    return await platController.getTopic(account, keyword);
  }

  // 获取所有平台位置数据
  @Icp('ICP_PUBLISH_GET_LOCATION')
  async getLocationData(
    event: Electron.IpcMainInvokeEvent,
    params: IGetLocationDataParams,
  ) {
    return await platController.getLocationData(params);
  }

  // 获取所有平台的用户数据
  @Icp('ICP_PUBLISH_GET_USERS')
  async getUsers(event: Electron.IpcMainInvokeEvent, params: IGetUsersParams) {
    return await platController.getUsers(params);
  }

  // 获取抖音热点数据
  @Icp('ICP_PUBLISH_GET_DOYTIN_HOT')
  async getDoytinHot(
    event: Electron.IpcMainInvokeEvent,
    account: AccountModel,
    query: string,
  ) {
    const res = await douyinService.getHotspotData({
      query: query,
      cookie: JSON.parse(account.loginCookie),
    });
    return res.data;
  }

  // 获取抖音所有热点数据
  @Icp('ICP_PUBLISH_GET_ALL_DOYTIN_HOT')
  async getDoytinHotAll(event: Electron.IpcMainInvokeEvent) {
    const res = await douyinService.getAllHotspotData();
    return res.data;
  }

  // 获取抖音的活动列表
  @Icp('ICP_PUBLISH_GET_DOUYIN_ACTIVITY')
  async getDouyinActivity(
    event: Electron.IpcMainInvokeEvent,
    account: AccountModel,
  ) {
    const res = await douyinService.getActivity(
      JSON.parse(account.loginCookie),
    );
    return res.data;
  }

  // 获取抖音的活动详情
  @Icp('ICP_PUBLISH_GET_DOUYIN_ACTIVITY_DETAILS')
  async getDouyinActivityDetails(
    event: Electron.IpcMainInvokeEvent,
    account: AccountModel,
    activity_id: string,
  ) {
    const res = await douyinService.getActivityDetails(
      JSON.parse(account.loginCookie),
      activity_id,
    );
    return res.data;
  }

  // 获取抖音活动标签
  @Icp('ICP_PUBLISH_GET_DOUYIN_ACTIVITY_TAGS')
  async getActivityTags(
    event: Electron.IpcMainInvokeEvent,
    account: AccountModel,
  ) {
    return await douyinService.getActivityTags(JSON.parse(account.loginCookie));
  }

  // 获取微信视频号的活动
  @Icp('ICP_PUBLISH_GET_WXSPH_ACTIVITY')
  async getSphActivity(
    event: Electron.IpcMainInvokeEvent,
    account: AccountModel,
    query: string,
  ) {
    return await shipinhaoService.getActivityList({
      cookie: JSON.parse(account.loginCookie),
      query,
    });
  }
}
