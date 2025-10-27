/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: WorkData
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { AccountType } from 'src/db/schema/account.schema';
import {
  DiffParmasType,
  ILableValue,
  ILocationDataItem,
  PubStatus,
  VisibleTypeEnum,
} from 'src/db/schema/workData.schema';

export class CreateWorkDataDto {
  dataId?: string;
  userId: string;
  lastStatsTime?: Date; // 最后统计时间
  previewVideoLink: string; // 预览地址，这个值是发布完成手动拼接的
  pubRecordId: number; // 发布记录id,对应PubRecord表id
  accountId: number; // 账号id
  type: AccountType; // 平台类型
  publishTime?: Date; // 发布时间
  otherInfo?: Record<string, any>; // 其他信息
  failMsg?: string; // 发布失败原因（如果失败）
  status: PubStatus;
  readCount: number;
  likeCount: number;
  collectCount: number;
  forwardCount: number;
  commentCount: number;
  income: number;
  title?: string; // 标题
  desc?: string; // 简介，简介中不该包含话题，如果有需要每个平台再自己做处理。
  coverPath?: string; // 封面路径，机器的本地路径
  mixInfo?: ILableValue; // 合集
  topics: string[]; // 话题 格式：['话题1', '话题2']，不该包含 ‘#’
  location?: ILocationDataItem; // 位置
  diffParams?: DiffParmasType;
  visibleType?: VisibleTypeEnum;
  timingTime?: Date; // 定时发布日期
  cookies?: Record<string, any>;

  // @ApiProperty({ title: '视频路径', required: false })
  // @IsString({ message: '视频路径必须是一个字符串' })
  // @IsOptional()
  // @Expose()
  // readonly videoPath: string;
}
