export type AiToolsRankingItemType = {
  _id: string;
  rankingId: string;
  col_name: string;
  status: number;
  videoDuration: number;
  anaAdd: null | string;
  url: string;
  category: string;
  subCategory: string;
  type: null | string;
  shareCount: number;
  collectCount: null | number;
  cover: string;
  description: string;
  title: string;
  createTime: string;
  updateTime: string;
  author: {
    id: null | string;
    name: null | string;
    fansCount: null | number;
    avatar: null | string;
  };
  stats: {
    viewCount: string;
    likeCount: number;
    commentCount: number;
  };
  publishTime: string;
  rankingPosition: number;
  spider_time: null | string;
  platformId: string;
  originalId: string;
  downCount: string;
  referCount: number;
  volumeCount: number;
  exponentCount: number;
  intro: string;
  rankChange: number;
  detail: {
    公众号: number;
    抖音: number;
    视频号: number;
    小红书: number;
    快手: number;
    哔哩哔哩: number;
  };
  area: number;
  id: string;
};

export interface GetAiToolsRankingApiRes {
  items: AiToolsRankingItemType[];
}

export interface GetAiToolsRankingApiParams {
  dateType: string;
  startDate: string;
  area: string;
}
