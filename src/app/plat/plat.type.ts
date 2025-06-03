// plat构造器参数
import { Cookie } from "undici-types";
import { SocialAccount } from "@/api/types/account.type";

export interface IPlatConstrParams {
  // cookie
  cookieList: Cookie[];
  // 代理
  proxy?: string;
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

// 视频发布进度返回值
export interface PublishProgressRes {
  // 为 -1 表示失败
  progress: number;
  msg: string;
  account: SocialAccount;
  id: number;
}
