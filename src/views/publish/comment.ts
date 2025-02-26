/*
 * @Author: nevin
 * @Date: 2025-02-05 17:43:14
 * @LastEditTime: 2025-02-17 17:50:44
 * @LastEditors: nevin
 * @Description:
 */

import { PubType } from '../../../commont/publish/PublishEnum';

export interface PubRecordModel {
  id: number;
  userId: string;
  type: PubType;
  title: string;
  topics: string[];
  desc: string;
  videoPath: string;
  coverPath: string;
  publishTime: Date;
  status: any;
  createTime?: Date;
  updateTime?: Date;
}
