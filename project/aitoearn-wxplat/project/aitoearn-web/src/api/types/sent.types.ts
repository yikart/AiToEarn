// Sent界面相关的类型定义

export interface SentPost {
  postId: string;
  platform: string;
  title: string;
  content: string;
  thumbnail: string;
  mediaType: 'video' | 'image' | 'article';
  permaLink: string;
  publishTime: number; // 时间戳，毫秒级
  viewCount: number;
  commentCount: number;
  likeCount: number;
  shareCount: number;
  clickCount: number;
  impressionCount: number;
  favoriteCount: number;
}

export interface SentPostsResponse {
  code: number;
  message: string;
  url: string;
  data: {
    total: number;
    posts: SentPost[];
    hasMore: boolean;
  };
}

export interface SentPostsParams {
  platform: string;
  uid: string;
  page: number;
  pageSize: number;
}
