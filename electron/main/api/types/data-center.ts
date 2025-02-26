// 平台类型
export type PlatformType = 'douyin' | 'xhs' | 'wxSph' | 'KWAI';

// 账号信息
export interface Account {
  id: number;
  userId: string;
  type: PlatformType;
  loginCookie: string;
  loginTime: Date;
  uid: string;
  account: string;
  avatar: string;
  nickname: string;
  status: number;
  lastSyncTime?: Date;
  fansCount?: number;
  readCount?: number;
  likeCount?: number;
  collectCount?: number;
  forwardCount?: number;
  commentCount?: number;
  income?: number;
}

// 创建账号DTO
export interface CreateAccountDto {
  userId: string;
  type: PlatformType;
  loginCookie: string;
  uid: string;
  account: string;
  avatar: string;
  nickname: string;
  fansCount?: number;
  readCount?: number;
  likeCount?: number;
  collectCount?: number;
  forwardCount?: number;
  commentCount?: number;
  income?: number;
}

// 更新账号DTO
export interface UpdateAccountDto {
  loginCookie?: string;
  avatar?: string;
  nickname?: string;
  fansCount?: number;
  readCount?: number;
  likeCount?: number;
  collectCount?: number;
  forwardCount?: number;
  commentCount?: number;
  income?: number;
  status?: number;
  lastSyncTime?: Date;
}

// 视频信息
export interface Video {
  id: number;
  userId: string;
  accountId: number;
  type: PlatformType;
  title: string;
  cover: string;
  videoUrl: string;
  description: string;
  status: number;
  publishTime: Date;
  lastSyncTime?: Date;
  readCount?: number;
  likeCount?: number;
  collectCount?: number;
  forwardCount?: number;
  commentCount?: number;
  income?: number;
}

// 创建视频DTO
export interface CreateVideoDto {
  userId: string;
  accountId: number;
  type: PlatformType;
  title: string;
  cover: string;
  videoUrl: string;
  description: string;
  publishTime: Date;
  readCount?: number;
  likeCount?: number;
  collectCount?: number;
  forwardCount?: number;
  commentCount?: number;
  income?: number;
}

// 更新视频DTO
export interface UpdateVideoDto {
  title?: string;
  cover?: string;
  description?: string;
  status?: number;
  lastSyncTime?: Date;
  readCount?: number;
  likeCount?: number;
  collectCount?: number;
  forwardCount?: number;
  commentCount?: number;
  income?: number;
}

// 账号统计数据
export interface AccountStats {
  id: number;
  userId: string;
  accountId: number;
  type: PlatformType;
  fansCount: number;
  readCount: number;
  likeCount: number;
  collectCount: number;
  forwardCount: number;
  commentCount: number;
  income: number;
  createTime: Date;
}

// 创建账号统计DTO
export interface CreateAccountStatsDto {
  userId: string;
  accountId: number;
  type: PlatformType;
  fansCount: number;
  readCount: number;
  likeCount: number;
  collectCount: number;
  forwardCount: number;
  commentCount: number;
  income: number;
}

// 视频统计数据
export interface VideoStats {
  id: number;
  userId: string;
  videoId: number;
  accountId: number;
  type: PlatformType;
  readCount: number;
  likeCount: number;
  collectCount: number;
  forwardCount: number;
  commentCount: number;
  income: number;
  createTime: Date;
}

// 创建视频统计DTO
export interface CreateVideoStatsDto {
  userId: string;
  videoId: number;
  accountId: number;
  type: PlatformType;
  readCount: number;
  likeCount: number;
  collectCount: number;
  forwardCount: number;
  commentCount: number;
  income: number;
}
