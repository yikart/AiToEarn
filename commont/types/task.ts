/*
 * @Author: nevin
 * @Date: 2025-02-22 12:27:40
 * @LastEditTime: 2025-03-03 17:59:13
 * @LastEditors: nevin
 * @Description:
 */
import { TimeTemp } from './apiServer';

export enum TaskType {
  PRODUCT = 'product', // 商品任务
  ARTICLE = 'article', // 文章任务
  PROMOTION = 'promotion', // 拉新任务
  VIDEO = 'video', // 拉新任务
}

export const TaskTypeName = new Map([
  [TaskType.PRODUCT, '商品'],
  [TaskType.ARTICLE, '文章'],
  [TaskType.PROMOTION, '拉新'],
]);

export enum TaskStatus {
  ACTIVE = 'active', // 激活
  COMPLETED = 'completed', // 完成
  CANCELLED = 'cancelled', // 取消
}
export const TaskStatusName = new Map([
  [TaskStatus.ACTIVE, '激活'],
  [TaskStatus.COMPLETED, '完成'],
  [TaskStatus.CANCELLED, '取消'],
]);

interface TaskData {
  title: string;
  desc?: string;
}
export interface TaskVideo extends TaskData {
  videoUrl: string;
}
export interface TaskPromotion extends TaskData {}
export interface TaskProduct extends TaskData {
  price: number;
  sales?: number;
}

export type TaskDataInfo = TaskProduct | TaskPromotion | TaskVideo;
export interface Task<T extends TaskProduct | TaskPromotion | TaskVideo>
  extends TimeTemp {
  _id: string;
  id: string;
  title: string;
  description: string;
  type: TaskType;
  dataInfo: T;
  imageUrl: string;
  keepTime: number; // 保持时间(秒)
  requiresShoppingCart: boolean; // 是否需要挂购物车
  maxRecruits: number; // 最大招募人数
  currentRecruits: number; // 当前招募人数
  deadline: string; // 任务截止时间
  firstTimeBonus: number; // 首次任务奖励
  reward: number; // 任务奖励金额
  status: TaskStatus; // 'active' | 'completed' | 'cancelled'
  platforms: string[]; // 支持的平台ID列表
  isAccepted?: boolean; // 是否已经接受任务
}
