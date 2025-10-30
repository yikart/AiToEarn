import { PlatType } from "@/app/config/platConfig";

export enum AccountType {
  Douyin = 'douyin', // 抖音
  Xhs = 'xhs', // 小红书
  WxSph = 'wxSph', // 微信视频号
  KWAI = 'KWAI', // 快手
  YOUTUBE = 'youtube', // youtube
  WxGzh = 'wxGzh', // 微信公众号
  BILIBILI = 'bilibili', // B站
  Twitter = 'twitter', // 推特
  TikTok = 'tiktok', // TikTok
  Facebook = 'facebook', // Facebook
  Instagram = 'instagram', // Instagram
  Threads = 'threads', // Threads
}

// 三方账户类型定义
export interface SocialAccount {
  id: string;
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
  groupId: string;
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
  id: string;
  name: string;
  rank: number;
  isDefault: boolean;
  proxyIp?: string;
  ip?: string;
  location?: string;
}
