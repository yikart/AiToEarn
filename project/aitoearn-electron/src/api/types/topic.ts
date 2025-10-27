export interface Topic {
  _id: string;
  title: string; // 话题标题
  description?: string;
  category: string;
  subCategory: string;
  url: string; // 作品链接
  author?: string; // 作者
  topics: string[]; // 话题标签
  rank: number;
  coverUrl?: string;
  shareCount: number;
  likeCount: number;
  watchingCount: number;
  readCount: number;
  publishTime?: Date;
  createTime: Date;
  updateTime: Date;
}
