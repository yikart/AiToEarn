import { Pagination } from './types';
import { HotTopic } from './types/hotTopic';
import { Topic } from './types/topic';
import { ViralTitle } from './types/viralTitles';
import { request } from '@/utils/request';
import { APP_HOT_URL } from '@/constant';
import {
  GetAiToolsRankingApiParams,
  GetAiToolsRankingApiRes,
} from './types/platform.type';

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
  parentId: string;
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
  watchCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
}

export interface RankingContent {
  id: string;
  title: string;
  cover: string;
  url: string;
  rankingPosition: number;
  category: string;
  publishTime: string;
  author: {
    name: string;
    avatar: string;
    fansCount: number;
  };
  stats: Stats;
  anaAdd: {
    addCollectedCunt: number;
    addCommentCount: number;
    addInteractiveCount: number;
    addLikeCount: number;
    addShareCount: number;
    addViewCount: number | null;
    collectedCount: number;
    interactiveCount: number;
    pred_readnum: number;
    useCollectCount: number;
    useCommentCount: number;
    useLikeCount: number;
    useShareCount: number;
    useViewCount: number | null;
  };
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
    return request<Platform[]>({
      url: `hotdata/hotinfo/platform`,
      method: 'GET'
    });
  },

  // 获取平台榜单列表
  getPlatformRanking(platformId: string) {
    return request<PlatformRanking[]>({
      url: `hotdata/ranking/platform?platformId=${platformId}`,
      method: 'GET'
    });
  },

  // 获取榜单内容
  getRankingContents(
    rankingId: string,
    page = 1,
    pageSize = 20,
    category?: string,
    date?: string,
  ) {
    const params: Record<string, any> = {
      page,
      pageSize,
    };

    if (category && category !== '全部') {
      params.category = category;
    }

    if (date) {
      params.date = date;
    }

    return request<RankingContentsResponse>({
      url: `hotdata/ranking/${rankingId}/contents`,
      method: 'GET',
      params,
    });
  },

  // 获取榜单分类
  getRankingLabel(rankingId: string) {
    return request<string[]>({
      url: `hotdata/ranking/label/${rankingId}`,
      method: 'GET',
      
    });
  },

  // 获取榜单日期
  getRankingDates(rankingId: string) {
    return request<string[]>({
      url: `hotdata/ranking/hotinfo/${rankingId}/dates`,
      method: 'GET',
      
    });
  },

  // 获取八大平台热点事件
  getAllHotTopics() {
    return request<{
      platform: Platform;
      hotTopic: HotTopic;
    }[]>({
      url: `hotdata/hot-topics/all`,
      method: 'GET',
      
    });
  },

  // ---- 热门专题 ----

  // 获取所有专题标签
  getTopics() {
    return request<string[]>({
      url: `hotdata/topics/topics`,
      method: 'GET',
      
    });
  },

  // 获取所有专题类型1
  getMsgType() {
    return request<string[]>({
      url: `hotdata/topics/msgType`,
      method: 'GET',
      
    });
  },

  // 获取所有专题分类
  getTopicLabels(msgType: string) {
    return request<string[]>({
      url: `hotdata/topics/labels/${msgType}`,
      method: 'GET',
      
    });
  },

  // 获取专题的时间类型
  getTopicTimeTypes(msgType: string) {
    return request<string[]>({
      url: `hotdata/topics/timeType/${msgType}`,
      method: 'GET',
      
    });
  },

  // 获取热门专题列表
  getAllTopics(params: {
    msgType?: string; // 项目类型
    timeType?: string; // 时间分类
    type?: string; // 类型
    platformId?: string; // 平台ID
    startTime?: string; // 发布时间开始
    endTime?: string; // 发布时间结束
    topic?: string; // 话题标签
    page?: number;
    pageSize?: number;
  }) {
    return request<Pagination<Topic>>({
      url: `hotdata/topics`,
      method: 'GET',
      
      params,
    });
  },

  // ---- 爆款标题 ----
  // 获取有数据的平台列表
  findPlatformsWithData() {
    return request<Platform[]>({
      url: `hotdata/viral-titles/platforms`,
      method: 'GET',
      
    });
  },

  // 获取指定平台的分类列表
  findCategoriesByPlatform(platformId: string) {
    return request<string[]>({
      url: `hotdata/viral-titles/platforms/${platformId}/categories`,
      method: 'GET',
      
    });
  },

  // 获取平台下所有分类的前五条数据
  findTopByPlatformAndCategories(
    platformId: string,
    timeType?: string, // 时间分类
  ) {
    return request<{
      category: string;
      titles: ViralTitle[];
    }[]>({
      url: `hotdata/viral-titles/platforms/${platformId}/top-by-categories`,
      method: 'GET',
      
      params: {
        timeType,
      },
    });
  },

  // 获取爆款标题平台下指定分类的数据列表（分页）
  findByPlatformAndCategory(
    platformId: string,
    params: {
      category?: string;
      startTime?: Date;
      endTime?: Date;
      timeType?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    return request<Pagination<ViralTitle>>({
      url: `hotdata/viral-titles/platforms/${platformId}`,
      method: 'GET',
      
      params,
    });
  },

  // 获取爆款标题的时间类型
  getViralTitleTimeTypes() {
    return request<string[]>({
      url: `hotdata/viral-titles/timeType`,
      method: 'GET',
      
    });
  },

  // ---- 话题 ----
  // 获取有数据的平台列表
  findTalksPlatforms() {
    return request<Platform[]>({
      url: `hotdata/talks/platforms`,
      method: 'GET',
      
    });
  },

  // 获取话题栏目
  findTalksColumn(platformId: string) {
    return request<string[]>({
      url: `hotdata/talks/column`,
      method: 'GET',
      params: {
        platformId,
      },
      
    });
  },

  // 获取小红书话题流量榜、流量扶持日期
  getXhsDates() {
    return request<string[]>({
      url: `hotdata/xhs/dates`,
      method: 'GET',
      
    });
  },

  // 获取小红书话题流量榜、流量扶持分类
  getXhsCategories() {
    return request<string[]>({
      url: `hotdata/xhs/category`,
      method: 'GET',
      
    });
  },

  // 获取小红书话题流量榜
  getXhsSubjectsRank(data: { phone: string }) {
    return request<string>({
      url: `hotdata/xhs/contents`,
      method: 'POST',
      data,
      
    });
  },

  // 获取抖音榜单日期
  getDyDates() {
    return request<string[]>({
      url: `hotdata/dy/dates`,
      method: 'GET',
      
    });
  },

  // 获取AI工具榜数据
  getAiToolsRankingApi(data: GetAiToolsRankingApiParams) {
    return request<GetAiToolsRankingApiRes>({
      url: `hotdata/products/ranking/ai`,
      method: 'POST',
      data: {
        ...data,
        pageSize: 100,
        area: +data.area,
      },
    });
  },
};
