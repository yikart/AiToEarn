import { Platform } from '../platform';

export interface ViralTitle {
  _id: string;
  platformId: Platform;
  category: string;
  title: string;
  url: string; // 链接
  rank: number; // 排名
  engagement: number; // 互动量
  publishTime?: Date;
  createTime: Date;
  updateTime: Date;
}
