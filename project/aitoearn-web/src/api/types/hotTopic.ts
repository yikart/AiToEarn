import { Platform } from '../hot';

export interface HotValueHistory {
  updateTime: string; // 记录时间
  hotValue: number; // 热度值
}

export interface HotTopic {
  _id: string;
  platformId: Platform; // 关联平台ID
  title: string; // 话题标题
  hotValue: number; // 当前热度值
  url: string; // 话题链接
  rank: number; // 当前排名
  rankChange: number; // 排名变化值（正数表示上升，负数表示下降）
  isRising: boolean; // 是否上升趋势
  hotValueHistory: HotValueHistory[]; // 热度值历史记录
  fetchTime: Date; // 数据抓取时间
  createTime: Date;
  updateTime: Date;
}
