/*
 * @Author: nevin
 * @Date: 2025-02-07 09:48:29
 * @LastEditTime: 2025-03-21 22:57:17
 * @LastEditors: nevin
 * @Description:
 */
import { AccountModel } from '../../db/models/account';
import { VisibleTypeEnum } from '../../../commont/publish/PublishEnum';
import { DiffParmasType, ILableValue } from '../../db/models/video';

export type CookiesType = Electron.Cookie[];

export interface ResponsePageInfo {
  count?: number;
  hasMore: boolean;
  pcursor?: string;
}

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
  time?: string;
};

// 获取某个作品的数据返回值
export type WorkData = {
  dataId: string;
  readCount?: number;
  likeCount?: number;
  collectCount?: number;
  forwardCount?: number;
  commentCount?: number; // 评论数量
  income?: number; // 收入
  title?: string;
  desc?: string;
  coverUrl?: string;
  videoUrl?: string;
  createTime?: string;
};

// 评论
export type CommentData = {
  dataId: string;
  commentId: string;
  parentCommentId?: string; // 上级评论ID
  content: string;
  likeCount?: number; // 点赞次数
  nikeName?: string;
  headUrl?: string;
  data?: any; // 原数据
  subCommentList: CommentData[]; // 子评论
};

// 视频发布进度回调函数类型
export type VideoCallbackType = (progress: number, msg?: string) => void;

// 微信视频号活动
export interface WxSphEvent {
  eventCreatorNickname: string;
  eventTopicId: string;
  eventName: string;
}

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
  // 可见性
  visibleType: VisibleTypeEnum;
  // 各个平台的差异化参数
  diffParams?: DiffParmasType;
  // 定时发布日期
  timingTime?: Date;
  // 地点
  location?: ILocationDataItem;
  // @用户
  mentionedUserInfo?: ILableValue[];
  other?: any;
}

// 获取用户参数
export interface IGetUsersParams {
  keyword: string;
  account: AccountModel;
  page: number;
}

// 获取用户返回值
export interface IGetUsersResponse {
  status: number;
  data?: IUsersItem[];
}

// 用户数据
export interface IUsersItem {
  image: string;
  id: string;
  name: string;
  des?: string;
  unique_id?: string;
  follower_count?: number;
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

// 话题参数
export interface IGetLocationDataParams {
  keywords: string;
  latitude: number;
  longitude: number;
  cityName: string;
  cookie?: Electron.Cookie[];
  account?: AccountModel;
}

// 地点数据
export interface ILocationDataItem {
  // 地点名称
  name: string;
  // 简单地址简介
  simpleAddress: string;
  // 地址ID
  id: string;
  // 小红书特有
  poi_type?: number;
  latitude: number;
  longitude: number;
  // 市
  city: string;
}

// 获取地点数据返回值
export interface IGetLocationResponse {
  status: number;
  data?: ILocationDataItem[];
}
