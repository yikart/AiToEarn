/*
 * @Author: nevin
 * @Date: 2025-01-23 15:48:14
 * @LastEditTime: 2025-02-17 21:32:38
 * @LastEditors: nevin
 * @Description: publish 发布
 */

import { CorrectQuery, CorrectResponse } from '@/global/table';
import { PubRecordModel } from '@/views/publish/comment';
import { VideoPul } from '@/views/publish/children/videoPage/comment';
import { AccountType } from '../../commont/AccountEnum';
import { PubStatus, PubType } from '../../commont/publish/PublishEnum';
import {
  type IGetLocationDataParams,
  IGetLocationResponse,
  IGetMixListResponse,
  IGetTopicsResponse,
  type IGetUsersParams,
  IGetUsersResponse,
} from '../../electron/main/plat/plat.type';
import { AccountInfo, AccountPlatInfoMap } from '@/views/account/comment';
import { AccountModel } from '../../electron/db/models/account';
import {
  DouyinActivityDetailResponse,
  DouyinActivityListResponse,
  DouyinActivityTagsResponse,
  DouyinAllHotDataResponse,
  DouyinHotDataResponse,
} from '../../electron/plat/douyin/douyin.type';
import { IRequestNetResult } from '../../electron/plat/requestNet';
import { WeChatVideoApiResponse } from '../../electron/plat/shipinhao/wxShp.type';
import { parseTopicString } from '../utils';
import { PublishVideoResult } from '../../electron/main/plat/module';
import { ImgTextModel } from '../../electron/db/models/imgText';
import type { pubRecordListQuery } from '../../electron/global/table';

export const PubStatusCnMap = {
  [PubStatus.UNPUBLISH]: '未发布',
  [PubStatus.RELEASED]: '已发布',
  [PubStatus.FAIL]: '发布失败',
  [PubStatus.PartSuccess]: '部分成功',
  [PubStatus.Audit]: '审核中',
};

// 创建发布记录
export async function icpCreatePubRecord(pubRecord: Partial<PubRecordModel>) {
  console.log('创建发布记录：', pubRecord);
  const res: PubRecordModel = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_CREATE_PUB_RECORD',
    {
      ...pubRecord,
      id: undefined,
      status: PubStatus.UNPUBLISH,
    },
  );
  return res;
}

// 创建图文发布记录
export async function icpCreateImgTextPubRecord(
  pubRecord: Partial<ImgTextModel>,
) {
  const platInfo = AccountPlatInfoMap.get(pubRecord.type!)!;
  const { topics, cleanedString } = parseTopicString(pubRecord.desc || '');
  pubRecord.topics = [...new Set(pubRecord.topics?.concat(topics))];
  pubRecord.desc = cleanedString;
  pubRecord.imagesPath = [...pubRecord.imagesPath!].splice(
    0,
    platInfo.commonPubParamsConfig.imgTextConfig?.imagesMax,
  );
  console.log('创建图文发布记录：', pubRecord);
  const res: ImgTextModel = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_CREATE_IMG_TEXT_PUL',
    {
      ...pubRecord,
      id: undefined,
    },
  );
  return res;
}

/**
 * 创建视频发布记录
 * 这个函数中做了一些处理
 * 1. 将描述中的标题取出，并且放到话题字段，再去重
 * @param pubRecord
 */
export async function icpCreateVideoPubRecord(pubRecord: Partial<VideoPul>) {
  const { topics, cleanedString } = parseTopicString(pubRecord.desc || '');
  pubRecord.topics = [...new Set(pubRecord.topics?.concat(topics))];
  pubRecord.desc = cleanedString;
  console.log('创建视频发布记录：', pubRecord);
  const res: VideoPul = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_CREATE_VIDEO_PUL',
    {
      ...pubRecord,
      id: undefined,
    },
  );
  return res;
}

// 获取图文发布记录
export async function icpGetImgTextList(pubRecordId: number) {
  const res: ImgTextModel[] = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_IMG_TEXT_LIST',
    pubRecordId,
  );
  return res;
}

// 获取视频发布记录
export async function icpGetPubVideoRecord(pubRecordId: number) {
  const res: VideoPul[] = await window.ipcRenderer.invoke(
    'ICP_PUB_GET_VIDEO_RECORD',
    pubRecordId,
  );
  return res;
}

// 发布视频
export async function icpPubVideo(pubRecordId: number) {
  const res: PublishVideoResult[] = await window.ipcRenderer.invoke(
    'ICP_PUB_VIDEO',
    pubRecordId,
  );
  return res;
}

// 发布图文
export async function icpPubImgText(pubRecordId: number) {
  const res: PublishVideoResult[] = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_IMG_TEXT',
    pubRecordId,
  );
  return res;
}

