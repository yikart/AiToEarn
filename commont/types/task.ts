/*
 * @Author: nevin
 * @Date: 2025-02-22 12:27:40
 * @LastEditTime: 2025-03-03 17:59:13
 * @LastEditors: nevin
 * @Description: 任务
 */
import { AccountType } from '../AccountEnum';
import { TimeTemp } from './apiServer';

export enum TaskType {
  PRODUCT = 'product', // 挂车市场任务
  ARTICLE = 'article', // 文章任务
  PROMOTION = 'promotion', // 推广任务
  VIDEO = 'video', // 视频任务
  INTERACTION = 'interaction', // 互动任务
}

export const TaskTypeName = new Map([
  [TaskType.PRODUCT, '挂车市场任务'],
  [TaskType.ARTICLE, '文章任务'],
  [TaskType.PROMOTION, '推广任务'],
  [TaskType.VIDEO, '视频任务'],
  [TaskType.INTERACTION, '互动任务'],
]);

export enum TaskStatus {
  ACTIVE = 'active', // 激活
  COMPLETED = 'completed', // 完成
  CANCELLED = 'cancelled', // 取消
}
export const TaskStatusName = new Map([
  [TaskStatus.ACTIVE, '进行中'],
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

export interface TaskArticle extends TaskData {
  imageList: string[];
  topicList: string[];
}

export interface TaskPromotion extends TaskData {}

export interface TaskProduct extends TaskData {
  price: number;
  sales?: number;
}

export interface TaskInteraction extends TaskData {
  accountType: AccountType; // 平台类型
  worksId: string; // 作品ID
  authorId?: string; // 作者ID
  commentContent?: string; // 评论内容,不填则使用AI
}

export type TaskDataInfo =
  | TaskProduct
  | TaskPromotion
  | TaskVideo
  | TaskArticle
  | TaskInteraction;
export interface Task<T extends TaskDataInfo> extends TimeTemp {
  _id: string;
  id: string;
  screenshotUrls: any;
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
  accountTypes: AccountType[];
  isAccepted?: boolean; // 是否已经接受任务
  requirement?: string;
}
