import http from './request';
import { Pagination } from './types';
import { HotTopic } from './types/hotTopic';
import { Topic } from './types/topic';
import { ViralTitle } from './types/viralTitles';

export interface Platform {
  id: string;
  _id: string;
  name: string;
  icon: string;
  type: string;
  description: string;
  status: number;
  config: Record<string, any>;
  sort: number;
  createTime: string;
  updateTime: string;
}

export interface RankingItem {
  id: string;
  title: string;
  author: {
    name: string;
    avatar: string;
    followers: string;
  };
  category: {
    name: string;
    subCategory: string;
  };
  duration: string;
  views: string;
  likes: string;
  comments: string;
  engagement: string;
  thumbnail: string;
  createTime: string;
}

export interface PlatformRanking {
  _id: string;
  id: string;
  name: string;
  platformId: string;
  platform: Platform;
  type: 'daily' | 'weekly' | 'monthly';
  description: string;
  icon: string;
  status: number;
  rules: string;
  config: Record<string, any>;
  sort: number;
  updateFrequency: string;
  lastUpdateTime: string;
  createTime: string;
  updateTime: string;
  items?: RankingItem[];
}

export interface Author {
  id: string;
  name: string;
  avatar: string;
  url: string;
  fansCount: number;
}

export interface Stats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
}

export interface RankingContent {
  id: string;
  platformId: string;
  rankingId: string;
  originalId: string;
  title: string;
  type: 'article' | 'video';
  category: string;
  url: string;
  cover: string;
  description: string;
  author: Author;
  stats: Stats;
  status: number;
  publishTime: string;
  sort: number;
  rankingPosition: number;
  platform: Platform;
  ranking: PlatformRanking;
}

export interface PaginationMeta {
  itemCount: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface RankingContentsResponse {
  items: RankingContent[];
  meta: PaginationMeta;
}

export interface RankingContentsResponse {
  items: RankingContent[];
  meta: PaginationMeta;
}

export const platformApi = {
  // 获取平台列表
  getPlatformList() {
    return http.get<Platform[]>('/platform');
  },

  // 获取平台榜单列表
  getPlatformRanking(platformId: string) {
    return http.get<PlatformRanking[]>(
      `/ranking/platform?platformId=${platformId}`,
    );
  },

  // 获取榜单内容
  getRankingContents(
    rankingId: string,
    page = 1,
    pageSize = 20,
    category?: string,
    date?: string,
  ) {
    return http.get<RankingContentsResponse>(`/ranking/${rankingId}/contents`, {
      params: {
        page,
        pageSize,
        category,
        date,
      },
      isToken: false,
    });
  },

  // 获取榜单分类
  getRankingLabel(rankingId: string) {
    return http.get<string[]>(`/ranking/label/${rankingId}`, {
      isToken: false,
    });
  },

  // 获取所有热点事件
  getAllHotTopics() {
    return http.get<
      {
        platform: Platform;
        hotTopic: HotTopic;
      }[]
    >(`/hot-topics/all`, {
      isToken: false,
    });
  },

  // ---- 热门专题 ----

  // 获取所有专题标签
  getTopics() {
    return http.get<string[]>(`/topics/topics`, {
      isToken: false,
    });
  },

  // 获取所有专题类型
  getMsgType() {
    return http.get<string[]>(`/topics/msgType`, {
      isToken: false,
    });
  },

  // 获取所有专题分类
  getTopicLabels(msgType: string) {
    return http.get<string[]>(`/topics/labels/${msgType}`, {
      isToken: false,
    });
  },

  // 获取热门专题列表
  getAllTopics(params: {
    msgType?: string; // 项目类型
    type?: string; // 类型
    platformId?: string; // 平台ID
    startTime?: string; // 发布时间开始
    endTime?: string; // 发布时间结束
    topic?: string; // 话题标签
  }) {
    return http.get<Pagination<Topic>>(`/topics`, {
      isToken: false,
      params,
    });
  },

  // ---- 爆款标题 ----
  // 获取有数据的平台列表
  findPlatformsWithData() {
    return http.get<Platform[]>(`/viral-titles/platforms`, {
      isToken: false,
    });
  },

  // 获取指定平台的分类列表
  findCategoriesByPlatform(platformId: string) {
    return http.get<string[]>(
      `/viral-titles/platforms/${platformId}/categories`,
      {
        isToken: false,
      },
    );
  },

  // 获取平台下所有分类的前五条数据
  findTopByPlatformAndCategories(platformId: string) {
    return http.get<
      {
        category: string;
        titles: ViralTitle[];
      }[]
    >(`/viral-titles/platforms/${platformId}/top-by-categories`, {
      isToken: false,
    });
  },

  // 获取平台下指定分类的数据列表（分页）
  findByPlatformAndCategory(platformId: string) {
    return http.get<Pagination<ViralTitle>>(
      `/viral-titles/platforms/${platformId}/top-by-categories`,
      {
        isToken: false,
      },
    );
  },
};
