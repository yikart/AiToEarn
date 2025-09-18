export type EngagementPlatform =
  | 'bilibili'
  | 'douyin'
  | 'facebook'
  | 'wxGzh'
  | 'instagram'
  | 'KWAI'
  | 'pinterest'
  | 'threads'
  | 'tiktok'
  | 'twitter'
  | 'xhs'
  | 'youtube';

export type EngagementMediaType = 'video' | 'image' | 'article';

export interface EngagementPostsParams {
  platform: EngagementPlatform;
  uid: string;
  page: number;
  pageSize: number;
}

export interface EngagementPostItem {
  postId: string;
  platform: EngagementPlatform;
  title: string;
  content: string;
  thumbnail: string;
  mediaType: EngagementMediaType;
  permaLink: string;
  publishTime: number; // ms timestamp
  viewCount: number;
  commentCount: number;
  likeCount: number;
  shareCount: number;
  clickCount: number;
  impressionCount: number;
  favoriteCount: number;
}

export interface EngagementPostsResponse {
  total: number;
  posts: EngagementPostItem[];
  hasMore: boolean;
}


