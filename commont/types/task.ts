/*
 * @Author: nevin
 * @Date: 2025-02-22 12:27:40
 * @LastEditTime: 2025-02-22 20:01:29
 * @LastEditors: nevin
 * @Description:
 */
import { TimeTemp } from './apiServer';

export enum TaskType {
  PRODUCT = 'product', // 商品任务
  ARTICLE = 'article', // 文章任务
  PROMOTION = 'promotion', // 拉新任务
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

export interface Task extends TimeTemp {
  _id: string;
  id: string;
  title: string;
  description: string;
  type: TaskType;
  imageUrl: string;
  price: number;
  sales: number;
  productLevel: string; // 带货等级
  applicantCount: number; // 报名人数
  requiresShoppingCart: boolean; // 是否需要挂购物车
  cooperationRequirements: {
    requiresShoppingCart?: boolean; // 需挂车
    batchMaterialPublishing?: boolean; // 使用成片素材一键发布
    requiresQrCodeScan?: boolean; // 需要扫描二维码
    requiresScreenshot?: boolean; // 需要上传截图
  };
  commission: number; // 佣金比例
  maxRecruits: number; // 最大招募人数
  currentRecruits: number; // 当前招募人数
  deadline: Date; // 任务截止时间
  firstTimeBonus: number; // 首次任务奖励
  reward: number; // 任务奖励金额
  status: TaskStatus; // 'active' | 'completed' | 'cancelled'
  requirements: string[];
  platforms: string[]; // 支持的平台ID列表
  platformRequirements?: Record<string, any>; // 平台特定要求，如视频时长、标签等
  metadata: Record<string, any>; // 额外的任务相关信息
}
