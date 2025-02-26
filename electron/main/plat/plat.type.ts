/*
 * @Author: nevin
 * @Date: 2025-02-07 09:48:29
 * @LastEditTime: 2025-02-19 21:05:00
 * @LastEditors: nevin
 * @Description:
 */
import { AccountModel } from '../../db/models/account';
import { VisibleTypeEnum } from '@@/publish/PublishEnum';
import { AccountType } from '@@/AccountEnum';
import { DiffParmasType } from '../../db/models/video';

export type CookiesType = Electron.Cookie[];

// 获取平台账户信息入参
export interface IAccountInfoParams {
  cookies: CookiesType;
}

// 获取平台账户信息返回值
export type AccountInfoTypeRV = Partial<AccountModel> | null;

// 获取平台账户统计信息返回值
export type StatisticsData = {
  workCount?: number;
  readCount?: number;
  fansCount?: number;
  income?: number;
};

// 获取平台账户统计信息返回值
export type DashboardData = {
  fans: number;
  read: number;
  comment: number;
  like: number;
  collect: number;
  forward: number;
};

// 获取某个作品的数据返回值
export type WorkData = {
  readCount?: number;
  likeCount?: number;
  collectCount?: number;
  forwardCount?: number;
  commentCount?: number;
  income?: number;
};

// 发布视频入参
export interface IVideoPublishParams {
  // 调用该平台的cookies
  cookies: CookiesType;
  // 标题，有些平台没有标题
  title: string;
  // 发布视频的简介
  desc: string;
  // 话题
  topics: string[];
  // 视频的路径
  videoPath: string;
  // 封面路径
  coverPath: string;
  other?: string;
  // 可见性
  visibleType: VisibleTypeEnum;
  // 各个平台的差异化参数
  diffParams?: DiffParmasType;
  callback?: (progress: number, msg: string) => void;
}

// 获取话题返回值
export interface IGetTopicsResponse {
  status: number;
  data?: ITopicsItem[];
}

// 话题数据 item
export interface ITopicsItem {
  view_count: number;
  name: string;
  id: string | number;
}

// 话题参数
export interface IGetTopicsParams {
  keyword: string;
  account: AccountModel;
}
