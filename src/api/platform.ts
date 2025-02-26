import http from './request';

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
  getRankingCategories(rankingId: string) {
    return http.get<any[]>(`/ranking/${rankingId}/categories`, {
      isToken: false,
    });
  },
};