// 获取发布记录列表
export async function icpGetPubRecordList(
  page: CorrectQuery,
  query?: pubRecordListQuery,
) {
  const res: CorrectResponse<PubRecordModel> = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_PUB_RECORD_LIST',
    page,
    query,
  );
  return res;
}

// 获取草稿列表
export async function icpGetPubRecordDraftsList(
  page: CorrectQuery,
  query?: any,
) {
  const res: CorrectResponse<PubRecordModel> = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_PUB_RECORD_DRAFTS_LIST',
    page,
    query,
  );
  return res;
}

// 获取发布记录信息
export async function icpGetPubRecordInfo(id: number) {
  const res: PubRecordModel = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_PUB_RECORD_INFO',
    id,
  );
  return res;
}

// 获取发布记录信息
export async function icpGetPubRecordItemList(page: CorrectQuery, id: number) {
  const res: CorrectResponse<VideoPul | never> =
    await window.ipcRenderer.invoke(
      'ICP_PUBLISH_GET_PUB_RECORD_ITEM_LIST',
      page,
      id,
    );
  return res;
}

/**
 * 获取视频发布列表
 * @returns
 * @param page
 * @param query
 */
export async function icpGetVideoPulList(
  page: CorrectQuery,
  query: { type?: AccountType; time?: [string, string]; title?: string },
) {
  const res: CorrectResponse<VideoPul> = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_VIDEO_PUL_LIST',
    page,
    query,
  );
  return res;
}

// 获取发布的视频信息
export async function icpGetVideoPulInfo(id: number) {
  const res: VideoPul = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_VIDEO_PUL_INFO',
    id,
  );
  return res;
}

// 获取不同类型的视频发布的总数
export async function icpGetVideoPulTypeCount(type?: AccountType) {
  const res: number = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_VIDEO_PUL_TYPE_COUNT',
    type,
  );
  return res;
}

// 删除发布草稿
export async function icpPublishDelPubRecordById(id: number) {
  const res: boolean = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_DEL_PUB_RECORD_BY_ID',
    id,
  );
  return res;
}

// 删除草稿中的项目
const delItemIpcMap = new Map([
  [PubType.VIDEO, 'ICP_PUBLISH_DEL_PUB_RECORD_ITEM_VIDEO'],
]);
export async function icpPublishDelPubRecordItem(
  id: number,
  type: PubType,
  accountId: number,
) {
  const ipcStr = delItemIpcMap.get(type);
  if (!ipcStr) return false;

  const res: boolean = await window.ipcRenderer.invoke(ipcStr, id, accountId);
  return res;
}

// 获取各个平台话题
export async function icpGetTopic(account: AccountInfo, keyword: string) {
  const res: IGetTopicsResponse = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_TOPIC',
    account,
    keyword,
  );
  return res;
}

// 获取合集数据
export async function icpGetMixList(account: AccountInfo) {
  const res: IGetMixListResponse = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_MIX_LIST',
    account,
  );
  return res;
}

// 获取各个平台位置数据
export async function icpGetLocationData(params: IGetLocationDataParams) {
  const res: IGetLocationResponse = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_LOCATION',
    params,
  );
  return res;
}

// 获取抖音热点数据
export async function icpGetDoytinHot(account: AccountModel, query: string) {
  const res: DouyinHotDataResponse = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_DOYTIN_HOT',
    account,
    query,
  );
  return res;
}

// 获取抖音所有热点数据
export async function icpGetDoytinHotAll() {
  const res: DouyinAllHotDataResponse = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_ALL_DOYTIN_HOT',
  );
  return res;
}

// 获取抖音的活动列表
export async function icpGetDouyinActivity(account: AccountModel) {
  const res: DouyinActivityListResponse = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_DOUYIN_ACTIVITY',
    account,
  );
  return res;
}

// 获取抖音的活动详情
export async function getDouyinActivityDetails(
  account: AccountModel,
  activity_id: string,
) {
  const res: DouyinActivityDetailResponse = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_DOUYIN_ACTIVITY_DETAILS',
    account,
    activity_id,
  );
  return res;
}

// 获取抖音活动标签
export async function icpGetActivityTags(account: AccountModel) {
  const res: IRequestNetResult<DouyinActivityTagsResponse> =
    await window.ipcRenderer.invoke(
      'ICP_PUBLISH_GET_DOUYIN_ACTIVITY_TAGS',
      account,
    );
  return res;
}

// 获取微信视频号的活动列表
export async function getSphActivity(account: AccountModel, query: string) {
  const res: IRequestNetResult<WeChatVideoApiResponse> =
    await window.ipcRenderer.invoke(
      'ICP_PUBLISH_GET_WXSPH_ACTIVITY',
      account,
      query,
    );
  return res;
}

// 获取所有平台的用户数据
export async function icpGetUsers(params: IGetUsersParams) {
  const res: IGetUsersResponse = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_GET_USERS',
    params,
  );
  return res;
}
