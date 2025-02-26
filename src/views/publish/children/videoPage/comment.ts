/*
 * @Author: nevin
 * @Date: 2025-01-23 23:15:08
 * @LastEditTime: 2025-02-10 13:24:38
 * @LastEditors: nevin
 * @Description:
 */

import { AccountType } from '../../../../../commont/AccountEnum';
import { VisibleTypeEnum } from '../../../../../commont/publish/PublishEnum';
import {
  DiffParmasType,
  TopicsArrType,
} from '../../../../../electron/db/models/video';

export interface VideoPul {
  id: number;
  userId: string;
  type: AccountType;
  accountId: number;
  pubRecordId: number;
  title: string;
  desc: string;
  publishTime: Date;
  failMsg: string;
  videoPath: string;
  coverPath: string;
  otherInfo: Record<string, any>;
  createTime?: Date;
  updateTime?: Date;
  status: number;
  visibleType: VisibleTypeEnum;
  topics: TopicsArrType;
  diffParams?: DiffParmasType;
}
