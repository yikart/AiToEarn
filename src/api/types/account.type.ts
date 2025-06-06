import { PlatType } from "@/app/config/platConfig";

// 三方账户类型定义
export interface SocialAccount {
  id: number;
  type: PlatType;
  loginCookie?: string;
  access_token?: string;
  refresh_token?: string;
  loginTime: string;
  uid: string;
  account: string;
  avatar: string;
  nickname: string;
  fansCount: number;
  readCount: number;
  likeCount: number;
  collectCount: number;
  forwardCount: number;
  commentCount: number;
  lastStatsTime: string;
  workCount: number;
  income: number;
  status: number;
  createTime: string;
  updateTime: string;
  rank: number;
  groupId: number;
}

// 更新账户统计数据
export interface UpdateAccountStatisticsParams {
  id: number;
  fansCount: number;
  readCount: number;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  income: number;
  workCount: number;
}

// 账户组 item 数据
export interface AccountGroupItem {
  id: number;
  name: string;
  rank: number;
  isDefault: boolean;
}
