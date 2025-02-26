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
import { PubType } from '../../commont/publish/PublishEnum';
import { IGetTopicsResponse } from '../../electron/main/plat/plat.type';
import { AccountInfo } from '@/views/account/comment';

// 创建发布记录
export async function icpCreatePubRecord(pubRecord: Partial<PubRecordModel>) {
  const res: PubRecordModel = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_CREATE_PUB_RECORD',
    pubRecord,
  );
  return res;
}

// 创建视频发布记录
export async function icpCreateVideoPubRecord(pubRecord: Partial<VideoPul>) {
  console.log('发布参数：', pubRecord);
  const res: VideoPul = await window.ipcRenderer.invoke(
    'ICP_PUBLISH_CREATE_VIDEO_PUL',
    pubRecord,
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
  const res: {
    // 0=失败 1=成功
    code: number;
    msg: string;
    dataId: string;
  }[] = await window.ipcRenderer.invoke('ICP_PUB_VIDEO', pubRecordId);
  return res;
}

// 获取发布记录列表
export async function icpGetPubRecordList(page: CorrectQuery, query?: any) {
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
