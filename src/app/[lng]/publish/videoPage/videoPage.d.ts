import { SocialAccount } from "@/api/types/account.type";
import { PlatType } from "@/app/config/platConfig";
import { IImgFile } from "@/app/[lng]/publish/imagePage/imagePage.type";
import { VisibleTypeEnum } from "@/app/config/publishConfig";
import { IVideoFile } from "@/app/[lng]/publish/components/Choose/VideoChoose";

// 微信视频号活动
export interface WxSphEvent {
  eventCreatorNickname: string;
  eventTopicId: string;
  eventName: string;
}

/**
 * 不同平台的差异化参数
 * 每个平台有相同点，有不同点，这不同点都在这个参数下集合
 */
export type DiffParmasType = {
  [PlatType.Xhs]?: {};
  [PlatType.Douyin]?: {
    // 申请关联的热点
    hotPoint?: ILableValue;
    // 申请关联的活动
    activitys?: ILableValue[];
    // 自主声明
    selfDeclare?: DeclarationDouyin;
  };
  [PlatType.WxSph]?: {
    // 是否为原创
    isOriginal?: boolean;
    // 扩展链接
    extLink?: string;
    // 活动
    activity?: WxSphEvent;
  };
  [PlatType.KWAI]?: {};
};

// 自主声明
export enum DeclarationDouyin {
  // 内容由AI生成
  AIGC = "aigc",
  // 可能会引人不适
  MaybeUnsuitable = "maybe_unsuitable",
  // 虚拟作品。仅供娱乐
  OnlyFunNew = "only_fun_new",
  // 危险行为，请勿模仿
  DangerousBehavior = "dangerous_behavior",
  // 内容自行拍摄
  SelfShoot = "self_shoot",
  // 内容取材网络
  FromNetV3 = "from_net_v3",
}

// 包含一个name和一个value的对象
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

export interface IPubParams {
  // 视频标题
  title?: string;
  // 视频描述
  describe?: string;
  // 视频封面
  cover?: IImgFile;
  // 查看权限
  visibleType?: VisibleTypeEnum;
  // 视频话题
  topics?: string[];
  // 每个平台的差异性参数
  diffParams?: DiffParmasType;
  // 位置
  location?: ILocationDataItem;
  // 定时发布日期
  timingTime?: Date;
  // @用户
  mentionedUserInfo?: ILableValue[];
  // 合集
  mixInfo?: ILableValue;
}

// 选择视频的每项数据
export interface IVideoChooseItem {
  // 选择的视频
  video?: IVideoFile;
  // 选择的账户
  account?: SocialAccount;
  // 发布参数
  pubParams: IPubParams;
  // 唯一id
  id: string;
}

export type AccountInfo = SocialAccount;
