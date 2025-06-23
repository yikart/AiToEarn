// plat构造器参数
import { SocialAccount } from "@/api/types/account.type";
import { IPubParams } from "@/app/[lng]/publish/videoPage/videoPage.type";
import { IVideoFile } from "@/app/[lng]/publish/components/Choose/VideoChoose";

export interface IPlatConstrParams {
  access_token: string;
  refresh_token: string;
  account?: SocialAccount;
}

export interface IMixItem {
  id: string;
  name: string;
  coverImg: string;
  // 作品数量
  feedCount: number;
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

// 发布进度返回值
export interface PublishProgressRes {
  // 为 -1 表示失败
  progress: number;
  msg: string;
  account: SocialAccount;
  id: string;
}

// 视频发布
export interface IVideoPublishItem extends IPubParams {
  video: IVideoFile;
}

// 发布进度
export type PubProgressType = (progress: number, msg: string) => void;

// 发布结果
export interface IPublishResult {
  // 是否成功
  success: boolean;
  // 失败消息
  failMsg?: string;
  worksId: string;
  worksUrl: string;
}

// 视频发布参数
export interface PublishVideoParams {
  videoPubParams: IVideoPublishItem;
  access_token: string;
  refresh_token: string;
  // 账户
  account: SocialAccount;
}
