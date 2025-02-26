import { Platform } from './platform';

// 榜单类型
export type RankingType = 'daily' | 'week' | 'month';

// 内容类型
export type ContentType = 'article' | 'video' | 'live' | 'short_video';

// 榜单状态
export type RankingStatus = 0 | 1 | -1;

// 作者信息
export interface Author {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
}

// 统计信息
export interface Stats {
  readCount: number;
  likeCount: number;
  collectCount: number;
  forwardCount: number;
  commentCount: number;
}

// 榜单信息
export interface Ranking {
  id: string;
  name: string;
  platformId: string;
  type: RankingType;
  description?: string;
  icon?: string;
  status: RankingStatus;
  rules?: string;
  config?: Record<string, any>;
  sort?: number;
  platform?: Platform;
}

// 创建榜单DTO
export interface CreateRankingDto {
  name: string;
  platformId: string;
  type: RankingType;
  description?: string;
  icon?: string;
  rules?: string;
  config?: Record<string, any>;
  sort?: number;
  status: RankingStatus;
}

// 更新榜单DTO
export interface UpdateRankingDto {
  name?: string;
  description?: string;
  icon?: string;
  rules?: string;
  config?: Record<string, any>;
  sort?: number;
  status?: RankingStatus;
}

// 榜单内容
export interface RankingContent {
  id: string;
  rankingId: string;
  platformId: string;
  type: ContentType;
  title: string;
  cover?: string;
  url: string;
  description?: string;
  author?: Author;
  stats?: Stats;
  status: RankingStatus;
  publishTime?: Date;
  sort?: number;
  rankingPosition?: number;
  platform?: Platform;
  ranking?: Ranking;
}

// 创建榜单内容DTO
export interface CreateRankingContentDto {
  rankingId: string;
  platformId: string;
  type: ContentType;
  title: string;
  cover?: string;
  url: string;
  description?: string;
  author?: Author;
  stats?: Stats;
  publishTime?: Date;
  sort?: number;
  rankingPosition?: number;
  status: RankingStatus;
}

// 更新榜单内容DTO
export interface UpdateRankingContentDto {
  title?: string;
  cover?: string;
  url?: string;
  description?: string;
  author?: Author;
  stats?: Stats;
  publishTime?: Date;
  sort?: number;
  rankingPosition?: number;
  status?: RankingStatus;
}
