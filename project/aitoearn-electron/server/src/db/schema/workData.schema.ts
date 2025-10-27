import { Prop, Schema } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';
import { AccountType } from './account.schema';

export enum PubStatus {
  UNPUBLISH = 0, // 未发布/草稿
  RELEASED = 1, // 已发布
  FAIL = 2, // 发布失败
}

export interface ILableValue {
  label: string;
  value: string | number;
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

export interface WxSphEvent {
  eventCreatorNickname: string;
  eventTopicId: string;
  eventName: string;
}

export enum DeclarationDouyin {
  // 内容由AI生成
  AIGC = 'aigc',
  // 可能会引人不适
  MaybeUnsuitable = 'maybe_unsuitable',
  // 虚拟作品。仅供娱乐
  OnlyFunNew = 'only_fun_new',
  // 危险行为，请勿模仿
  DangerousBehavior = 'dangerous_behavior',
  // 内容自行拍摄
  SelfShoot = 'self_shoot',
  // 内容取材网络
  FromNetV3 = 'from_net_v3',
}

export type DiffParmasType = {
  [AccountType.Xhs]?: object;
  [AccountType.Douyin]?: {
    // 申请关联的热点
    hotPoint?: ILableValue;
    // 申请关联的活动
    activitys?: ILableValue[];
    // 自主声明
    selfDeclare?: DeclarationDouyin;
  };
  [AccountType.WxSph]?: {
    // 是否为原创
    isOriginal?: boolean;
    // 扩展链接
    extLink?: string;
    // 活动
    activity?: WxSphEvent;
  };
  [AccountType.KWAI]?: object;
};

// 可见性
export enum VisibleTypeEnum {
  // 所有人可见
  Public = 1,
  // 仅自己可见
  Private = 2,
  // 好友可见
  Friend = 3,
}

@Schema()
export class WorkData extends TimeTemp {
  @Prop({
    required: true,
    unique: true,
    index: true,
    type: Number,
  })
  id: number;

  @Prop({
    required: false,
  })
  dataId?: string;

  @Prop({
    required: true,
    index: true,
    type: String,
  })
  userId: string;

  @Prop({
    required: false,
    type: Date,
  })
  lastStatsTime?: Date; // 最后统计时间

  @Prop({
    required: false,
    type: String,
  })
  previewVideoLink: string; // 预览地址，这个值是发布完成手动拼接的

  @Prop({
    required: true,
    index: true,
    type: Number,
  })
  pubRecordId: number; // 发布记录id,对应PubRecord表id

  @Prop({
    required: true,
    index: true,
    type: Number,
  })
  accountId: number; // 账号id

  @Prop({
    required: true,
    enum: AccountType,
    index: true,
  })
  type: AccountType; // 平台类型

  @Prop({
    required: false,
    type: Date,
  })
  publishTime?: Date; // 发布时间

  @Prop({
    required: false,
    type: Object,
  })
  otherInfo?: Record<string, any>; // 其他信息

  @Prop({
    required: false,
  })
  failMsg?: string; // 发布失败原因（如果失败）

  @Prop({
    required: true,
    enum: PubStatus,
    default: PubStatus.UNPUBLISH,
  })
  status: PubStatus;

  @Prop({
    required: true,
    default: 0,
  })
  readCount: number;

  @Prop({
    required: true,
    default: 0,
  })
  likeCount: number;

  @Prop({
    required: true,
    default: 0,
  })
  collectCount: number;

  @Prop({
    required: true,
    default: 0,
  })
  forwardCount: number;

  @Prop({
    required: true,
    default: 0,
  })
  commentCount: number;

  @Prop({
    required: true,
    default: 0,
  })
  income: number;

  // 以下为发布需要的参数 --------------------------------------------------------------------
  @Prop({
    required: false,
  })
  title?: string; // 标题

  @Prop({
    required: false,
  })
  desc?: string; // 简介，简介中不该包含话题，如果有需要每个平台再自己做处理。

  @Prop({
    required: false,
  })
  coverPath?: string; // 封面路径，机器的本地路径

  @Prop({
    required: false,
    type: Object,
  })
  mixInfo?: ILableValue; // 合集

  @Prop({
    required: true,
    type: [String],
  })
  topics: string[]; // 话题 格式：['话题1', '话题2']，不该包含 ‘#’

  @Prop({
    required: false,
    type: Object,
  })
  location?: ILocationDataItem; // 位置

  /**
   * 差异化参数
   * 所有平台有通用参数，如：标题、话题、简介
   * 也有每个平台自己独有的参数，如：抖音活动奖励、抖音热点、视频号声明原创
   */
  @Prop({
    required: false,
    type: Object,
  })
  diffParams?: DiffParmasType;

  @Prop({
    required: true,
    enum: VisibleTypeEnum,
    default: VisibleTypeEnum.Private,
  })
  visibleType?: VisibleTypeEnum;

  @Prop({
    required: false,
    type: Date,
  })
  timingTime?: Date; // 定时发布日期

  @Prop({
    required: false,
    type: Object,
  })
  cookies?: Record<string, any>;
}
